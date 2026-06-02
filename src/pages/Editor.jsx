import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useBankStore } from '../store/bankStore'

const MAX_IMAGE_B64_BYTES = 500 * 1024

export default function Editor() {
  const { banks, updateQuestion } = useBankStore()
  const [selectedCode, setSelectedCode] = useState(() => Object.keys(banks)[0] || '')
  const [selectedId, setSelectedId] = useState(null)
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
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-gray-500">
        <p>Belum ada bank soal. Import dulu dari halaman Home.</p>
        <Link to="/" className="text-blue-600 hover:underline">← Kembali ke Home</Link>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">← Home</Link>
          <h1 className="font-semibold text-gray-900">Editor Bank Soal</h1>
          <select
            value={selectedCode}
            onChange={(e) => { setSelectedCode(e.target.value); setSelectedId(null); setForm(null) }}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            {Object.keys(banks).map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleExport}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          Export JSON
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: question list */}
        <aside className="flex w-72 flex-col border-r bg-white">
          <div className="border-b p-3 space-y-2">
            <input
              type="text"
              placeholder="Cari teks soal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Semua Topik</option>
              {allTopics.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredQuestions.map((q) => (
              <button
                key={q.id}
                onClick={() => selectQuestion(q)}
                className={`w-full border-b px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                  selectedId === q.id ? 'bg-blue-50' : ''
                }`}
              >
                <span className="font-semibold text-gray-500">#{q.id}</span>
                {q.topic && <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{q.topic}</span>}
                <p className="mt-0.5 line-clamp-2 text-gray-700">{q.text}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Right panel: form */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {!form ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              Pilih soal dari daftar di sebelah kiri
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">ID (read-only)</label>
                  <input value={form.id} readOnly className="w-full rounded border bg-gray-100 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Topik</label>
                  <input
                    value={form.topic}
                    onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Teks Soal</label>
                <textarea
                  value={form.text}
                  onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                  rows={4}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Code Block (opsional)</label>
                <textarea
                  value={form.code_block}
                  onChange={(e) => setForm((f) => ({ ...f, code_block: e.target.value }))}
                  rows={3}
                  className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="CLI / config output..."
                />
              </div>

              {/* Image */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Gambar</label>
                {form.image ? (
                  <div className="mb-2">
                    <img
                      src={form.image}
                      alt="preview"
                      className="max-h-48 rounded border border-gray-200 object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-2 rounded border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">
                    Tidak ada gambar
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => imageRef.current.click()}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Upload Gambar
                  </button>
                  {form.image && (
                    <button
                      onClick={() => setForm((f) => ({ ...f, image: '' }))}
                      className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      Hapus Gambar
                    </button>
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
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Multi toggle */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-600">Multi-answer</label>
                <button
                  onClick={() => setForm((f) => ({ ...f, multi: !f.multi, answer: [] }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    form.multi ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.multi ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Options */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">Pilihan Jawaban</label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={opt.label} className="flex items-start gap-3">
                      <div className="flex items-center gap-1.5 pt-2">
                        <input
                          type={form.multi ? 'checkbox' : 'radio'}
                          checked={form.answer.includes(opt.label)}
                          onChange={() => toggleCorrectAnswer(opt.label)}
                          name="correct"
                          className="accent-green-600"
                        />
                        <span className="text-sm font-semibold text-gray-600">{opt.label}</span>
                      </div>
                      <input
                        value={opt.text}
                        onChange={(e) => {
                          const options = form.options.map((o, j) =>
                            j === i ? { ...o, text: e.target.value } : o
                          )
                          setForm((f) => ({ ...f, options }))
                        }}
                        className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-400">Centang/klik radio untuk menandai jawaban benar.</p>
              </div>

              {/* Explanation */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Penjelasan (opsional)</label>
                <textarea
                  value={form.explanation}
                  onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
                  rows={3}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {errors.length > 0 && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  {errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}

              {saveMsg && (
                <div className={`rounded-lg p-3 text-sm ${
                  saveMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {saveMsg.text}
                </div>
              )}

              <button
                onClick={handleSave}
                className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Simpan Soal
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
