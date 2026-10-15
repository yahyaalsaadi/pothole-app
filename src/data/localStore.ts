import type { NewReport, Report, Store } from '../types'

// Demo mode: everything lives in this browser's localStorage, so the app runs
// with no backend. Photos are kept as small data URLs.
const KEY = 'bpm-demo-reports'

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

export function createLocalStore(): Store {
  const listeners = new Set<(r: Report[]) => void>()
  const load = (): Report[] => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
  }
  const save = (reports: Report[]) => {
    localStorage.setItem(KEY, JSON.stringify(reports))
    listeners.forEach((l) => l(reports))
  }
  const update = (id: string, patch: Partial<Report>) =>
    save(load().map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return {
    shared: false,
    subscribe(onChange) {
      listeners.add(onChange)
      onChange(load())
      return () => listeners.delete(onChange)
    },
    async add(n: NewReport) {
      const report: Report = {
        id: crypto.randomUUID(), createdAt: Date.now(), lat: n.lat, lng: n.lng, district: n.district,
        road: n.road, note: n.note, photoUrl: await toDataUrl(n.photo), status: 'open',
        fixedAt: null, fixedPhotoUrl: null, fixedBy: null, confirmCount: 0, confirmedByMe: false,
      }
      save([report, ...load()])
    },
    async confirm(id) {
      const r = load().find((x) => x.id === id)
      if (r && !r.confirmedByMe) update(id, { confirmedByMe: true, confirmCount: r.confirmCount + 1 })
    },
    async markFixed(id, afterPhoto, fixedBy) {
      update(id, {
        status: 'fixed', fixedAt: Date.now(), fixedBy: fixedBy || null,
        fixedPhotoUrl: afterPhoto ? await toDataUrl(afterPhoto) : null,
      })
    },
  }
}
