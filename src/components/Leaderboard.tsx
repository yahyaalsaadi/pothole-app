import { useI18n } from '../i18n'
import { daysUnfixed, severity } from '../lib/days'
import type { Report } from '../types'

export function Leaderboard({ reports, onSelect }: { reports: Report[]; onSelect: (id: string) => void }) {
  const i = useI18n()
  const { t } = i
  const open = reports.filter((r) => r.status === 'open')

  const byDistrict = new Map<string, { n: number; days: number }>()
  for (const r of open) {
    const s = byDistrict.get(r.district) ?? { n: 0, days: 0 }
    s.n++
    s.days += daysUnfixed(r)
    byDistrict.set(r.district, s)
  }
  const top = [...byDistrict].sort((a, b) => b[1].n - a[1].n || b[1].days - a[1].days).slice(0, 10)
  const max = top[0]?.[1].n ?? 1
  const oldest = [...open].sort((a, b) => daysUnfixed(b) - daysUnfixed(a)).slice(0, 15)

  return (
    <section className="stack">
      <h2>{t.worstDistricts}</h2>
      {top.length === 0 && <div className="empty"><p>{t.emptyTitle}</p></div>}
      <div className="list">
        {top.map(([id, s]) => (
          <div key={id} className="district">
            <b>{i.districtName(id)}</b>
            <span className="hint">{i.num(s.n)} {t.open} · {i.num(Math.round(s.days / s.n))} {t.days}</span>
            <div className="bar"><i style={{ width: `${(s.n / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
      <h2>{t.oldest}</h2>
      <div className="list">
        {oldest.map((r) => (
          <button key={r.id} type="button" className="row" onClick={() => onSelect(r.id)}>
            <img src={r.photoUrl} alt="" loading="lazy" />
            <span className="t"><b>{i.districtName(r.district)}</b><small>{r.note || i.responsibleBody(r)}</small></span>
            <span className={`days sev-${severity(r)}`}>{i.num(daysUnfixed(r))}<small>{t.days}</small></span>
          </button>
        ))}
      </div>
    </section>
  )
}
