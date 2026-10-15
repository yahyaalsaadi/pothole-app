import { useCallback, useEffect, useMemo, useState } from 'react'
import { DetailSheet } from './components/DetailSheet'
import { Leaderboard } from './components/Leaderboard'
import { MapView } from './components/MapView'
import { ReportSheet } from './components/ReportSheet'
import { store } from './data'
import { I18nContext, makeI18n, type Lang } from './i18n'
import { daysUnfixed } from './lib/days'
import type { Report } from './types'

const initialLang = (): Lang => {
  try {
    const saved = localStorage.getItem('bpm-lang')
    if (saved === 'ar' || saved === 'en') return saved
  } catch { /* storage blocked */ }
  return navigator.language.startsWith('ar') ? 'ar' : 'en'
}

export function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const i = useMemo(() => makeI18n(lang), [lang])
  const { t } = i
  const [reports, setReports] = useState<Report[]>([])
  const [tab, setTab] = useState<'map' | 'list'>('map')
  const [reporting, setReporting] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => store.subscribe(setReports), [])
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.title = t.title
    try { localStorage.setItem('bpm-lang', lang) } catch { /* storage blocked */ }
  }, [lang, t.title])
  useEffect(() => {
    if (!toastMsg) return
    const id = setTimeout(() => setToastMsg(null), 2800)
    return () => clearTimeout(id)
  }, [toastMsg])

  const select = useCallback((id: string) => setSelected(id), [])
  const open = reports.filter((r) => r.status === 'open')
  const avg = open.length ? Math.round(open.reduce((s, r) => s + daysUnfixed(r), 0) / open.length) : 0
  const current = reports.find((r) => r.id === selected)

  return (
    <I18nContext.Provider value={i}>
      <div className="wrap">
        <header>
          <div className="brand">
            <div className="mark" aria-hidden="true"><i /></div>
            <div><h1>{t.title}</h1><p className="sub">{t.tagline}</p></div>
          </div>
          <button type="button" className="lang" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>{t.switchLang}</button>
        </header>
        <div className="stripe" aria-hidden="true" />
        {!store.shared && <p className="demo">{t.demo}</p>}

        <div className="stats">
          <div className="stat"><b>{i.num(open.length)}</b><span>{t.statOpen}</span></div>
          <div className="stat"><b>{i.num(avg)}</b><span>{t.statDays}</span></div>
          <div className="stat"><b>{i.num(reports.length - open.length)}</b><span>{t.statFixed}</span></div>
        </div>

        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'map'} onClick={() => setTab('map')}>{t.tabMap}</button>
          <button role="tab" aria-selected={tab === 'list'} onClick={() => setTab('list')}>{t.tabList}</button>
        </div>

        <section className="stack" hidden={tab !== 'map'}>
          <MapView reports={reports} onSelect={select} />
          <div className="legend">
            <span><i className="dot sev-fresh" />{t.legendFresh}</span>
            <span><i className="dot sev-old" />{t.legendOld}</span>
            <span><i className="dot sev-ancient" />{t.legendAncient}</span>
            <span><i className="dot sev-fixed" />{t.legendFixed}</span>
          </div>
          {reports.length === 0 && (
            <div className="empty"><h3>{t.emptyTitle}</h3><p>{t.emptyBody}</p></div>
          )}
        </section>
        {tab === 'list' && <Leaderboard reports={reports} onSelect={select} />}
      </div>

      <button type="button" className="fab" onClick={() => setReporting(true)}>
        <span aria-hidden="true">＋</span>{t.report}
      </button>

      {reporting && (
        <ReportSheet store={store} onClose={() => setReporting(false)} onPosted={() => { setReporting(false); setToastMsg(t.posted) }} />
      )}
      {current && <DetailSheet report={current} store={store} onClose={() => setSelected(null)} toast={setToastMsg} />}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </I18nContext.Provider>
  )
}
