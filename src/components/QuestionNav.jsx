const SIZES = {
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
}

export default function QuestionNav({
  questions,
  questionStates,
  currentIndex,
  onSelect,
  numberOffset = 0,
  answers,
  revealed,
  size = 'md',
}) {
  return (
    <div className="flex flex-wrap gap-1.5 p-3">
      {questions.map((q, i) => {
        const state = questionStates[q.id] || 'unanswered'
        const isCurrent = i === currentIndex
        const isRevealed = revealed?.has(q.id)

        let cls = `flex ${SIZES[size]} cursor-pointer items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 `

        if (isRevealed) {
          const userAnswer = (answers?.[q.id] || []).slice().sort()
          const correctAnswer = q.answer.slice().sort()
          const isCorrect =
            userAnswer.length === correctAnswer.length &&
            userAnswer.every((v, idx) => v === correctAnswer[idx])
          cls += isCorrect
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
        } else if (state === 'bookmarked') {
          cls += 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
        } else if (state === 'answered') {
          cls += 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
        } else {
          cls += 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }

        if (isCurrent) {
          cls += ' ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
        }

        return (
          <button
            key={q.id}
            className={cls}
            onClick={() => onSelect(i)}
            aria-label={`Soal ${numberOffset + i + 1}`}
            aria-current={isCurrent ? 'true' : undefined}
          >
            {numberOffset + i + 1}
          </button>
        )
      })}
    </div>
  )
}
