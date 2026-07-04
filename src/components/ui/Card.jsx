export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
