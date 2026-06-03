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
  const [showNavModal, setShowNavModal] = useState(false)
  const [paused, setPaused] = useState(false)

  if (!session) return null

  const { questions, answers, bookmarks, questionStates, currentIndex, startTime, durationSeconds, examCode, cert, questionNumberOffset = 0 } = session
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
      // Data untuk review detail
      questionIds: questions.map((q) => q.id),
      answers: { ...answers },
      bookmarks: [...bookmarks],
      details: result.details,
    })
    navigate('/result')
  }

  function handleNavSelect(index) {
    setCurrentIndex(index)
    setShowNavModal(false)
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <span className="text-sm font-semibold text-gray-700">
          {questionNumberOffset + currentIndex + 1} / {questionNumberOffset + questions.length}
        </span>
        <div className="flex items-center gap-2">
          <TimerBadge
            durationSeconds={durationSeconds}
            startTime={startTime}
            onExpire={handleSubmit}
            paused={paused}
          />
          <button
            onClick={() => setPaused((v) => !v)}
            title={paused ? 'Lanjutkan ujian' : 'Pause ujian'}
            className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
              paused
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {paused ? '▶ Lanjut' : '⏸'}
          </button>
        </div>
        <button
          onClick={() => toggleBookmark(q.id)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            bookmarks.has(q.id)
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {bookmarks.has(q.id) ? '🔖' : '☆'}
          <span className="ml-1 hidden sm:inline">
            {bookmarks.has(q.id) ? 'Saved' : 'Bookmark'}
          </span>
        </button>
      </header>

      <ProgressBar current={answeredCount} total={questions.length} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar nav — desktop only */}
        <aside className="hidden w-48 overflow-y-auto border-r bg-white lg:block">
          <QuestionNav
            questions={questions}
            questionStates={questionStates}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
            numberOffset={questionNumberOffset}
          />
        </aside>

        {/* Question content */}
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto max-w-2xl">
            <QuestionCard
              question={q}
              selectedAnswers={answers[q.id] || []}
              onAnswer={(labels) => setAnswer(q.id, labels)}
              questionNumber={questionNumberOffset + currentIndex + 1}
            />
          </div>
        </main>
      </div>

      {/* Bottom bar */}
      <footer className="flex items-center gap-2 border-t bg-white px-3 py-3 sm:px-4">
        {/* Prev */}
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          ← Prev
        </button>

        {/* Nav grid button — mobile */}
        <button
          onClick={() => setShowNavModal(true)}
          className="flex-1 rounded-lg border border-gray-300 py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 lg:hidden"
        >
          📋 Soal {questionNumberOffset + currentIndex + 1}/{questionNumberOffset + questions.length}
        </button>

        {/* Next */}
        <button
          onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
          disabled={currentIndex === questions.length - 1}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          Next →
        </button>

        {/* Submit */}
        <button
          onClick={() => setShowConfirm(true)}
          className="rounded-lg border border-green-500 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
        >
          ✓ <span className="hidden sm:inline">Submit</span>
        </button>
      </footer>

      {/* Pause overlay */}
      {paused && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm">
          <div className="rounded-2xl bg-white px-10 py-10 text-center shadow-2xl">
            <div className="mb-3 text-5xl">⏸</div>
            <h2 className="mb-1 text-2xl font-bold text-gray-900">Ujian Dijeda</h2>
            <p className="mb-6 text-sm text-gray-500">
              Timer berhenti. Soal disembunyikan.<br />Tekan Lanjutkan untuk melanjutkan ujian.
            </p>
            <button
              onClick={() => setPaused(false)}
              className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700 active:scale-95 transition-transform"
            >
              ▶ Lanjutkan Ujian
            </button>
          </div>
        </div>
      )}

      {/* Mobile nav modal */}
      {showNavModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-semibold text-gray-800">
              Navigasi Soal
              <span className="ml-2 text-sm font-normal text-gray-500">
                {answeredCount}/{questions.length} dijawab
              </span>
            </span>
            <button
              onClick={() => setShowNavModal(false)}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
            >
              Tutup ✕
            </button>
          </div>

          {/* Legend */}
          <div className="flex gap-4 border-b px-4 py-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-gray-200 inline-block"/>Belum</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-200 inline-block"/>Dijawab</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-200 inline-block"/>Bookmark</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <QuestionNav
              questions={questions}
              questionStates={questionStates}
              currentIndex={currentIndex}
              onSelect={handleNavSelect}
            />
          </div>

          <div className="border-t p-3">
            <button
              onClick={() => { setShowNavModal(false); setShowConfirm(true) }}
              className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white"
            >
              ✓ Submit Ujian ({unansweredCount > 0 ? `${unansweredCount} belum dijawab` : 'semua terjawab'})
            </button>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-gray-900">Submit Ujian?</h3>
            {unansweredCount > 0 && (
              <p className="mb-2 text-sm text-red-600">
                ⚠ {unansweredCount} soal belum dijawab.
              </p>
            )}
            <p className="mb-6 text-sm text-gray-600">Yakin ingin mengakhiri ujian sekarang?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
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
