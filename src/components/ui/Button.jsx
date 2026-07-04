const VARIANTS = {
  primary:
    'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-500 active:bg-indigo-700',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  ghost:
    'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800',
  success:
    'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-500 active:bg-emerald-700',
  danger:
    'bg-rose-600 text-white shadow-sm shadow-rose-600/25 hover:bg-rose-500 active:bg-rose-700',
  amber:
    'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-5 py-3 text-base rounded-xl gap-2',
  icon: 'p-2.5 rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex select-none items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 dark:focus-visible:ring-offset-slate-950 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
