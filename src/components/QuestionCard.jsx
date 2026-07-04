import { Lightbulb } from 'lucide-react'
import OptionButton from './OptionButton'
import ImageWithFallback from './ImageWithFallback'
import Card from './ui/Card'
import Badge from './ui/Badge'

export default function QuestionCard({ question, selectedAnswers, onAnswer, questionNumber, revealed = false }) {
  const selected = selectedAnswers || []

  function handleChange(label) {
    if (revealed) return
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
    <Card className="animate-slide-in p-5 sm:p-7">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400">
          Soal {questionNumber}
        </span>
        {question.topic && <Badge tone="slate">{question.topic}</Badge>}
        {question.multi && <Badge tone="violet">Multi-answer</Badge>}
      </div>

      <p className="mb-4 text-base leading-relaxed text-slate-800 dark:text-slate-100 lg:text-lg">
        {question.text}
      </p>

      {question.code_block && (
        <pre className="mb-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-relaxed text-emerald-300 ring-1 ring-slate-800">
          <code>{question.code_block}</code>
        </pre>
      )}

      {question.image !== null && question.image !== undefined && (
        <ImageWithFallback src={question.image} caption={question.image_caption} />
      )}

      {question.image === null && <ImageWithFallback src={null} />}

      <div className="mt-5 flex flex-col gap-2.5">
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.label)
          const isCorrectOpt = question.answer.includes(opt.label)
          let feedback = null
          if (revealed) {
            if (isCorrectOpt) feedback = 'correct'
            else if (isSelected) feedback = 'incorrect'
          }
          return (
            <OptionButton
              key={opt.label}
              label={opt.label}
              text={opt.text}
              selected={isSelected}
              multi={question.multi}
              onChange={() => handleChange(opt.label)}
              feedback={feedback}
              disabled={revealed}
            />
          )
        })}
      </div>

      {revealed && question.explanation && (
        <div className="mt-5 flex animate-slide-in gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm leading-relaxed text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
          <Lightbulb size={18} className="mt-0.5 flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
          <div>
            <span className="font-semibold">Penjelasan: </span>
            {question.explanation}
          </div>
        </div>
      )}
    </Card>
  )
}
