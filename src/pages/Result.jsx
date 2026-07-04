import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Clock, RotateCcw, Target, X } from 'lucide-react'
import { useExamStore } from '../store/examStore'
import ReviewItem from '../components/ReviewItem'
import ScoreRing from '../components/ScoreRing'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

const PASS_THRESHOLD = 60

function useCountUp(target, duration = 1000) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration)
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

export default function Result() {
  const navigate = useNavigate()
  const session = useExamStore((s) => s.session)
  const clearSession = useExamStore((s) => s.clearSession)
  const [filter, setFilter] = useState('all')
  const animatedScore = useCountUp(session?.result?.score ?? 0)

  if (!session || !session.result) return null

  const { questions, answers, bookmarks, result, cert, examCode } = session
  const { score, correct, wrong, total, details } = result
  const passed = score >= PASS_THRESHOLD

  const detailMap = {}
  details.forEach((d) => { detailMap[d.id] = d })

  const counts = {
    all: questions.length,
    wrong: questions.filter((q) => !detailMap[q.id]?.isCorrect).length,
    correct: questions.filter((q) => detailMap[q.id]?.isCorrect).length,
    bookmarked: questions.filter((q) => bookmarks.has(q.id)).length,
  }

  const filtered = questions.filter((q) => {
    const d = detailMap[q.id]
    if (filter === 'correct') return d?.isCorrect
    if (filter === 'wrong') return !d?.isCorrect
    if (filter === 'bookmarked') return bookmarks.has(q.id)
    return true
  })

  // Breakdown per topik (hanya tampil jika ada >1 topik)
  const topicStats = (() => {
    const map = {}
    questions.forEach((q) => {
      const topic = q.topic || 'Lainnya'
      if (!map[topic]) map[topic] = { correct: 0, total: 0 }
      map[topic].total++
      if (detailMap[q.id]?.isCorrect) map[topic].correct++
    })
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total)
  })()

  const durationSecs = Math.floor((Date.now() - session.startTime) / 1000)
  const mins = Math.floor(durationSecs / 60)
  const secs = durationSecs % 60

  function handleRetake() {
    clearSession()
    navigate('/')
  }

  const FILTERS = [
    ['all', 'Semua'],
    ['wrong', 'Salah'],
    ['correct', 'Benar'],
    ['bookmarked', 'Bookmark'],
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      {/* Top nav */}
      <div className="mb-5 flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={() => { clearSession(); navigate('/') }}>
          <ArrowLeft size={16} /> Home
        </Button>
        <Button size="sm" onClick={handleRetake}>
          <RotateCcw size={15} /> Ulangi Ujian
        </Button>
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2 lg:items-stretch">
        {/* Score hero */}
        <Card className="flex animate-slide-in flex-col items-center gap-5 p-6 sm:flex-row sm:p-8">
          <ScoreRing
            value={score}
            size={150}
            stroke={11}
            animate
            colorClass={passed ? 'text-emerald-500' : 'text-rose-500'}
          >
            <div className="text-center">
              <div className="text-4xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {animatedScore}
                <span className="text-xl text-slate-400">%</span>
              </div>
            </div>
          </ScoreRing>

          <div className="flex-1 text-center sm:text-left">
            <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
              {cert} — {examCode}
            </p>
            <div className="mb-4">
              <Badge tone={passed ? 'emerald' : 'rose'} className="!px-3 !py-1 !text-sm">
                {passed ? 'LULUS' : 'GAGAL'}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-emerald-50 px-2 py-2.5 dark:bg-emerald-500/10">
                <div className="flex items-center justify-center gap-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  <Check size={16} /> {correct}
                </div>
                <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Benar</div>
              </div>
              <div className="rounded-xl bg-rose-50 px-2 py-2.5 dark:bg-rose-500/10">
                <div className="flex items-center justify-center gap-1 text-lg font-bold text-rose-700 dark:text-rose-300">
                  <X size={16} /> {wrong}
                </div>
                <div className="text-xs text-rose-600/80 dark:text-rose-400/80">Salah</div>
              </div>
              <div className="rounded-xl bg-slate-100 px-2 py-2.5 dark:bg-slate-800">
                <div className="flex items-center justify-center gap-1 text-lg font-bold tabular-nums text-slate-700 dark:text-slate-300">
                  <Clock size={15} /> {mins}:{String(secs).padStart(2, '0')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Waktu</div>
              </div>
            </div>
            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-slate-400 dark:text-slate-500 sm:justify-start">
              <Target size={12} /> Passing score: {PASS_THRESHOLD}%
            </p>
          </div>
        </Card>

        {/* Breakdown per topik */}
        {topicStats.length > 1 && (
          <Card className="animate-slide-in p-6">
            <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-200">
              Breakdown per Topik
            </h2>
            <div className="space-y-3.5">
              {topicStats.map(([topic, s]) => {
                const pct = Math.round((s.correct / s.total) * 100)
                return (
                  <div key={topic}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                        {topic}
                      </span>
                      <span className="flex-shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {s.correct}/{s.total} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          pct >= PASS_THRESHOLD ? 'bg-emerald-500' : 'bg-rose-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Filter — segmented control */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                filter === key
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs tabular-nums opacity-60">{counts[key]}</span>
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm text-slate-500 dark:text-slate-400">
          {filtered.length} soal
        </span>
      </div>

      {/* Review list */}
      <div className="mx-auto mb-8 max-w-3xl space-y-4">
        {filtered.map((q) => (
          <ReviewItem
            key={q.id}
            question={q}
            userAnswer={answers[q.id] || []}
            isCorrect={detailMap[q.id]?.isCorrect}
            isBookmarked={bookmarks.has(q.id)}
            index={questions.indexOf(q)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-slate-400 dark:text-slate-500">
            Tidak ada soal di kategori ini.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1" onClick={handleRetake}>
          <RotateCcw size={17} /> Ulangi Ujian
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={() => { clearSession(); navigate('/') }}
        >
          <ArrowLeft size={17} /> Kembali ke Home
        </Button>
      </div>
    </div>
  )
}
