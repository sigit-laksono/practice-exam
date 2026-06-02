export default function QuestionNav({ questions, questionStates, currentIndex, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5 p-3">
      {questions.map((q, i) => {
        const state = questionStates[q.id] || 'unanswered'
        const isCurrent = i === currentIndex

        let cls =
          'flex h-8 w-8 items-center justify-center rounded text-xs font-semibold cursor-pointer transition-colors '

        if (state === 'bookmarked') {
          cls += 'bg-amber-100 text-amber-700'
        } else if (state === 'answered') {
          cls += 'bg-blue-100 text-blue-700'
        } else {
          cls += 'bg-gray-100 text-gray-500'
        }

        if (isCurrent) {
          cls += ' ring-2 ring-gray-800'
        }

        return (
          <button key={q.id} className={cls} onClick={() => onSelect(i)}>
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}
