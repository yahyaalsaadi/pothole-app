import { useEffect, useRef } from 'react'
import maplibregl, { type Map as MlMap, type Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { BAGHDAD_CENTER } from '../districts'
import { daysUnfixed, severity } from '../lib/days'
import type { Report } from '../types'

// CARTO Voyager basemap (OpenStreetMap data): free for low-traffic,
// non-commercial use. Before a large launch, move to a paid tile plan
// (CARTO, MapTiler, Stadia) or self-hosted Protomaps.
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['a', 'b', 'c', 'd'].map((sd) => `https://${sd}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png`),
      tileSize: 256,
      maxzoom: 20,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

interface Props {
  reports?: Report[]
  onSelect?: (id: string) => void
  /** When set, the map is a location picker: taps move the pin. */
  pin?: { lat: number; lng: number } | null
  onPick?: (lat: number, lng: number) => void
  className?: string
}

export function MapView({ reports = [], onSelect, pin, onPick, className }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<MlMap | null>(null)
  const markers = useRef<Marker[]>([])
  const pinMarker = useRef<Marker | null>(null)
  const fitted = useRef(false)
  const pickRef = useRef(onPick)
  pickRef.current = onPick

  useEffect(() => {
    const m = new maplibregl.Map({
      container: box.current!,
      style: STYLE,
      center: BAGHDAD_CENTER,
      zoom: 11,
      minZoom: 9,
      maxBounds: [[43.9, 32.9], [44.9, 33.8]],
      attributionControl: { compact: true },
    })
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    m.on('click', (e) => pickRef.current?.(e.lngLat.lat, e.lngLat.lng))
    map.current = m
    fitted.current = false
    return () => m.remove()
  }, [])

  // Report pins: HTML markers showing the days-unfixed count. Fine for a few
  // thousand reports; switch to a clustered GeoJSON layer beyond that.
  useEffect(() => {
    const m = map.current
    if (!m) return
    markers.current.forEach((mk) => mk.remove())
    markers.current = reports.map((r) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = `pin pin-${severity(r)}`
      const n = daysUnfixed(r)
      const label = document.createElement('span')
      label.textContent = r.status === 'fixed' ? '✓' : n > 999 ? '999+' : String(n)
      el.append(label)
      el.setAttribute('aria-label', `${n}`)
      el.addEventListener('click', (ev) => { ev.stopPropagation(); onSelect?.(r.id) })
      return new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([r.lng, r.lat]).addTo(m)
    })
    // On the first load with reports, frame them all, keeping clear of the floating bars.
    if (!fitted.current && reports.length > 0 && !onPick) {
      fitted.current = true
      const b = new maplibregl.LngLatBounds()
      reports.forEach((r) => b.extend([r.lng, r.lat]))
      const fit = () => m.fitBounds(b, { padding: { top: 170, bottom: 230, left: 50, right: 50 }, maxZoom: 14, duration: 0 })
      if (m.isStyleLoaded()) fit()
      else m.once('load', fit)
    }
  }, [reports, onSelect])

  useEffect(() => {
    const m = map.current
    if (!m) return
    if (!pin) { pinMarker.current?.remove(); pinMarker.current = null; return }
    if (!pinMarker.current) {
      const el = document.createElement('div')
      el.className = 'pick-pin'
      pinMarker.current = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([pin.lng, pin.lat]).addTo(m)
    } else pinMarker.current.setLngLat([pin.lng, pin.lat])
    if (!m.getBounds().contains([pin.lng, pin.lat]) || m.getZoom() < 14) m.flyTo({ center: [pin.lng, pin.lat], zoom: 15 })
  }, [pin])

  // Maps are always left-to-right; in an RTL page MapLibre would place markers from the right edge.
  return <div ref={box} dir="ltr" className={className ?? 'map'} />
}
