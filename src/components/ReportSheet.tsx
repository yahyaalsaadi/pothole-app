import { useState } from 'react'
import { inBaghdad, nearestDistrict } from '../districts'
import { useI18n } from '../i18n'
import { photoGps } from '../lib/photo'
import type { RoadType, Store } from '../types'
import { MapView } from './MapView'
import { PhotoPicker } from './PhotoPicker'
import { Sheet } from './Sheet'

export function ReportSheet({ store, onClose, onPosted }: { store: Store; onClose: () => void; onPosted: () => void }) {
  const i = useI18n()
  const { t } = i
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [road, setRoad] = useState<RoadType>('street')
  const [note, setNote] = useState('')
  const [gpsMsg, setGpsMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const district = pin ? nearestDistrict(pin.lat, pin.lng) : null

  const locate = () => {
    if (!navigator.geolocation) { setGpsMsg(t.locationDenied); return }
    setGpsMsg(t.locating)
    navigator.geolocation.getCurrentPosition(
      (p) => { setPin({ lat: p.coords.latitude, lng: p.coords.longitude }); setGpsMsg('') },
      () => setGpsMsg(t.locationDenied),
      { enableHighAccuracy: true, timeout: 15_000 },
    )
  }

  const submit = async () => {
    if (!photo || !pin || !district) { setError(t.needBoth); return }
    if (!inBaghdad(pin.lat, pin.lng)) { setError(t.outside); return }
    setBusy(true)
    setError('')
    try {
      await store.add({ lat: +pin.lat.toFixed(6), lng: +pin.lng.toFixed(6), district, road, note: note.trim().slice(0, 200), photo })
      onPosted()
    } catch (e) {
      setError((e as Error).message === 'daily_limit' ? t.dailyLimit : t.saveFailed)
      setBusy(false)
    }
  }

  return (
    <Sheet title={t.report} onClose={onClose}>
      <div className="field">
        <span className="lbl">{t.photo}</span>
        <PhotoPicker
          onError={setError}
          onPick={async (p, original) => {
            setPhoto(p)
            setError('')
            const gps = await photoGps(original)
            if (gps && inBaghdad(gps.lat, gps.lng)) { setPin(gps); setGpsMsg(t.gpsYes) }
            else setGpsMsg(pin ? '' : t.gpsNo)
          }}
        />
      </div>

      <div className="field">
        <span className="lbl">{t.where}</span>
        <div className="row-between">
          <span className="hint">{t.whereHint}</span>
          <button type="button" className="chip chip-action" onClick={locate}>{t.useMyLocation}</button>
        </div>
        {gpsMsg && <p className="hint">{gpsMsg}</p>}
        <MapView className="map-mini" pin={pin} onPick={(lat, lng) => setPin({ lat, lng })} />
        <span className="hint">{t.district}: <b>{district ? i.districtName(district) : '—'}</b></span>
      </div>

      <div className="field">
        <span className="lbl">{t.road}</span>
        <div className="seg">
          {(['street', 'highway'] as const).map((k) => (
            <button key={k} type="button" aria-pressed={road === k} onClick={() => setRoad(k)}>
              {k === 'street' ? t.street : t.highway}
              <small>{k === 'street' ? t.streetHint : t.highwayHint}</small>
            </button>
          ))}
        </div>
        <div className="owner">
          <span className="hint">{t.responsible}: </span>
          {district ? i.responsibleBody({ road, district }) : '—'}
        </div>
      </div>

      <div className="field">
        <label htmlFor="note" className="lbl">{t.noteLabel}</label>
        <textarea id="note" rows={2} maxLength={200} placeholder={t.notePlaceholder} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      {error && <p className="err" role="alert">{error}</p>}
      <button type="button" className="btn btn-primary btn-block" disabled={busy || !photo || !pin} onClick={submit}>
        {busy ? t.posting : t.post}
      </button>
    </Sheet>
  )
}
