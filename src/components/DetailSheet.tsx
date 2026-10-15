import { useState } from 'react'
import { useI18n } from '../i18n'
import { daysUnfixed, severity } from '../lib/days'
import { renderShareCard, shareOrDownload } from '../lib/shareCard'
import type { Report, Store } from '../types'
import { PhotoPicker } from './PhotoPicker'
import { Sheet } from './Sheet'

export function DetailSheet({ report: r, store, onClose, toast }: { report: Report; store: Store; onClose: () => void; toast: (m: string) => void }) {
  const i = useI18n()
  const { t } = i
  const [after, setAfter] = useState<Blob | null>(null)
  const [fixedBy, setFixedBy] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const n = daysUnfixed(r)
  const fixed = r.status === 'fixed'
  const dn = i.districtName(r.district)
  const body = i.responsibleBody(r)
  const text = t.shareText(dn, i.num(n), body)
  const enc = encodeURIComponent(text)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try { await fn() } catch { toast(t.saveFailed) } finally { setBusy(false) }
  }

  return (
    <Sheet title={dn} onClose={onClose}>
      {fixed && r.fixedPhotoUrl ? (
        <div className="ba">
          <figure><img src={r.photoUrl} alt="" /><figcaption>{t.before}</figcaption></figure>
          <figure><img src={r.fixedPhotoUrl} alt="" /><figcaption>{t.after}</figcaption></figure>
        </div>
      ) : (
        <img className="hero-photo" src={r.photoUrl} alt="" />
      )}

      {fixed ? (
        <div className="counter">
          <span className="chip fixed">✓ {t.legendFixed}</span>
          <span>{t.fixedAfter} {i.num(n)} {t.days}</span>
        </div>
      ) : (
        <div className="counter">
          <b className={`sev-${severity(r)}`}>{i.num(n)}</b>
          <span>{n === 1 && i.lang === 'en' ? t.dayUnfixed : t.daysUnfixed}</span>
        </div>
      )}

      <dl className="meta">
        <dt>{t.district}</dt><dd>{dn}</dd>
        <dt>{t.responsible}</dt><dd>{body}</dd>
        {r.note && (<><dt>{t.note}</dt><dd>{r.note}</dd></>)}
        <dt>{t.reported}</dt><dd>{i.date(r.createdAt)}</dd>
        {fixed && r.fixedBy && (<><dt>{t.fixedCredit}</dt><dd>{r.fixedBy}</dd></>)}
      </dl>

      {!fixed && (
        <div className="btns center">
          <button type="button" className="ghost" disabled={busy || r.confirmedByMe} onClick={() => run(() => store.confirm(r.id))}>
            {r.confirmedByMe ? t.confirmed : t.confirm}
          </button>
          <span className="hint">{i.num(r.confirmCount)} {t.confirmations}</span>
        </div>
      )}

      <div className="box">
        <span className="lbl">{t.share}</span>
        <span className="hint">{t.shareHint}</span>
        <div className="btns">
          <button type="button" disabled={busy} onClick={() => run(async () => {
            const blob = await renderShareCard(r, i)
            await shareOrDownload(blob, `pothole-${r.district}-${n}-days.jpg`, text)
          })}>{t.saveImage}</button>
          <button type="button" onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true), () => toast(text))}>
            {copied ? t.copied : t.copyText}
          </button>
          <a href={`https://wa.me/?text=${enc}`} target="_blank" rel="noopener">WhatsApp</a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${enc}`} target="_blank" rel="noopener">Telegram</a>
          <a href={`https://twitter.com/intent/tweet?text=${enc}`} target="_blank" rel="noopener">X</a>
        </div>
      </div>

      {!fixed && (
        <details className="box">
          <summary className="lbl">{t.fixedQ}</summary>
          <span className="hint">{t.fixedHint}</span>
          <span className="lbl">{t.afterPhoto}</span>
          <PhotoPicker onPick={(p) => setAfter(p)} onError={toast} />
          <label className="lbl" htmlFor="fixedby">{t.fixedBy}</label>
          <input id="fixedby" type="text" maxLength={80} placeholder={t.fixedByPlaceholder} value={fixedBy} onChange={(e) => setFixedBy(e.target.value)} />
          <button type="button" className="primary" disabled={busy} onClick={() => run(async () => {
            await store.markFixed(r.id, after, fixedBy.trim())
            toast(`✓ ${t.legendFixed}`)
            onClose()
          })}>{t.markFixed}</button>
        </details>
      )}
    </Sheet>
  )
}
