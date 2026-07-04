import { useState } from 'react'
import { ImageOff } from 'lucide-react'

export default function ImageWithFallback({ src, caption }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="my-3 flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        <ImageOff size={16} className="flex-shrink-0" />
        Soal ini mungkin memiliki diagram. Buka Editor untuk melampirkan gambar.
      </div>
    )
  }

  return (
    <figure className="my-3">
      <img
        src={src}
        alt={caption || 'Question diagram'}
        className="max-w-full rounded-xl border border-slate-200 dark:border-slate-800"
        onError={() => setFailed(true)}
      />
      {caption && (
        <figcaption className="mt-1.5 text-center text-xs text-slate-500 dark:text-slate-400">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
