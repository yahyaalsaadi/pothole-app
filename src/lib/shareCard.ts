import type { I18n } from '../i18n'
import type { Report } from '../types'
import { daysUnfixed } from './days'

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })

/** A 1080×1350 portrait image (Instagram/Facebook feed size) for a report. */
export async function renderShareCard(r: Report, i: I18n): Promise<Blob> {
  const { t } = i
  await document.fonts?.ready
  const c = document.createElement('canvas')
  c.width = 1080
  c.height = 1350
  const x = c.getContext('2d')!
  x.fillStyle = '#1d2124'
  x.fillRect(0, 0, 1080, 1350)

  const img = await loadImage(r.status === 'fixed' && r.fixedPhotoUrl ? r.fixedPhotoUrl : r.photoUrl)
  if (img) {
    const target = 1080 / 860
    let sw = img.width, sh = img.height, sx = 0, sy = 0
    if (img.width / img.height > target) { sw = img.height * target; sx = (img.width - sw) / 2 }
    else { sh = img.width / target; sy = (img.height - sh) / 2 }
    x.drawImage(img, sx, sy, sw, sh, 0, 0, 1080, 860)
  }
  // Hazard stripe under the photo.
  for (let k = -1; k < 40; k++) {
    x.fillStyle = k % 2 ? '#f2b600' : '#1d2124'
    x.beginPath()
    x.moveTo(k * 36, 860); x.lineTo(k * 36 + 36, 860); x.lineTo(k * 36 + 18, 884); x.lineTo(k * 36 - 18, 884)
    x.fill()
  }

  const rtl = i.lang === 'ar'
  x.direction = rtl ? 'rtl' : 'ltr'
  x.textAlign = rtl ? 'right' : 'left'
  const X = rtl ? 1020 : 60
  const n = daysUnfixed(r)
  const fixed = r.status === 'fixed'
  const display = '"Readex Pro", "IBM Plex Sans Arabic", sans-serif'
  const body = '"IBM Plex Sans Arabic", sans-serif'

  x.fillStyle = fixed ? '#4cb57b' : '#f0632f'
  x.font = `700 150px ${display}`
  x.fillText(fixed ? t.cardFixed : i.num(n), X, 1050)
  x.fillStyle = '#eceee9'
  x.font = `500 46px ${display}`
  x.fillText(fixed ? `${t.fixedAfter} ${i.num(n)} ${t.days}` : t.daysUnfixed, X, 1115)
  x.font = `600 40px ${body}`
  x.fillText(`${i.districtName(r.district)}${rtl ? '، ' : ', '}${t.cityName}`, X, 1180)
  x.fillStyle = '#b9c0bc'
  x.font = `400 30px ${body}`
  let line = fixed && r.fixedBy ? `${t.fixedCredit}: ${r.fixedBy}` : `${t.responsible}: ${i.responsibleBody(r)}`
  if (line.length > 62) line = line.slice(0, 60) + '…'
  x.fillText(line, X, 1232)
  x.fillStyle = '#f2b600'
  x.font = `700 30px ${display}`
  x.fillText(`${t.title} · ${t.hashtag}`, X, 1300)

  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('encode_failed'))), 'image/jpeg', 0.9),
  )
}

/** Share through the phone's share sheet when it supports files, otherwise download the image. */
export async function shareOrDownload(blob: Blob, filename: string, text: string): Promise<void> {
  const file = new File([blob], filename, { type: 'image/jpeg' })
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], text }); return } catch (e) {
      if ((e as DOMException).name === 'AbortError') return
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
}
