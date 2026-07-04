import { useEffect, useState } from 'react'

// Ring chart skor. animate=true → stroke terisi dengan transisi saat mount.
export default function ScoreRing({
  value,
  size = 48,
  stroke = 5,
  colorClass = 'text-indigo-500',
  animate = false,
  children,
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const target = c * (1 - Math.min(100, Math.max(0, value)) / 100)
  const [offset, setOffset] = useState(animate ? c : target)

  useEffect(() => {
    if (!animate) {
      setOffset(target)
      return
    }
    const raf = requestAnimationFrame(() => setOffset(target))
    return () => cancelAnimationFrame(raf)
  }, [target, animate])

  return (
    <div className="relative inline-flex flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={`stroke-current ${colorClass}`}
          style={{ transition: animate ? 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' : 'none' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  )
}
