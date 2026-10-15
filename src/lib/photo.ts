import exifr from 'exifr'

/** GPS position stored in the photo by the phone camera, if any. */
export async function photoGps(file: File): Promise<{ lat: number; lng: number } | null> {
  try {
    const gps = await exifr.gps(file)
    if (gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude)) {
      return { lat: gps.latitude, lng: gps.longitude }
    }
  } catch {
    // No EXIF block, or a format exifr can't read: fall back to a manual pin.
  }
  return null
}

/** Resize to at most `max` px on the long edge and re-encode as JPEG. Strips EXIF (and so the exact GPS) from what we upload. */
export async function compressPhoto(file: Blob, max = 1280, quality = 0.75): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode_failed'))), 'image/jpeg', quality),
  )
}
