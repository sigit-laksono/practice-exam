import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExamStore } from '../store/examStore'
import { useHistoryStore } from '../store/historyStore'
import { scoreSession } from '../utils/scorer'
import QuestionCard from '../components/QuestionCard'
import QuestionNav from '../components/QuestionNav'
import TimerBadge from '../components/TimerBadge'
import ProgressBar from '../components/ProgressBar'

export default function Exam() {
  const navigate = useNavigate()
  const session = useExamStore((s) => s.session)
  const setAnswer = useExamStore((s) => s.setAnswer)
  const toggleBookmark = useExamStore((s) => s.toggleBookmark)
  const setCurrentIndex = useExamStore((s) => s.setCurrentIndex)
  const submitSession = useExamStore((s) => s.submitSession)
  const addAttempt = useHistoryStore((s) => s.addAttempt)
  const [showConfirm, setShowConfirm] = useState(false)

  if (!session) return null

  const { questions, answers, bookmarks, questionStates, currentIndex, startTime, durationSeconds, examCode, cert } = session
  const q = questions[currentIndex]
  const answeredCount = Object.values(answers).filter((a) => a.length > 0).length
  const unansweredCount = questions.length - answeredCount

  function handleSubmit() {
    const result = scoreSession(questions, answers)
    const durationSeconds2 = Math.floor((Date.now() - startTime) / 1000)
    const passed = result.score >= 60
    submitSession(result)
    addAttempt({
      cert,
      exam_code: examCode,
      score: result.score,
      correct: result.correct,
      total: result.total,
      timestamp: Date.now(),
      duration_seconds: durationSeconds2,
      passed,
    })
    navigate('/result')
  }

  function handleTimerExpire() {
    handleSubmit()
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <span className="text-sm font-medium text-gray-600">
          {currentIndex + 1} / {questions.length}
        </span>
        <TimerBadge
          durationSeconds={durationSeconds}
          startTime={startTime}
          onExpire={handleTimerExpire}
        />
        <button
          onClick={() => toggleBookmark(q.id)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            bookmarks.has(q.id)
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {bookmarks.has(q.id) ? '🔖 Bookmarked' : '☆ Bookmark'}
        </button>
      </header>

      <ProgressBar current={answeredCount} total={questions.length} />

      <div className="flex flex-1 overflow-hidden">
        {/* Question nav sidebar */}
        <aside className="hidden w-48 overflow-y-auto border-r bg-white lg:block">
          <QuestionNav
            questions={questions}
            questionStates={questionStates}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-2xl">
            <QuestionCard
              question={q}
              selectedAnswers={answers[q.id] || []}
              onAnswer={(labels) => setAnswer(q.id, labels)}
              questionNumber={currentIndex + 1}
            />
          </div>
        </main>
      </div>

      {/* Bottom bar */}
      <footer className="flex items-center justify-between border-t bg-white px-4 py-3">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          ← Prev
        </button>

        {/* Mobile nav toggle dots */}
        <div className="flex gap-1 lg:hidden overflow-x-auto max-w-xs">
          <QuestionNav
            questions={questions}
            questionStates={questionStates}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
          />
        </div>

        <div className="flex gap-2">
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Submit Ujian
            </button>
          )}
          <button
            onClick={() => setShowConfirm(true)}
            className="rounded-lg border border-green-500 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
          >
            ✓ Submit
          </button>
        </div>
      </footer>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-gray-900">Submit Ujian?</h3>
            {unansweredCount > 0 && (
              <p className="mb-4 text-sm text-red-600">
                {unansweredCount} soal belum dijawab.
              </p>
            )}
            <p className="mb-6 text-sm text-gray-600">Yakin ingin mengakhiri ujian sekarang?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Ya, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
