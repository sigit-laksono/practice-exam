import { Bookmark, Check, ChevronDown, Lightbulb, X } from 'lucide-react'
import ImageWithFallback from './ImageWithFallback'
import Badge from './ui/Badge'

export default function ReviewItem({ question, userAnswer, isCorrect, isBookmarked, index }) {
  return (
    <div
      className={`rounded-2xl border-l-4 bg-white p-5 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800 ${
        isCorrect ? 'border-l-emerald-500' : 'border-l-rose-500'
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">#{index + 1}</span>
        {question.topic && <Badge tone="slate">{question.topic}</Badge>}
        {isBookmarked && (
          <Bookmark size={14} className="fill-current text-amber-500" aria-label="Di-bookmark" />
        )}
        <Badge tone={isCorrect ? 'emerald' : 'rose'} className="ml-auto">
          {isCorrect ? <Check size={12} /> : <X size={12} />}
          {isCorrect ? 'Benar' : 'Salah'}
        </Badge>
      </div>

      <p className="mb-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
        {question.text}
      </p>

      {question.code_block && (
        <pre className="mb-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs leading-relaxed text-emerald-300 ring-1 ring-slate-800">
          <code>{question.code_block}</code>
        </pre>
      )}

      {question.image !== undefined && question.image !== null && (
        <ImageWithFallback src={question.image} caption={question.image_caption} />
      )}

      <div className="mt-3 space-y-1.5 text-sm">
        {question.options.map((opt) => {
          const isUserPick = userAnswer.includes(opt.label)
          const isCorrectOpt = question.answer.includes(opt.label)
          let cls = 'flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 '
          if (isCorrectOpt) {
            cls += 'bg-emerald-50 font-medium text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30'
          } else if (isUserPick) {
            cls += 'bg-rose-50 text-rose-900 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/30'
          } else {
            cls += 'bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400'
          }

          return (
            <div key={opt.label} className={cls}>
              <span className="font-semibold">{opt.label}.</span>
              <span>{opt.text}</span>
              {isCorrectOpt && (
                <Check size={16} className="ml-auto mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              {isUserPick && !isCorrectOpt && (
                <X size={16} className="ml-auto mt-0.5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              )}
            </div>
          )
        })}
      </div>

      {question.explanation && (
        <details className="group mt-3 rounded-xl border border-indigo-200 bg-indigo-50 text-sm text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
          <summary className="flex cursor-pointer select-none items-center gap-2 px-3.5 py-2.5 font-semibold">
            <Lightbulb size={15} className="flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
            Penjelasan
            <ChevronDown size={15} className="ml-auto transition-transform group-open:rotate-180" />
          </summary>
          <p className="px-3.5 pb-3 leading-relaxed">{question.explanation}</p>
        </details>
      )}
    </div>
  )
}
