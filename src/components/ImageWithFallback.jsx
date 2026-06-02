import { useState } from 'react'

export default function ImageWithFallback({ src, caption }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="my-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        ⚠ Soal ini mungkin memiliki diagram. Buka Editor untuk melampirkan gambar.
      </div>
    )
  }

  return (
    <figure className="my-3">
      <img
        src={src}
        alt={caption || 'Question diagram'}
        className="max-w-full rounded-lg border border-gray-200"
        onError={() => setFailed(true)}
      />
      {caption && (
        <figcaption className="mt-1 text-center text-xs text-gray-500">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
