import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExamStore } from '../store/examStore'
import ReviewItem from '../components/ReviewItem'

const PASS_THRESHOLD = 60

export default function Result() {
  const navigate = useNavigate()
  const session = useExamStore((s) => s.session)
  const clearSession = useExamStore((s) => s.clearSession)
  const [filter, setFilter] = useState('all')

  if (!session || !session.result) return null

  const isHistoryReview = session.submitted && !session.isLive
  const { questions, answers, bookmarks, result, cert, examCode } = session
  const { score, correct, wrong, total, details } = result
  const passed = score >= PASS_THRESHOLD

  const detailMap = {}
  details.forEach((d) => { detailMap[d.id] = d })

  const filtered = questions.filter((q) => {
    const d = detailMap[q.id]
    if (filter === 'correct') return d?.isCorrect
    if (filter === 'wrong') return !d?.isCorrect
    if (filter === 'bookmarked') return bookmarks.has(q.id)
    return true
  })

  const durationSecs = Math.floor((Date.now() - session.startTime) / 1000)
  const mins = Math.floor(durationSecs / 60)
  const secs = durationSecs % 60

  function handleRetake() {
    clearSession()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Top nav */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => { clearSession(); navigate('/') }}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Home
        </button>
        <button
          onClick={handleRetake}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          🔄 Ulangi Ujian
        </button>
      </div>

      {/* Score summary */}
      <div className={`mb-6 rounded-xl p-6 text-white shadow-lg ${passed ? 'bg-green-600' : 'bg-red-500'}`}>
        <div className="mb-1 text-sm font-medium opacity-80">{cert} — {examCode}</div>
        <div className="mb-4 flex items-end gap-3">
          <span className="text-6xl font-bold">{score}%</span>
          <span className={`mb-2 rounded-full px-3 py-1 text-sm font-bold ${passed ? 'bg-green-700' : 'bg-red-700'}`}>
            {passed ? 'LULUS' : 'GAGAL'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-xl font-bold">{correct}</div>
            <div className="opacity-80">Benar</div>
          </div>
          <div>
            <div className="text-xl font-bold">{wrong}</div>
            <div className="opacity-80">Salah</div>
          </div>
          <div>
            <div className="text-xl font-bold">{mins}:{String(secs).padStart(2,'0')}</div>
            <div className="opacity-80">Waktu</div>
          </div>
        </div>
        <div className="mt-3 text-xs opacity-70">Passing: {PASS_THRESHOLD}%</div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {['all', 'wrong', 'correct', 'bookmarked'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Semua' : f === 'wrong' ? 'Salah' : f === 'correct' ? 'Benar' : '🔖 Bookmark'}
          </button>
        ))}
        <span className="ml-auto self-center text-sm text-gray-500">{filtered.length} soal</span>
      </div>

      {/* Review list */}
      <div className="mb-8 space-y-4">
        {filtered.map((q, i) => (
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
          <p className="py-8 text-center text-gray-400">Tidak ada soal di kategori ini.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {!session.submitted || session.isLive ? (
          <button
            onClick={handleRetake}
            className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Ulangi Ujian
          </button>
        ) : (
          <button
            onClick={handleRetake}
            className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Ulangi Ujian
          </button>
        )}
        <button
          onClick={() => { clearSession(); navigate('/') }}
          className="flex-1 rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Kembali ke Home
        </button>
      </div>
    </div>
  )
}
