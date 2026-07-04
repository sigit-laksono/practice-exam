export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div
      className="h-1 w-full bg-slate-200 dark:bg-slate-800"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${current} dari ${total} soal dijawab`}
    >
      <div
        className="h-1 rounded-r-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
