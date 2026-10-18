import { useCallback, useEffect, useMemo, useState } from 'react'
import { DetailSheet } from './components/DetailSheet'
import { Leaderboard } from './components/Leaderboard'
import { MapView } from './components/MapView'
import { ReportSheet } from './components/ReportSheet'
import { Sheet } from './components/Sheet'
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
  const [listOpen, setListOpen] = useState(false)
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

  const select = useCallback((id: string) => { setListOpen(false); setSelected(id) }, [])
  const open = reports.filter((r) => r.status === 'open')
  const avg = open.length ? Math.round(open.reduce((s, r) => s + daysUnfixed(r), 0) / open.length) : 0
  const current = reports.find((r) => r.id === selected)

  return (
    <I18nContext.Provider value={i}>
      <div className="app">
        <MapView className="map-full" reports={reports} onSelect={select} />

        <header className="topbar">
          <div className="brand">
            <span className="mark" aria-hidden="true"><i /></span>
            <span className="brand-text">
              <h1>{t.title}</h1>
            </span>
          </div>
          <button type="button" className="lang" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>{t.switchLang}</button>
        </header>

        <div className="statbar" aria-live="polite">
          {!store.shared && <span className="stat demo-chip" title={t.demo}>{t.demoShort}</span>}
          <span className="stat"><b>{i.num(open.length)}</b> {t.statOpen}</span>
          <span className="stat"><b>{i.num(avg)}</b> {t.avgShort}</span>
          <span className="stat"><i className="dot sev-fixed" /><b>{i.num(reports.length - open.length)}</b> {t.statFixed}</span>
        </div>

        {reports.length === 0 && (
          <div className="empty-card">
            <h3>{t.emptyTitle}</h3>
            <p>{t.emptyBody}</p>
          </div>
        )}

        <div className="dock">
          <button type="button" className="dock-list" onClick={() => setListOpen(true)} aria-label={t.showList}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h6" /></svg>
            <span>{t.showList}</span>
          </button>
          <button type="button" className="dock-report" onClick={() => setReporting(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
            <span>{t.report}</span>
          </button>
        </div>
      </div>

      {listOpen && (
        <Sheet title={t.showList} onClose={() => setListOpen(false)}>
          <Leaderboard reports={reports} onSelect={select} />
        </Sheet>
      )}
      {reporting && (
        <ReportSheet store={store} onClose={() => setReporting(false)} onPosted={() => { setReporting(false); setToastMsg(t.posted) }} />
      )}
      {current && <DetailSheet report={current} store={store} onClose={() => setSelected(null)} toast={setToastMsg} />}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </I18nContext.Provider>
  )
}
