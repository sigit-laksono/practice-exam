import OptionButton from './OptionButton'
import ImageWithFallback from './ImageWithFallback'

export default function QuestionCard({ question, selectedAnswers, onAnswer, questionNumber }) {
  const selected = selectedAnswers || []

  function handleChange(label) {
    if (question.multi) {
      const next = selected.includes(label)
        ? selected.filter((l) => l !== label)
        : [...selected, label]
      onAnswer(next)
    } else {
      onAnswer([label])
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-400">Q{questionNumber}</span>
        {question.topic && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {question.topic}
          </span>
        )}
        {question.multi && (
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
            Multi-answer
          </span>
        )}
      </div>

      <p className="mb-4 text-base leading-relaxed text-gray-800">{question.text}</p>

      {question.code_block && (
        <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-300">
          <code>{question.code_block}</code>
        </pre>
      )}

      {question.image !== null && question.image !== undefined && (
        <ImageWithFallback src={question.image} caption={question.image_caption} />
      )}

      {question.image === null && (
        <div className="my-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠ Soal ini mungkin memiliki diagram. Buka Editor untuk melampirkan gambar.
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {question.options.map((opt) => (
          <OptionButton
            key={opt.label}
            label={opt.label}
            text={opt.text}
            selected={selected.includes(opt.label)}
            multi={question.multi}
            onChange={() => handleChange(opt.label)}
          />
        ))}
      </div>
    </div>
  )
}
