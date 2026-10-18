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
  const sev = severity(r)
  const dn = i.districtName(r.district)
  const body = i.responsibleBody(r)
  const text = t.shareText(dn, i.num(n), body)
  const enc = encodeURIComponent(text)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try { await fn() } catch { toast(t.saveFailed) } finally { setBusy(false) }
  }
  const share = () => run(async () => {
    const blob = await renderShareCard(r, i)
    await shareOrDownload(blob, `pothole-${r.district}-${n}-days.jpg`, text)
  })

  return (
    <Sheet title={dn} onClose={onClose}>
      {fixed && r.fixedPhotoUrl ? (
        <div className="ba">
          <figure><img src={r.photoUrl} alt="" /><figcaption>{t.before}</figcaption></figure>
          <figure><img src={r.fixedPhotoUrl} alt="" /><figcaption>{t.after}</figcaption></figure>
        </div>
      ) : (
        <div className={`photo-hero sev-bg-${sev}`}>
          <img src={r.photoUrl} alt="" />
          <div className="photo-badge">
            {fixed ? (
              <><b>✓</b><span>{t.fixedAfter} {i.num(n)} {t.days}</span></>
            ) : (
              <><b>{i.num(n)}</b><span>{n === 1 && i.lang === 'en' ? t.dayUnfixed : t.daysUnfixed}</span></>
            )}
          </div>
        </div>
      )}

      <div className="owner">
        <span className="owner-label">{fixed && r.fixedBy ? t.fixedCredit : t.responsible}</span>
        <span className="owner-name">{fixed && r.fixedBy ? r.fixedBy : body}</span>
      </div>

      {r.note && <p className="note">{r.note}</p>}
      <p className="meta-line">
        {t.reported} {i.date(r.createdAt)}
        {!fixed && <> · {i.num(r.confirmCount)} {t.confirmations}</>}
      </p>

      <div className="actions">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={share}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v7h14v-7" /></svg>
          {t.shareNow}
        </button>
        {!fixed && (
          <button type="button" className="btn btn-secondary" disabled={busy || r.confirmedByMe} onClick={() => run(() => store.confirm(r.id))}>
            {r.confirmedByMe ? `✓ ${t.confirmed}` : t.confirm}
          </button>
        )}
      </div>

      <div className="share-row" aria-label={t.more}>
        <a className="chip" href={`https://wa.me/?text=${enc}`} target="_blank" rel="noopener">WhatsApp</a>
        <a className="chip" href={`https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${enc}`} target="_blank" rel="noopener">Telegram</a>
        <a className="chip" href={`https://twitter.com/intent/tweet?text=${enc}`} target="_blank" rel="noopener">X</a>
        <button type="button" className="chip" onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true), () => toast(text))}>
          {copied ? t.copied : t.copyText}
        </button>
      </div>

      {!fixed && (
        <details className="fix-box">
          <summary>{t.fixedQ}</summary>
          <div className="fix-body">
            <span className="hint">{t.fixedHint}</span>
            <span className="lbl">{t.afterPhoto}</span>
            <PhotoPicker onPick={(p) => setAfter(p)} onError={toast} />
            <label className="lbl" htmlFor="fixedby">{t.fixedBy}</label>
            <input id="fixedby" type="text" maxLength={80} placeholder={t.fixedByPlaceholder} value={fixedBy} onChange={(e) => setFixedBy(e.target.value)} />
            <button type="button" className="btn btn-fixed" disabled={busy} onClick={() => run(async () => {
              await store.markFixed(r.id, after, fixedBy.trim())
              toast(`✓ ${t.legendFixed}`)
              onClose()
            })}>{t.markFixed}</button>
          </div>
        </details>
      )}
    </Sheet>
  )
}
