import { useEffect, useId, useState } from 'react'
import { useI18n } from '../i18n'
import { compressPhoto } from '../lib/photo'

interface Props {
  onPick: (photo: Blob, original: File) => void
  onError: (message: string) => void
}

export function PhotoPicker({ onPick, onError }: Props) {
  const { t } = useI18n()
  const id = useId()
  const [preview, setPreview] = useState<string | null>(null)
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  return (
    <div className="field">
      <input
        id={id}
        className="visually-hidden"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          try {
            const photo = await compressPhoto(file)
            setPreview(URL.createObjectURL(photo))
            onPick(photo, file)
          } catch {
            onError(t.badPhoto)
          }
        }}
      />
      <label htmlFor={id} className="photo-drop">
        {preview ? <img src={preview} alt="" /> : <span className="hint">{t.photoTap}</span>}
      </label>
    </div>
  )
}
