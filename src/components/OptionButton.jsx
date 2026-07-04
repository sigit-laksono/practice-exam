import { Check, X } from 'lucide-react'

export default function OptionButton({ label, text, selected, multi, onChange, feedback, disabled }) {
  // feedback: null (belum di-reveal) | 'correct' | 'incorrect' | 'missed'
  let cls =
    'group flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 '
  let letterCls =
    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors '

  if (feedback === 'correct') {
    cls += 'border-emerald-500/60 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
    letterCls += 'bg-emerald-600 text-white'
  } else if (feedback === 'incorrect') {
    cls += 'border-rose-500/60 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200'
    letterCls += 'bg-rose-600 text-white'
  } else if (selected) {
    cls += 'border-indigo-500 bg-indigo-50 text-indigo-950 dark:border-indigo-400/70 dark:bg-indigo-500/10 dark:text-indigo-100'
    letterCls += 'bg-indigo-600 text-white'
  } else {
    cls += 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
    letterCls += 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700'
  }

  cls += disabled
    ? ' cursor-default'
    : ' cursor-pointer hover:border-slate-300 dark:hover:border-slate-600'

  return (
    <label className={cls}>
      <input
        type={multi ? 'checkbox' : 'radio'}
        checked={selected}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <span className={letterCls}>{label}</span>
      <span className="pt-0.5 text-sm leading-relaxed sm:text-base">{text}</span>
      {feedback === 'correct' && (
        <Check size={18} className="ml-auto mt-1 flex-shrink-0 animate-pop-in text-emerald-600 dark:text-emerald-400" />
      )}
      {feedback === 'incorrect' && (
        <X size={18} className="ml-auto mt-1 flex-shrink-0 animate-pop-in text-rose-600 dark:text-rose-400" />
      )}
    </label>
  )
}
