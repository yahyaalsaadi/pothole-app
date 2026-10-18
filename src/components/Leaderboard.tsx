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

  if (open.length === 0) return <p className="hint">{t.emptyTitle}</p>

  return (
    <>
      <section className="section">
        <h3 className="section-title">{t.worstDistricts}</h3>
        <ol className="rank">
          {top.map(([id, s], k) => (
            <li key={id}>
              <span className="rank-n">{i.num(k + 1)}</span>
              <span className="rank-body">
                <span className="rank-head"><b>{i.districtName(id)}</b><span>{i.num(s.n)} {t.open}</span></span>
                <span className="bar"><i style={{ width: `${(s.n / max) * 100}%` }} /></span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <section className="section">
        <h3 className="section-title">{t.oldest}</h3>
        <div className="list">
          {oldest.map((r) => (
            <button key={r.id} type="button" className="row" onClick={() => onSelect(r.id)}>
              <img src={r.photoUrl} alt="" loading="lazy" />
              <span className="t"><b>{i.districtName(r.district)}</b><small>{r.note || i.responsibleBody(r)}</small></span>
              <span className={`days-pill sev-bg-${severity(r)}`}>{i.num(daysUnfixed(r))}<small>{t.days}</small></span>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
