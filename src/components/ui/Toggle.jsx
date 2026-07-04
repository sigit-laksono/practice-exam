const COLORS = {
  indigo: 'bg-indigo-600',
  emerald: 'bg-emerald-600',
  rose: 'bg-rose-600',
}

export default function Toggle({ checked, onChange, label, description, color = 'indigo' }) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
          checked ? COLORS[color] : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
      <div className="cursor-pointer select-none" onClick={onChange}>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
    </div>
  )
}
