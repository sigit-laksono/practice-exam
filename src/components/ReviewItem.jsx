import ImageWithFallback from './ImageWithFallback'

export default function ReviewItem({ question, userAnswer, isCorrect, isBookmarked, index }) {
  return (
    <div className={`rounded-xl border p-5 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
        {question.topic && (
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
            {question.topic}
          </span>
        )}
        {isBookmarked && <span className="text-amber-500">🔖</span>}
        <span className={`ml-auto text-sm font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
          {isCorrect ? '✓ Benar' : '✗ Salah'}
        </span>
      </div>

      <p className="mb-3 text-sm text-gray-800">{question.text}</p>

      {question.code_block && (
        <pre className="mb-3 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-green-300">
          <code>{question.code_block}</code>
        </pre>
      )}

      {question.image !== undefined && question.image !== null && (
        <ImageWithFallback src={question.image} caption={question.image_caption} />
      )}

      <div className="mt-3 space-y-1 text-sm">
        {question.options.map((opt) => {
          const isUserPick = userAnswer.includes(opt.label)
          const isCorrectOpt = question.answer.includes(opt.label)
          let cls = 'flex items-center gap-2 rounded px-3 py-2 '
          if (isCorrectOpt) cls += 'bg-green-200 text-green-900 font-medium'
          else if (isUserPick && !isCorrectOpt) cls += 'bg-red-200 text-red-900'
          else cls += 'bg-white text-gray-700'

          return (
            <div key={opt.label} className={cls}>
              <span className="font-semibold">{opt.label}.</span>
              <span>{opt.text}</span>
              {isCorrectOpt && <span className="ml-auto">✓</span>}
              {isUserPick && !isCorrectOpt && <span className="ml-auto">✗</span>}
            </div>
          )
        })}
      </div>

      {question.explanation && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <span className="font-semibold">Penjelasan: </span>
          {question.explanation}
        </div>
      )}
    </div>
  )
}
