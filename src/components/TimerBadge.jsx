import { useEffect, useState } from 'react'
import { Timer, Pause } from 'lucide-react'

export default function TimerBadge({ durationSeconds, startTime, onExpire, paused }) {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    return Math.max(0, durationSeconds - elapsed)
  })

  useEffect(() => {
    if (paused) return        // jangan jalan kalau pause
    if (remaining <= 0) {
      onExpire?.()
      return
    }
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          onExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [paused])               // re-run ketika paused berubah

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')
  const isCritical = remaining < 60
  const isLow = remaining < 300

  const tone = paused
    ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
    : isCritical
    ? 'bg-rose-100 text-rose-700 animate-pulse dark:bg-rose-500/15 dark:text-rose-300'
    : isLow
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'

  return (
    <span
      aria-live={isLow && !paused ? 'polite' : 'off'}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors ${tone}`}
    >
      {paused ? <Pause size={14} /> : <Timer size={14} />}
      {mins}:{secs}
    </span>
  )
}
