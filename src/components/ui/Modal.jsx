import { useEffect } from 'react'

// Desktop: dialog di tengah. Mobile (<640px): bottom sheet dengan drag handle.
export default function Modal({ open, onClose, title, subtitle, wide = false, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 pb-safe shadow-2xl animate-slide-up dark:bg-slate-900 dark:ring-1 dark:ring-slate-800 sm:animate-scale-in sm:rounded-2xl ${
          wide ? 'sm:max-w-lg' : 'sm:max-w-sm'
        }`}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />
        {title && (
          <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        )}
        {subtitle && (
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  )
}
