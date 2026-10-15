import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { NewReport, Report, Store } from '../types'

interface Row {
  id: string
  created_at: string
  lat: number
  lng: number
  district: string
  road: 'street' | 'highway'
  note: string | null
  photo_path: string
  status: 'open' | 'fixed'
  fixed_at: string | null
  fixed_photo_path: string | null
  fixed_by: string | null
  confirm_count: number
}

export class StoreError extends Error {}

export function createSupabaseStore(url: string, anonKey: string): Store {
  const sb: SupabaseClient = createClient(url, anonKey)
  const photoUrl = (path: string) => sb.storage.from('photos').getPublicUrl(path).data.publicUrl

  // Everyone gets a silent anonymous account so reports, confirmations and
  // the daily limit can be tied to a person without a sign-up form.
  let userId: Promise<string> | null = null
  const ensureUser = () =>
    (userId ??= (async () => {
      const { data } = await sb.auth.getSession()
      if (data.session) return data.session.user.id
      const { data: signed, error } = await sb.auth.signInAnonymously()
      if (error || !signed.user) { userId = null; throw new StoreError('sign_in_failed') }
      return signed.user.id
    })())

  async function upload(blob: Blob): Promise<string> {
    const uid = await ensureUser()
    const path = `${uid}/${crypto.randomUUID()}.jpg`
    const { error } = await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' })
    if (error) throw new StoreError('upload_failed')
    return path
  }

  async function fetchAll(): Promise<Report[]> {
    const { data, error } = await sb
      .from('reports_public').select('*').order('created_at', { ascending: false }).limit(2000)
    if (error) throw new StoreError('load_failed')
    let mine = new Set<string>()
    const { data: session } = await sb.auth.getSession()
    if (session.session) {
      const { data: c } = await sb.from('confirmations').select('report_id').eq('user_id', session.session.user.id)
      mine = new Set((c ?? []).map((x) => x.report_id as string))
    }
    return (data as Row[]).map((r) => ({
      id: r.id,
      createdAt: Date.parse(r.created_at),
      lat: r.lat,
      lng: r.lng,
      district: r.district,
      road: r.road,
      note: r.note ?? '',
      photoUrl: photoUrl(r.photo_path),
      status: r.status,
      fixedAt: r.fixed_at ? Date.parse(r.fixed_at) : null,
      fixedPhotoUrl: r.fixed_photo_path ? photoUrl(r.fixed_photo_path) : null,
      fixedBy: r.fixed_by,
      confirmCount: r.confirm_count,
      confirmedByMe: mine.has(r.id),
    }))
  }

  const listeners = new Set<(r: Report[]) => void>()
  const refresh = () => fetchAll().then((r) => listeners.forEach((l) => l(r))).catch(() => {})

  return {
    shared: true,
    subscribe(onChange) {
      listeners.add(onChange)
      refresh()
      const channel = sb.channel('reports')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, refresh)
        .subscribe()
      return () => { listeners.delete(onChange); sb.removeChannel(channel) }
    },
    async add(n: NewReport) {
      const path = await upload(n.photo)
      const { error } = await sb.from('reports').insert({
        lat: n.lat, lng: n.lng, district: n.district, road: n.road, note: n.note || null, photo_path: path,
      })
      if (error) throw new StoreError(error.message.includes('daily_limit') ? 'daily_limit' : 'insert_failed')
      await refresh()
    },
    async confirm(id) {
      await ensureUser()
      const { error } = await sb.from('confirmations').insert({ report_id: id })
      if (error && error.code !== '23505') throw new StoreError('confirm_failed') // 23505: already confirmed
      await refresh()
    },
    async markFixed(id, afterPhoto, fixedBy) {
      await ensureUser()
      const path = afterPhoto ? await upload(afterPhoto) : ''
      const { error } = await sb.rpc('mark_fixed', { report: id, after_photo: path, fixed_by_name: fixedBy })
      if (error) throw new StoreError('fix_failed')
      await refresh()
    },
  }
}
