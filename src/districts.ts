// Approximate district centres. Each one names the Amanat Baghdad municipality
// that usually covers it; replace with official boundary polygons before launch.
export interface District {
  id: string
  en: string
  ar: string
  lat: number
  lng: number
  municipalityEn: string
  municipalityAr: string
}

const rows: [string, string, string, number, number, string, string][] = [
  ['kadhimiya', 'Kadhimiya', 'الكاظمية', 33.380, 44.338, 'Kadhimiya', 'الكاظمية'],
  ['adhamiya', 'Adhamiya', 'الأعظمية', 33.372, 44.370, 'Adhamiya', 'الأعظمية'],
  ['shaab', 'Shaab', 'الشعب', 33.410, 44.418, 'Shaab', 'الشعب'],
  ['sadr', 'Sadr City', 'مدينة الصدر', 33.392, 44.458, 'Sadr', 'الصدر'],
  ['rusafa', 'Rusafa', 'الرصافة', 33.338, 44.404, 'Rusafa', 'الرصافة'],
  ['palestine', 'Palestine St.', 'شارع فلسطين', 33.352, 44.436, 'Adhamiya', 'الأعظمية'],
  ['zayouna', 'Zayouna', 'زيونة', 33.326, 44.452, 'New Baghdad', 'بغداد الجديدة'],
  ['newbaghdad', 'New Baghdad', 'بغداد الجديدة', 33.310, 44.480, 'New Baghdad', 'بغداد الجديدة'],
  ['karrada', 'Karrada', 'الكرادة', 33.304, 44.416, 'Karrada', 'الكرادة'],
  ['jadriya', 'Jadriya', 'الجادرية', 33.281, 44.392, 'Karrada', 'الكرادة'],
  ['zafaraniya', 'Zafaraniya', 'الزعفرانية', 33.255, 44.458, 'Karrada', 'الكرادة'],
  ['dora', 'Dora', 'الدورة', 33.250, 44.402, 'Rashid', 'الرشيد'],
  ['saydiya', 'Saydiya', 'السيدية', 33.263, 44.358, 'Rashid', 'الرشيد'],
  ['karkh', 'Karkh', 'الكرخ', 33.318, 44.378, 'Karkh', 'الكرخ'],
  ['mansour', 'Mansour', 'المنصور', 33.318, 44.336, 'Mansour', 'المنصور'],
  ['yarmouk', 'Yarmouk', 'اليرموك', 33.298, 44.322, 'Mansour', 'المنصور'],
  ['amiriya', 'Amiriya', 'العامرية', 33.298, 44.274, 'Mansour', 'المنصور'],
  ['ghazaliya', 'Ghazaliya', 'الغزالية', 33.343, 44.270, 'Mansour', 'المنصور'],
]

export const DISTRICTS: District[] = rows.map(([id, en, ar, lat, lng, municipalityEn, municipalityAr]) => ({
  id, en, ar, lat, lng, municipalityEn, municipalityAr,
}))

const byId = new Map(DISTRICTS.map((d) => [d.id, d]))
export const district = (id: string) => byId.get(id)

/** Rough bounds of Greater Baghdad; reports outside are rejected. */
export const BAGHDAD_BOUNDS = { south: 33.0, west: 44.0, north: 33.7, east: 44.8 }
export const BAGHDAD_CENTER: [number, number] = [44.385, 33.315]

export const inBaghdad = (lat: number, lng: number) =>
  lat > BAGHDAD_BOUNDS.south && lat < BAGHDAD_BOUNDS.north && lng > BAGHDAD_BOUNDS.west && lng < BAGHDAD_BOUNDS.east

/** Nearest district centre, correcting longitude for latitude (cos 33.3° ≈ 0.836). */
export function nearestDistrict(lat: number, lng: number): string {
  let best = DISTRICTS[0]
  let bestD = Infinity
  for (const d of DISTRICTS) {
    const dist = (d.lat - lat) ** 2 + ((d.lng - lng) * 0.836) ** 2
    if (dist < bestD) { best = d; bestD = dist }
  }
  return best.id
}
