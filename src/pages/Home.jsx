import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Bookmark,
  Download,
  Eye,
  FileJson,
  GraduationCap,
  Globe,
  History,
  PenLine,
  Play,
  Trash2,
  Upload,
} from 'lucide-react'
import { useBankStore } from '../store/bankStore'
import { useExamStore } from '../store/examStore'
import { useHistoryStore } from '../store/historyStore'
import { validateBank } from '../utils/jsonValidator'
import { parseITExamsHTML } from '../utils/htmlParser'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Toggle from '../components/ui/Toggle'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import ScoreRing from '../components/ScoreRing'
import ThemeToggle from '../components/ThemeToggle'

function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m} mnt lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} hari lalu`
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Home() {
  const navigate = useNavigate()
  const { banks, importBank, removeBank } = useBankStore()
  const startSession = useExamStore((s) => s.startSession)
  const loadHistoryReview = useExamStore((s) => s.loadHistoryReview)
  const history = useHistoryStore((s) => s.history)
  const removeAttempt = useHistoryStore((s) => s.removeAttempt)
  const clearHistory = useHistoryStore((s) => s.clearHistory)

  const [selectedCode, setSelectedCode] = useState(() => Object.keys(banks)[0] || '')

  // IndexedDB load async — set selectedCode setelah bank tersedia
  useEffect(() => {
    if (!selectedCode && Object.keys(banks).length > 0) {
      setSelectedCode(Object.keys(banks)[0])
    }
  }, [banks])
  const [questionCount, setQuestionCount] = useState('')
  const [timerMins, setTimerMins] = useState(60)
  const [selectedTopics, setSelectedTopics] = useState([])
  const [shuffle, setShuffle] = useState(false)
  const [practiceMode, setPracticeMode] = useState(false)
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

    let questionNumberOffset = 0
    const rangeMatch = questionCount.trim().match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
      // Format range: "51-100" → ambil soal ke-51 sampai ke-100 (1-indexed)
      const from = Math.max(1, parseInt(rangeMatch[1])) - 1
      const to = parseInt(rangeMatch[2])
      questions = [...questions].slice(from, to)
      questionNumberOffset = from  // soal pertama = nomor from+1
      if (shuffle) questions = questions.sort(() => Math.random() - 0.5)
    } else if (questionCount && parseInt(questionCount) > 0) {
      // Format angka: "50" → ambil 50 soal pertama (atau acak kalau shuffle)
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
      questionNumberOffset,
      practiceMode,
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

  const historySection = history.length > 0 && (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
          <History size={16} className="text-slate-400" /> Riwayat Ujian
        </h2>
        <button
          onClick={() => {
            if (!window.confirm('Hapus semua riwayat ujian?')) return
            clearHistory()
          }}
          className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
        >
          Hapus semua
        </button>
      </div>
      <div className="space-y-2.5">
        {history.slice(0, 10).map((h, i) => {
          const mins = Math.floor((h.duration_seconds || 0) / 60)
          const secs = (h.duration_seconds || 0) % 60
          const hasDetail = h.questionIds && h.questionIds.length > 0
          return (
            <Card key={h.id || i} className="flex items-center gap-3.5 px-4 py-3">
              <ScoreRing
                value={h.score}
                size={46}
                stroke={4.5}
                colorClass={h.passed ? 'text-emerald-500' : 'text-rose-500'}
              >
                <span className={`text-[11px] font-bold tabular-nums ${h.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {h.score}%
                </span>
              </ScoreRing>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {h.cert} — {h.exam_code}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {timeAgo(h.timestamp)} · {mins}m {String(secs).padStart(2, '0')}s · {h.correct}/{h.total} benar
                </p>
                <div className="mt-1">
                  <Badge tone={h.passed ? 'emerald' : 'rose'}>
                    {h.passed ? 'LULUS' : 'GAGAL'}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="!p-2"
                  onClick={() => handleViewDetail(h)}
                  disabled={!hasDetail}
                  aria-label="Lihat detail hasil"
                  title={hasDetail ? 'Lihat soal yang salah & benar' : 'Data detail tidak tersedia (ujian lama)'}
                >
                  <Eye size={17} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="!p-2 hover:!bg-rose-50 hover:!text-rose-500 dark:hover:!bg-rose-500/10 dark:hover:!text-rose-400"
                  onClick={() => {
                    if (!window.confirm(`Hapus riwayat "${h.cert} — ${h.exam_code}" (${h.score}%)?`)) return
                    removeAttempt(h)
                  }}
                  aria-label="Hapus riwayat ini"
                  title="Hapus riwayat ini"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 py-6 sm:py-8">
      {/* App bar */}
      <header className="mb-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              Practice Exam
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              IT Certification Preparation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            to="/editor"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <PenLine size={16} />
            <span className="hidden sm:inline">Editor</span>
          </Link>
        </div>
      </header>

      {bankList.length === 0 ? (
        /* Empty state */
        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center dark:border-slate-700 sm:p-14">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
            <Upload size={26} />
          </div>
          <h2 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">
            Belum ada bank soal
          </h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            Import file JSON atau halaman HTML ITExams untuk mulai latihan.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => fileRef.current.click()}>
              <FileJson size={16} /> Import JSON
            </Button>
            <Button variant="success" onClick={() => htmlFileRef.current.click()}>
              <Globe size={16} /> Import HTML (ITExams)
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          {/* Kolom utama */}
          <div className="space-y-5">
            {/* Bank selector */}
            <Card className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">Bank Soal</h2>
                <div className="flex items-center gap-1">
                  {bank && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportForDeploy}
                      title="Export bank soal untuk di-bundle ke server"
                      aria-label="Export bank soal untuk deploy"
                    >
                      <Download size={15} />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => htmlFileRef.current.click()}>
                    <Globe size={15} className="text-emerald-600 dark:text-emerald-400" /> HTML
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => fileRef.current.click()}>
                    <FileJson size={15} className="text-indigo-600 dark:text-indigo-400" /> JSON
                  </Button>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {bankList.map((b) => {
                  const active = selectedCode === b.meta.exam_code
                  return (
                    <div
                      key={b.meta.exam_code}
                      className={`group relative rounded-xl border-2 transition-colors ${
                        active
                          ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400/70 dark:bg-indigo-500/10'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedCode(b.meta.exam_code)
                          setSelectedTopics([])
                        }}
                        className="w-full rounded-xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <p className={`pr-7 text-sm font-semibold ${active ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                          {b.meta.cert}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {b.meta.exam_code} · {b.questions.length} soal
                        </p>
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
                        aria-label={`Hapus bank soal ${b.meta.exam_code}`}
                        className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              <input ref={htmlFileRef} type="file" accept=".html,.htm" multiple className="hidden" onChange={handleHtmlSelect} />
            </Card>

            {/* Config */}
            {bank && (
              <Card className="p-5">
                <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-200">
                  Konfigurasi Ujian
                </h2>

                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="q-count">Jumlah Soal</label>
                    <input
                      id="q-count"
                      type="text"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(e.target.value)}
                      placeholder="Contoh: 50 atau 51-100"
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="q-timer">Timer (menit)</label>
                    <input
                      id="q-timer"
                      type="number"
                      min="1"
                      value={timerMins}
                      onChange={(e) => setTimerMins(Number(e.target.value))}
                      className="field"
                    />
                  </div>
                </div>

                <div className="mb-5 space-y-4">
                  <Toggle
                    checked={shuffle}
                    onChange={() => setShuffle((v) => !v)}
                    label="Acak urutan soal"
                    description="Urutan soal dirandomize setiap sesi"
                  />
                  <Toggle
                    checked={practiceMode}
                    onChange={() => setPracticeMode((v) => !v)}
                    color="emerald"
                    label="Practice Mode"
                    description="Feedback benar/salah langsung per soal, tanpa timer"
                  />
                </div>

                {allTopics.length > 0 && (
                  <div>
                    <p className="field-label">Filter Topik (kosong = semua)</p>
                    <div className="flex flex-wrap gap-2">
                      {allTopics.map((t) => (
                        <button
                          key={t}
                          onClick={() =>
                            setSelectedTopics((prev) =>
                              prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                            )
                          }
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                            selectedTopics.includes(t)
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400/70 dark:bg-indigo-500/10 dark:text-indigo-300'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Start buttons */}
            {bank && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="flex-1" onClick={() => handleStart(false)}>
                  <Play size={18} /> Mulai Ujian
                </Button>
                <Button
                  variant="amber"
                  size="lg"
                  className="flex-1"
                  onClick={() => handleStart(true)}
                  disabled={bookmarkCount === 0}
                >
                  <Bookmark size={17} /> Review Bookmark ({bookmarkCount})
                </Button>
              </div>
            )}

            {importError && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                <p className="mb-1 font-semibold">Import gagal:</p>
                <ul className="list-inside list-disc space-y-1">
                  {importError.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Kolom riwayat */}
          <div className="lg:sticky lg:top-8">{historySection}</div>
        </div>
      )}

      {bankList.length === 0 && importError && (
        <div className="mt-6 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <p className="mb-1 font-semibold">Import gagal:</p>
          <ul className="list-inside list-disc space-y-1">
            {importError.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* HTML Import Meta Modal */}
      <Modal
        open={!!htmlMeta}
        onClose={() => setHtmlMeta(null)}
        title="Konfirmasi Bank Soal"
        subtitle={htmlMeta ? `${htmlMeta.files.length} file HTML dipilih. Isi info bank soal:` : ''}
      >
        <div className="space-y-3">
          <div>
            <label className="field-label" htmlFor="meta-cert">Nama Sertifikasi</label>
            <input
              id="meta-cert"
              value={htmlMetaForm.cert}
              onChange={(e) => setHtmlMetaForm((f) => ({ ...f, cert: e.target.value }))}
              placeholder="contoh: HCIA-Datacom"
              className="field"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="meta-code">Kode Ujian</label>
            <input
              id="meta-code"
              value={htmlMetaForm.exam_code}
              onChange={(e) => setHtmlMetaForm((f) => ({ ...f, exam_code: e.target.value }))}
              placeholder="contoh: H12-811"
              className="field"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="meta-version">Versi</label>
            <input
              id="meta-version"
              value={htmlMetaForm.version}
              onChange={(e) => setHtmlMetaForm((f) => ({ ...f, version: e.target.value }))}
              placeholder="contoh: V1.0"
              className="field"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setHtmlMeta(null)}>
            Batal
          </Button>
          <Button
            variant="success"
            className="flex-1"
            onClick={handleHtmlConfirm}
            disabled={htmlImporting || !htmlMetaForm.exam_code}
          >
            {htmlImporting ? 'Memproses...' : `Import ${htmlMeta?.files.length || 0} File`}
          </Button>
        </div>
      </Modal>

      {/* Riwayat di bawah saat belum ada bank (mis. bank dihapus tapi riwayat masih ada) */}
      {bankList.length === 0 && <div className="mt-8">{historySection}</div>}
    </div>
  )
}
