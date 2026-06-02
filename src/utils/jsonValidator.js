export function validateBank(data) {
  const errors = []

  if (!data || typeof data !== 'object') {
    return ['File bukan JSON object yang valid.']
  }

  const { meta, questions } = data

  if (!meta) errors.push('Field "meta" tidak ditemukan.')
  else {
    if (!meta.cert) errors.push('meta.cert wajib diisi.')
    if (!meta.exam_code) errors.push('meta.exam_code wajib diisi.')
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    errors.push('Field "questions" harus berupa array dan tidak boleh kosong.')
    return errors
  }

  const ids = new Set()
  questions.forEach((q, i) => {
    const prefix = `Soal #${i + 1} (id=${q.id})`
    if (typeof q.id !== 'number') errors.push(`${prefix}: id harus berupa angka.`)
    if (ids.has(q.id)) errors.push(`${prefix}: id duplikat.`)
    ids.add(q.id)
    if (typeof q.text !== 'string' || !q.text.trim())
      errors.push(`${prefix}: text wajib diisi.`)
    if (!Array.isArray(q.options) || q.options.length < 2)
      errors.push(`${prefix}: options minimal 2 pilihan.`)
    if (!Array.isArray(q.answer) || q.answer.length === 0)
      errors.push(`${prefix}: answer wajib diisi.`)
    if (typeof q.multi !== 'boolean')
      errors.push(`${prefix}: multi harus boolean.`)
  })

  return errors
}
