import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useBankStore } from '../store/bankStore'
import { useExamStore } from '../store/examStore'
import { useHistoryStore } from '../store/historyStore'
import { validateBank } from '../utils/jsonValidator'
import { parseITExamsHTML } from '../utils/htmlParser'

export default function Home() {
  const navigate = useNavigate()
  const { banks, importBank, removeBank } = useBankStore()
  const startSession = useExamStore((s) => s.startSession)
  const loadHistoryReview = useExamStore((s) => s.loadHistoryReview)
  const history = useHistoryStore((s) => s.history)

  const [selectedCode, setSelectedCode] = useState(() => Object.keys(banks)[0] || '')
  const [questionCount, setQuestionCount] = useState('')
  const [timerMins, setTimerMins] = useState(60)
  const [selectedTopics, setSelectedTopics] = useState([])
  const [shuffle, setShuffle] = useState(false)
  const [importError, setImportError] = useState(null)
  const [htmlImporting, setHtmlImporting] = useState(false)
  const [htmlMeta, setHtmlMeta] = useState(null)   // { files, detected }
  const [htmlMetaForm, setHtmlMetaForm] = useState({ cert: '', exam_code: '', version: 'V1.0' })
  const fileRef = useRef()
  const htmlFileRef = useRef()

  const bank = banks[selectedCode]
  const allTopics = bank
    ? [...new Set(bank.questions.map((q) => q.topic).filter(Boolean))]
    : []

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        const errors = validateBank(data)
        if (errors.length > 0) {
          setImportError(errors)
          return
        }
        importBank(data)
        setSelectedCode(data.meta.exam_code)
        setImportError(null)
      } catch {
        setImportError(['File bukan JSON valid.'])
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleHtmlSelect(e) {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    e.target.value = ''

    // Parse satu file dulu untuk deteksi meta
    try {
      const html = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = (ev) => res(ev.target.result)
        r.onerror = rej
        r.readAsText(files[0], 'UTF-8')
      })
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const titleEl = doc.querySelector('title')
      const titleText = titleEl?.textContent || ''
      const examCodeMatch = titleText.match(/([A-Z0-9][0-9A-Z\-]+)\s+Exam/i)
      const exam_code = examCodeMatch ? examCodeMatch[1] : ''
      let cert = ''
      if (exam_code.startsWith('H12') || exam_code.startsWith('H13')) cert = 'HCIA-Datacom'

      setHtmlMetaForm({ cert, exam_code, version: 'V1.0' })
      setHtmlMeta({ files })
    } catch {
      setImportError(['Gagal membaca file HTML.'])
    }
  }

  async function handleHtmlConfirm() {
    if (!htmlMeta) return
    setHtmlImporting(true)
    setImportError(null)
    try {
      const bank = await parseITExamsHTML(htmlMeta.files, htmlMetaForm)
      if (bank.questions.length === 0) {
        setImportError(['Tidak ada soal yang berhasil diparsing. Pastikan file adalah halaman ITExams yang valid.'])
        setHtmlMeta(null)
        setHtmlImporting(false)
        return
      }
      const errors = validateBank(bank)
      if (errors.length > 0) {
        setImportError(errors)
        setHtmlMeta(null)
        setHtmlImporting(false)
        return
      }
      importBank(bank)
      setSelectedCode(bank.meta.exam_code)
      setHtmlMeta(null)
      setImportError(null)
    } catch (err) {
      setImportError([`Parsing gagal: ${err.message}`])
      setHtmlMeta(null)
    }
    setHtmlImporting(false)
  }

  function handleStart(bookmarkedOnly = false) {
    if (!bank) return
    let questions = bank.questions

    if (selectedTopics.length > 0) {
      questions = questions.filter((q) => selectedTopics.includes(q.topic))
    }

    if (bookmarkedOnly) {
      const raw = localStorage.getItem('pex_bookmarks')
      const bookmarks = raw ? JSON.parse(raw) : {}
      const ids = new Set(bookmarks[selectedCode] || [])
      questions = questions.filter((q) => ids.has(q.id))
      if (questions.length === 0) return
    }

    if (questionCount && parseInt(questionCount) > 0) {
      const n = parseInt(questionCount)
      questions = shuffle
        ? [...questions].sort(() => Math.random() - 0.5).slice(0, n)
        : [...questions].slice(0, n)
    } else {
      questions = shuffle
        ? [...questions].sort(() => Math.random() - 0.5)
        : [...questions]
    }

    startSession({
      examCode: selectedCode,
      cert: bank.meta.cert,
      questions,
      durationSeconds: timerMins * 60,
    })
    navigate('/exam')
  }

  const bookmarkCount = (() => {
    if (!selectedCode) return 0
    const raw = localStorage.getItem('pex_bookmarks')
    const bookmarks = raw ? JSON.parse(raw) : {}
    return (bookmarks[selectedCode] || []).length
  })()

  const bankList = Object.values(banks)

  function handleViewDetail(attempt) {
    const bank = banks[attempt.exam_code]
    if (!bank) {
      alert(`Bank soal "${attempt.exam_code}" tidak ditemukan. Import ulang bank soal untuk melihat detail.`)
      return
    }
    if (!attempt.questionIds || attempt.questionIds.length === 0) {
      alert('Data detail tidak tersedia untuk ujian ini (ujian lama). Hasil ujian berikutnya akan bisa dilihat detailnya.')
      return
    }
    const questions = attempt.questionIds
      .map((id) => bank.questions.find((q) => q.id === id))
      .filter(Boolean)
    loadHistoryReview(attempt, questions)
    navigate('/result')
  }

  function handleExportForDeploy() {
    if (!bank) return
    const blob = new Blob([JSON.stringify(bank, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedCode}.json`
    a.click()
    URL.revokeObjectURL(url)
    alert(`File "${selectedCode}.json" didownload.\nTaruh di folder public/banks/ di project kamu, lalu deploy ulang.`)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice Exam</h1>
          <p className="text-sm text-gray-500">IT Certification Preparation</p>
        </div>
        <div className="flex gap-2">
          {bank && (
            <button
              onClick={handleExportForDeploy}
              title="Export bank soal untuk di-bundle ke server"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              🚀 Export Deploy
            </button>
          )}
          <Link
            to="/editor"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ✏️ Editor
          </Link>
        </div>
      </header>

      {bankList.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="mb-4 text-gray-500">Belum ada bank soal. Import file untuk mulai.</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => fileRef.current.click()}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              📄 Import JSON
            </button>
            <button
              onClick={() => htmlFileRef.current.click()}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              🌐 Import HTML (ITExams)
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <input ref={htmlFileRef} type="file" accept=".html,.htm" multiple className="hidden" onChange={handleHtmlSelect} />
        </div>
      ) : (
        <>
          {/* Bank selector */}
          <section className="mb-6 rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-semibold text-gray-800">Bank Soal</h2>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => htmlFileRef.current.click()}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  + Import HTML
                </button>
                <button
                  onClick={() => fileRef.current.click()}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + Import JSON
                </button>
              </div>
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              <input ref={htmlFileRef} type="file" accept=".html,.htm" multiple className="hidden" onChange={handleHtmlSelect} />
            </div>

            <div className="flex flex-wrap gap-2">
              {bankList.map((b) => (
                <div
                  key={b.meta.exam_code}
                  className={`flex items-center rounded-lg border text-sm font-medium transition-colors ${
                    selectedCode === b.meta.exam_code
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedCode(b.meta.exam_code)
                      setSelectedTopics([])
                    }}
                    className="px-4 py-2"
                  >
                    {b.meta.cert} — {b.meta.exam_code}
                    <span className="ml-1.5 text-xs text-gray-400">({b.questions.length} soal)</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!window.confirm(`Hapus bank soal "${b.meta.exam_code}"?`)) return
                      removeBank(b.meta.exam_code)
                      const remaining = Object.keys(banks).filter((c) => c !== b.meta.exam_code)
                      setSelectedCode(remaining[0] || '')
                      setSelectedTopics([])
                    }}
                    title="Hapus bank soal"
                    className="border-l px-2 py-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Config */}
          {bank && (
            <section className="mb-6 rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-800">Konfigurasi Ujian</h2>

              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Jumlah Soal (kosong = semua)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={bank.questions.length}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(e.target.value)}
                    placeholder={`Max ${bank.questions.length}`}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Timer (menit)</label>
                  <input
                    type="number"
                    min="1"
                    value={timerMins}
                    onChange={(e) => setTimerMins(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShuffle((v) => !v)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
                    shuffle ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      shuffle ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <label
                  className="cursor-pointer select-none text-sm text-gray-700"
                  onClick={() => setShuffle((v) => !v)}
                >
                  Randomize question order
                </label>
              </div>

              {allTopics.length > 0 && (
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Filter Topik (kosong = semua)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allTopics.map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          setSelectedTopics((prev) =>
                            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          selectedTopics.includes(t)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Start buttons */}
          {bank && (
            <div className="mb-8 flex gap-3">
              <button
                onClick={() => handleStart(false)}
                className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Mulai Ujian
              </button>
              <button
                onClick={() => handleStart(true)}
                disabled={bookmarkCount === 0}
                className="flex-1 rounded-lg border border-amber-400 bg-amber-50 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                🔖 Review Bookmark ({bookmarkCount})
              </button>
            </div>
          )}
        </>
      )}

      {importError && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <p className="mb-1 font-semibold">Import gagal:</p>
          <ul className="list-inside list-disc space-y-1">
            {importError.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* HTML Import Meta Modal */}
      {htmlMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-bold text-gray-900">Konfirmasi Bank Soal</h3>
            <p className="mb-4 text-sm text-gray-500">
              {htmlMeta.files.length} file HTML dipilih. Isi info bank soal:
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Nama Sertifikasi</label>
                <input
                  value={htmlMetaForm.cert}
                  onChange={(e) => setHtmlMetaForm((f) => ({ ...f, cert: e.target.value }))}
                  placeholder="contoh: HCIA-Datacom"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Kode Ujian</label>
                <input
                  value={htmlMetaForm.exam_code}
                  onChange={(e) => setHtmlMetaForm((f) => ({ ...f, exam_code: e.target.value }))}
                  placeholder="contoh: H12-811"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Versi</label>
                <input
                  value={htmlMetaForm.version}
                  onChange={(e) => setHtmlMetaForm((f) => ({ ...f, version: e.target.value }))}
                  placeholder="contoh: V1.0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setHtmlMeta(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleHtmlConfirm}
                disabled={htmlImporting || !htmlMetaForm.exam_code}
                className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {htmlImporting ? 'Memproses...' : `Import ${htmlMeta.files.length} File`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-gray-800">Riwayat Ujian</h2>
          <div className="space-y-2">
            {history.slice(0, 10).map((h, i) => {
              const mins = Math.floor((h.duration_seconds || 0) / 60)
              const secs = (h.duration_seconds || 0) % 60
              const hasDetail = h.questionIds && h.questionIds.length > 0
              return (
                <div key={h.id || i} className="rounded-lg bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{h.cert} — {h.exam_code}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(h.timestamp).toLocaleString('id-ID')} · {mins}m {String(secs).padStart(2,'0')}s
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${h.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {h.score}% {h.passed ? '✓ LULUS' : '✗ GAGAL'}
                      </p>
                      <p className="text-xs text-gray-500">{h.correct}/{h.total} benar</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {/* Mini progress bar */}
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${h.passed ? 'bg-green-400' : 'bg-red-400'}`}
                        style={{ width: `${h.score}%` }}
                      />
                    </div>
                    <button
                      onClick={() => handleViewDetail(h)}
                      disabled={!hasDetail}
                      title={hasDetail ? 'Lihat soal yang salah & benar' : 'Data detail tidak tersedia (ujian lama)'}
                      className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                    >
                      📊 Detail
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
