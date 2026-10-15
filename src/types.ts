export type RoadType = 'street' | 'highway'

export interface Report {
  id: string
  createdAt: number
  lat: number
  lng: number
  district: string
  road: RoadType
  note: string
  photoUrl: string
  status: 'open' | 'fixed'
  fixedAt: number | null
  fixedPhotoUrl: string | null
  fixedBy: string | null
  confirmCount: number
  confirmedByMe: boolean
}

export interface NewReport {
  lat: number
  lng: number
  district: string
  road: RoadType
  note: string
  photo: Blob
}

export interface Store {
  /** True when reports are shared with everyone; false in single-browser demo mode. */
  shared: boolean
  subscribe(onChange: (reports: Report[]) => void): () => void
  add(report: NewReport): Promise<void>
  confirm(id: string): Promise<void>
  markFixed(id: string, afterPhoto: Blob | null, fixedBy: string): Promise<void>
}
