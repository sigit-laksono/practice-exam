import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Flag,
  LayoutGrid,
  Pause,
  Play,
  Send,
  Check,
  Target,
} from 'lucide-react'
import { useExamStore } from '../store/examStore'
import { useHistoryStore } from '../store/historyStore'
import { scoreSession } from '../utils/scorer'
import QuestionCard from '../components/QuestionCard'
import QuestionNav from '../components/QuestionNav'
import TimerBadge from '../components/TimerBadge'
import ProgressBar from '../components/ProgressBar'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'

function Legend({ practiceMode }) {
  const items = [
    ['bg-slate-200 dark:bg-slate-700', 'Belum'],
    ['bg-indigo-300 dark:bg-indigo-500/50', 'Dijawab'],
    ['bg-amber-300 dark:bg-amber-500/50', 'Bookmark'],
  ]
  if (practiceMode) {
    items.push(
      ['bg-emerald-300 dark:bg-emerald-500/50', 'Benar'],
      ['bg-rose-300 dark:bg-rose-500/50', 'Salah']
    )
  }
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
      {items.map(([dot, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`inline-block h-2.5 w-2.5 rounded ${dot}`} />
          {label}
        </span>
      ))}
    </div>
  )
}

export default function Exam() {
  const navigate = useNavigate()
  const session = useExamStore((s) => s.session)
  const setAnswer = useExamStore((s) => s.setAnswer)
  const toggleBookmark = useExamStore((s) => s.toggleBookmark)
  const setCurrentIndex = useExamStore((s) => s.setCurrentIndex)
  const revealQuestion = useExamStore((s) => s.revealQuestion)
  const submitSession = useExamStore((s) => s.submitSession)
  const addAttempt = useHistoryStore((s) => s.addAttempt)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showNavModal, setShowNavModal] = useState(false)
  const [paused, setPaused] = useState(false)

  if (!session) return null

  const { questions, answers, bookmarks, questionStates, currentIndex, startTime, durationSeconds, examCode, cert, questionNumberOffset = 0, practiceMode = false, revealed } = session
  const q = questions[currentIndex]
  const answeredCount = Object.values(answers).filter((a) => a.length > 0).length
  const unansweredCount = questions.length - answeredCount
  const isCurrentRevealed = practiceMode && revealed.has(q.id)
  const currentAnswered = (answers[q.id] || []).length > 0
  const isBookmarked = bookmarks.has(q.id)

  // Practice mode: submit jawaban soal yang sedang dibuka -> kunci & tampilkan feedback benar/salah
  function handleSubmitAnswer() {
    if (!practiceMode || !currentAnswered || isCurrentRevealed) return
    revealQuestion(q.id)
  }

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

  // Keyboard shortcut (desktop): ←/→ pindah soal, 1-9 pilih opsi, B bookmark, Enter submit jawaban (practice)
  useEffect(() => {
    function onKey(e) {
      if (showConfirm || showNavModal || paused) return
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'ArrowLeft') {
        setCurrentIndex(Math.max(0, currentIndex - 1))
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))
      } else if (e.key.toLowerCase() === 'b') {
        toggleBookmark(q.id)
      } else if (e.key === 'Enter' && practiceMode) {
        handleSubmitAnswer()
      } else if (/^[1-9]$/.test(e.key) && !isCurrentRevealed) {
        const opt = q.options[parseInt(e.key) - 1]
        if (!opt) return
        const selected = answers[q.id] || []
        if (q.multi) {
          const next = selected.includes(opt.label)
            ? selected.filter((l) => l !== opt.label)
            : [...selected, opt.label]
          setAnswer(q.id, next)
        } else {
          setAnswer(q.id, [opt.label])
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="flex h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900 sm:px-4">
        <span className="flex items-center gap-2 text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
          {questionNumberOffset + currentIndex + 1}
          <span className="font-normal text-slate-400 dark:text-slate-500">
            / {questionNumberOffset + questions.length}
          </span>
          {practiceMode && (
            <Badge tone="emerald" className="hidden sm:inline-flex">
              <Target size={12} /> Practice
            </Badge>
          )}
        </span>

        {!practiceMode && (
          <div className="flex items-center gap-1.5">
            <TimerBadge
              durationSeconds={durationSeconds}
              startTime={startTime}
              onExpire={handleSubmit}
              paused={paused}
            />
            <Button
              variant={paused ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPaused((v) => !v)}
              aria-label={paused ? 'Lanjutkan ujian' : 'Pause ujian'}
              title={paused ? 'Lanjutkan ujian' : 'Pause ujian'}
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </Button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Button
            variant={isBookmarked ? 'amber' : 'ghost'}
            size="sm"
            onClick={() => toggleBookmark(q.id)}
            aria-label={isBookmarked ? 'Hapus bookmark' : 'Bookmark soal ini'}
          >
            <Bookmark size={16} className={isBookmarked ? 'fill-current' : ''} />
            <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Bookmark'}</span>
          </Button>
          <Button variant="success" size="sm" onClick={() => setShowConfirm(true)}>
            <Flag size={16} />
            <span className="hidden sm:inline">Selesai</span>
          </Button>
        </div>
      </header>

      <ProgressBar current={answeredCount} total={questions.length} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar nav — desktop only */}
        <aside className="hidden w-60 flex-col overflow-hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Navigasi Soal
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {answeredCount}/{questions.length} dijawab · {bookmarks.size} bookmark
            </p>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <QuestionNav
              questions={questions}
              questionStates={questionStates}
              currentIndex={currentIndex}
              onSelect={setCurrentIndex}
              numberOffset={questionNumberOffset}
              answers={answers}
              revealed={revealed}
            />
          </div>
          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <Legend practiceMode={practiceMode} />
          </div>
        </aside>

        {/* Question content */}
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto max-w-2xl">
            <QuestionCard
              key={q.id}
              question={q}
              selectedAnswers={answers[q.id] || []}
              onAnswer={(labels) => setAnswer(q.id, labels)}
              questionNumber={questionNumberOffset + currentIndex + 1}
              revealed={isCurrentRevealed}
            />
            <p className="mt-4 hidden text-center text-xs text-slate-400 dark:text-slate-600 lg:block">
              Shortcut: ←/→ pindah soal · 1–9 pilih jawaban · B bookmark
              {practiceMode && ' · Enter submit jawaban'}
            </p>
          </div>
        </main>
      </div>

      {/* Bottom bar */}
      <footer className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2.5 pb-safe dark:border-slate-800 dark:bg-slate-900 sm:px-4">
        <Button
          variant="secondary"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          aria-label="Soal sebelumnya"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        {/* Nav grid button — mobile/tablet */}
        <Button
          variant="secondary"
          className="flex-1 lg:hidden"
          onClick={() => setShowNavModal(true)}
        >
          <LayoutGrid size={16} />
          Soal {questionNumberOffset + currentIndex + 1}/{questionNumberOffset + questions.length}
        </Button>

        <span className="hidden flex-1 lg:block" />

        {/* Submit Jawaban — practice mode saja */}
        {practiceMode && (
          <Button
            variant="success"
            onClick={handleSubmitAnswer}
            disabled={!currentAnswered || isCurrentRevealed}
          >
            {isCurrentRevealed ? <Check size={16} /> : <Send size={16} />}
            <span className="hidden sm:inline">{isCurrentRevealed ? 'Terjawab' : 'Submit Jawaban'}</span>
            <span className="sm:hidden">{isCurrentRevealed ? 'OK' : 'Submit'}</span>
          </Button>
        )}

        <Button
          onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
          disabled={currentIndex === questions.length - 1}
          aria-label="Soal berikutnya"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={18} />
        </Button>
      </footer>

      {/* Pause overlay */}
      {paused && (
        <div className="fixed inset-0 z-40 flex animate-fade-in flex-col items-center justify-center bg-slate-950/70 px-4 backdrop-blur-xl">
          <div className="w-full max-w-sm animate-scale-in rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-800">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
              <Pause size={30} />
            </div>
            <h2 className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              Ujian Dijeda
            </h2>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Timer berhenti dan soal disembunyikan. Tarik napas dulu — lanjutkan kalau sudah siap.
            </p>
            <Button size="lg" className="w-full" onClick={() => setPaused(false)}>
              <Play size={18} /> Lanjutkan Ujian
            </Button>
          </div>
        </div>
      )}

      {/* Nav modal — bottom sheet di mobile */}
      <Modal
        open={showNavModal}
        onClose={() => setShowNavModal(false)}
        title="Navigasi Soal"
        subtitle={`${answeredCount}/${questions.length} dijawab · ${bookmarks.size} bookmark`}
        wide
      >
        <div className="mb-3">
          <Legend practiceMode={practiceMode} />
        </div>
        <div className="-mx-3 max-h-[50dvh] overflow-y-auto">
          <QuestionNav
            questions={questions}
            questionStates={questionStates}
            currentIndex={currentIndex}
            onSelect={handleNavSelect}
            numberOffset={questionNumberOffset}
            answers={answers}
            revealed={revealed}
            size="lg"
          />
        </div>
        <Button
          variant="success"
          size="lg"
          className="mt-4 w-full"
          onClick={() => { setShowNavModal(false); setShowConfirm(true) }}
        >
          <Flag size={18} />
          Submit Ujian ({unansweredCount > 0 ? `${unansweredCount} belum dijawab` : 'semua terjawab'})
        </Button>
      </Modal>

      {/* Confirm modal */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Submit Ujian?"
      >
        {unansweredCount > 0 && (
          <p className="mb-2 text-sm font-medium text-rose-600 dark:text-rose-400">
            {unansweredCount} soal belum dijawab.
          </p>
        )}
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          Yakin ingin mengakhiri ujian sekarang?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setShowConfirm(false)}>
            Batal
          </Button>
          <Button variant="success" className="flex-1" onClick={handleSubmit}>
            Ya, Submit
          </Button>
        </div>
      </Modal>
    </div>
  )
}
