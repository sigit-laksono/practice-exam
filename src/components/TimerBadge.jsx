import { useEffect, useState } from 'react'

export default function TimerBadge({ durationSeconds, startTime, onExpire }) {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    return Math.max(0, durationSeconds - elapsed)
  })

  useEffect(() => {
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
  }, [])

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')
  const isLow = remaining < 300

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-semibold tabular-nums ${
        isLow
          ? 'bg-amber-100 text-amber-700'
          : 'bg-gray-100 text-gray-700'
      }`}
    >
      ⏱ {mins}:{secs}
    </span>
  )
}
