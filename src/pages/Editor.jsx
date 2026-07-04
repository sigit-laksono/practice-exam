import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  Download,
  ImagePlus,
  Save,
  Search,
  Trash2,
} from 'lucide-react'
import { useBankStore } from '../store/bankStore'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Toggle from '../components/ui/Toggle'
import ThemeToggle from '../components/ThemeToggle'

const MAX_IMAGE_B64_BYTES = 500 * 1024

export default function Editor() {
  const { banks, updateQuestion } = useBankStore()
  const [selectedCode, setSelectedCode] = useState(() => Object.keys(banks)[0] || '')
  const [selectedId, setSelectedId] = useState(null)

  // IndexedDB load async — set selectedCode setelah bank tersedia (mis. buka /editor langsung)
  useEffect(() => {
    if (!selectedCode && Object.keys(banks).length > 0) {
      setSelectedCode(Object.keys(banks)[0])
    }
  }, [banks])
  const [search, setSearch] = useState('')
  const [filterTopic, setFilterTopic] = useState('')
  const [saveMsg, setSaveMsg] = useState(null)
  const [errors, setErrors] = useState([])
  const imageRef = useRef()

  const bank = banks[selectedCode]
  const allTopics = bank ? [...new Set(bank.questions.map((q) => q.topic).filter(Boolean))] : []

  const filteredQuestions = bank
    ? bank.questions.filter((q) => {
        const matchTopic = !filterTopic || q.topic === filterTopic
        const matchSearch = !search || q.text.toLowerCase().includes(search.toLowerCase())
        return matchTopic && matchSearch
      })
    : []

  const [form, setForm] = useState(null)

  function selectQuestion(q) {
    setSelectedId(q.id)
    setForm({
      id: q.id,
      topic: q.topic || '',
      text: q.text,
      code_block: q.code_block || '',
      image: q.image || '',
      image_caption: q.image_caption || '',
      options: q.options.map((o) => ({ ...o })),
      answer: [...q.answer],
      multi: q.multi,
      explanation: q.explanation || '',
    })
    setErrors([])
    setSaveMsg(null)
  }

  function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = ev.target.result
      if (b64.length > MAX_IMAGE_B64_BYTES) {
        setSaveMsg({ type: 'warn', text: 'Gambar melebihi 500KB. Disarankan kompres sebelum upload.' })
      }
      setForm((f) => ({ ...f, image: b64 }))
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function toggleCorrectAnswer(label) {
    setForm((f) => {
      const ans = f.answer.includes(label)
        ? f.answer.filter((a) => a !== label)
        : [...f.answer, label]
      return { ...f, answer: ans }
    })
  }

  function validate() {
    const errs = []
    if (!form.text.trim()) errs.push('Teks soal tidak boleh kosong.')
    if (form.options.some((o) => !o.text.trim())) errs.push('Semua pilihan harus diisi.')
    if (form.answer.length === 0) errs.push('Minimal satu jawaban benar harus dipilih.')
    return errs
  }

  function handleSave() {
    const errs = validate()
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])

    const updated = {
      ...bank.questions.find((q) => q.id === form.id),
      topic: form.topic,
      text: form.text,
      code_block: form.code_block || null,
      image: form.image || null,
      image_caption: form.image_caption || null,
      options: form.options,
      answer: form.answer,
      multi: form.multi,
      explanation: form.explanation || null,
    }
    updateQuestion(selectedCode, updated)
    setSaveMsg({ type: 'ok', text: 'Tersimpan!' })
    setTimeout(() => setSaveMsg(null), 2000)
  }

  function handleExport() {
    if (!bank) return
    const blob = new Blob([JSON.stringify(bank, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `${selectedCode}_edited_${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (Object.keys(banks).length === 0) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 px-4 text-center text-slate-500 dark:text-slate-400">
        <p>Belum ada bank soal. Import dulu dari halaman Home.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          <ArrowLeft size={16} /> Kembali ke Home
        </Link>
      </div>
    )
  }

  // Mobile: 2 langkah — list dulu, form setelah soal dipilih (tombol back di form)
  return (
    <div className="flex h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <h1 className="hidden font-semibold text-slate-900 dark:text-slate-100 md:block">
            Editor Bank Soal
          </h1>
          <select
            value={selectedCode}
            onChange={(e) => { setSelectedCode(e.target.value); setSelectedId(null); setForm(null) }}
            className="field !w-auto !py-1.5"
            aria-label="Pilih bank soal"
          >
            {Object.keys(banks).map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button size="sm" onClick={handleExport}>
            <Download size={15} />
            <span className="hidden sm:inline">Export JSON</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: question list — di mobile disembunyikan saat form terbuka */}
        <aside
          className={`w-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex md:w-80 ${
            form ? 'hidden' : 'flex'
          }`}
        >
          <div className="space-y-2 border-b border-slate-200 p-3 dark:border-slate-800">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari teks soal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="field !pl-9"
              />
            </div>
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="field"
              aria-label="Filter topik"
            >
              <option value="">Semua Topik</option>
              {allTopics.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredQuestions.map((q) => (
              <button
                key={q.id}
                onClick={() => selectQuestion(q)}
                className={`w-full border-b border-slate-100 px-3.5 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 dark:border-slate-800/70 ${
                  selectedId === q.id
                    ? 'bg-indigo-50 dark:bg-indigo-500/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="font-semibold text-slate-500 dark:text-slate-400">#{q.id}</span>
                {q.topic && <Badge tone="slate" className="ml-1.5">{q.topic}</Badge>}
                <p className="mt-1 line-clamp-2 text-slate-700 dark:text-slate-300">{q.text}</p>
              </button>
            ))}
            {filteredQuestions.length === 0 && (
              <p className="p-6 text-center text-sm text-slate-400 dark:text-slate-500">
                Tidak ada soal yang cocok.
              </p>
            )}
          </div>
        </aside>

        {/* Right panel: form — di mobile tampil menggantikan list */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 ${form ? 'block' : 'hidden md:block'}`}>
          {!form ? (
            <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-500">
              Pilih soal dari daftar di sebelah kiri
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-5 pb-8">
              {/* Back — mobile only */}
              <button
                onClick={() => { setForm(null); setSelectedId(null) }}
                className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 md:hidden"
              >
                <ChevronLeft size={16} /> Kembali ke daftar soal
              </button>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">ID (read-only)</label>
                  <input value={form.id} readOnly className="field !bg-slate-100 dark:!bg-slate-800" />
                </div>
                <div>
                  <label className="field-label">Topik</label>
                  <input
                    value={form.topic}
                    onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Teks Soal</label>
                <textarea
                  value={form.text}
                  onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                  rows={4}
                  className="field"
                />
              </div>

              <div>
                <label className="field-label">Code Block (opsional)</label>
                <textarea
                  value={form.code_block}
                  onChange={(e) => setForm((f) => ({ ...f, code_block: e.target.value }))}
                  rows={3}
                  className="field font-mono"
                  placeholder="CLI / config output..."
                />
              </div>

              {/* Image */}
              <div>
                <label className="field-label">Gambar</label>
                {form.image ? (
                  <div className="mb-2">
                    <img
                      src={form.image}
                      alt="preview"
                      className="max-h-48 rounded-xl border border-slate-200 object-contain dark:border-slate-700"
                    />
                  </div>
                ) : (
                  <div className="mb-2 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    Tidak ada gambar
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => imageRef.current.click()}>
                    <ImagePlus size={15} /> Upload Gambar
                  </Button>
                  {form.image && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!text-rose-600 hover:!bg-rose-50 dark:!text-rose-400 dark:hover:!bg-rose-500/10"
                      onClick={() => setForm((f) => ({ ...f, image: '' }))}
                    >
                      <Trash2 size={15} /> Hapus
                    </Button>
                  )}
                </div>
                <input
                  ref={imageRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <div className="mt-2">
                  <input
                    value={form.image_caption}
                    onChange={(e) => setForm((f) => ({ ...f, image_caption: e.target.value }))}
                    placeholder="Caption gambar (opsional)"
                    className="field"
                  />
                </div>
              </div>

              {/* Multi toggle */}
              <Toggle
                checked={form.multi}
                onChange={() => setForm((f) => ({ ...f, multi: !f.multi, answer: [] }))}
                label="Multi-answer"
                description="Soal dengan lebih dari satu jawaban benar"
              />

              {/* Options */}
              <div>
                <label className="field-label">Pilihan Jawaban</label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={opt.label} className="flex items-start gap-3">
                      <label className="flex cursor-pointer items-center gap-1.5 pt-2.5">
                        <input
                          type={form.multi ? 'checkbox' : 'radio'}
                          checked={form.answer.includes(opt.label)}
                          onChange={() => toggleCorrectAnswer(opt.label)}
                          name="correct"
                          className="h-4 w-4 accent-emerald-600"
                        />
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          {opt.label}
                        </span>
                      </label>
                      <input
                        value={opt.text}
                        onChange={(e) => {
                          const options = form.options.map((o, j) =>
                            j === i ? { ...o, text: e.target.value } : o
                          )
                          setForm((f) => ({ ...f, options }))
                        }}
                        className="field flex-1"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  Centang/klik radio untuk menandai jawaban benar.
                </p>
              </div>

              {/* Explanation */}
              <div>
                <label className="field-label">Penjelasan (opsional)</label>
                <textarea
                  value={form.explanation}
                  onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
                  rows={3}
                  className="field"
                />
              </div>

              {errors.length > 0 && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  {errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}

              {saveMsg && (
                <div
                  className={`rounded-xl p-3.5 text-sm ${
                    saveMsg.type === 'ok'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                  }`}
                >
                  {saveMsg.text}
                </div>
              )}

              <Button size="lg" className="w-full" onClick={handleSave}>
                <Save size={17} /> Simpan Soal
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
