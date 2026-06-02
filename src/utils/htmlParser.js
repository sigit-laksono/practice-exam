/**
 * Parser untuk HTML yang disimpan dari ITExams.com
 * Format: halaman exam ITExams (Save Page As → complete HTML)
 */

/**
 * Parse satu atau lebih file HTML ITExams menjadi bank soal JSON.
 * @param {File[]} files - array of .html File objects
 * @param {{ cert?: string, exam_code?: string, version?: string }} metaOverride
 * @returns {Promise<object>} bank soal sesuai schema
 */
export async function parseITExamsHTML(files, metaOverride = {}) {
  // Baca semua file, urutkan berdasarkan nama
  const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  let allQuestions = []
  let detectedMeta = {}

  for (const file of sorted) {
    const html = await readFileAsText(file)
    const { questions, meta } = parseOnePage(html, allQuestions.length)
    allQuestions = allQuestions.concat(questions)
    if (!detectedMeta.exam_code && meta.exam_code) detectedMeta = meta
  }

  const meta = {
    cert: metaOverride.cert || detectedMeta.cert || 'Unknown',
    exam_code: metaOverride.exam_code || detectedMeta.exam_code || 'UNKNOWN',
    version: metaOverride.version || detectedMeta.version || 'V1.0',
    total: allQuestions.length,
    created_at: new Date().toISOString().slice(0, 10),
  }

  return { meta, questions: allQuestions }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file, 'UTF-8')
  })
}

function parseOnePage(html, idOffset) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Deteksi meta dari title: "H12-811 Exam - Free Huawei Questions..."
  const titleEl = doc.querySelector('title')
  const meta = extractMeta(titleEl?.textContent || '')

  const questionEls = doc.querySelectorAll('.examsPage__question')
  const questions = []

  questionEls.forEach((el, index) => {
    const q = parseQuestion(el, idOffset + index + 1)
    if (q) questions.push(q)
  })

  return { questions, meta }
}

function extractMeta(title) {
  // "H12-811 Exam - Free Huawei Questions and Answers - ITExams.com"
  const examCodeMatch = title.match(/([A-Z][0-9A-Z\-]+)\s+Exam/i)
  const exam_code = examCodeMatch ? examCodeMatch[1] : ''

  // Coba deteksi cert dari exam code prefix
  let cert = 'Unknown'
  if (exam_code.startsWith('H12') || exam_code.startsWith('H13')) cert = 'HCIA-Datacom'
  else if (exam_code.startsWith('H')) cert = 'Huawei'

  return { exam_code, cert, version: 'V1.0' }
}

function parseQuestion(el, id) {
  // --- Topic ---
  const titleEl = el.querySelector('.examsPage__question-header .title')
  // "Question #1 (Topic: Exam A)" atau "Question #1 (Topic: STP)"
  let topic = ''
  if (titleEl) {
    const topicMatch = titleEl.textContent.match(/Topic:\s*(.+?)\)/)
    if (topicMatch) topic = topicMatch[1].trim()
    if (topic.toLowerCase() === 'exam a' || topic.toLowerCase() === 'exam b') topic = ''
  }

  // --- Question body ---
  const bodyEl = el.querySelector('.examsPage__question-body')
  if (!bodyEl) return null

  // Cari span utama (teks soal)
  const bodySpan = bodyEl.querySelector('span[style*="font-family"]')
  if (!bodySpan) return null

  // Ekstrak teks dan gambar
  const { text, image, image_caption } = extractTextAndImage(bodySpan)
  if (!text.trim()) return null

  // --- Options ---
  const optionEls = el.querySelectorAll('.examsPage__question-answer')
  const options = []
  optionEls.forEach((optEl) => {
    const raw = optEl.textContent.trim()
    // Format: " A. Option text " atau " A) Option text "
    const match = raw.match(/^([A-Z])[.)]\s*(.+)$/)
    if (match) {
      options.push({ label: match[1], text: match[2].trim() })
    } else if (raw.length > 0) {
      // Fallback: ambil huruf pertama sebagai label
      const label = raw.charAt(0)
      const text = raw.slice(2).trim()
      if (/^[A-Z]$/.test(label)) {
        options.push({ label, text })
      }
    }
  })

  if (options.length === 0) return null

  // --- Correct Answer ---
  const answerEl = el.querySelector('.examsPage__question-correct-answer strong')
  let answerRaw = answerEl ? answerEl.textContent.trim() : ''

  // Format bisa: "A" | "A, B" | "AB" | "A,B,C"
  let answer = []
  if (answerRaw) {
    // Normalize: pisahkan huruf-huruf kapital
    const letters = answerRaw.match(/[A-Z]/g)
    answer = letters ? [...new Set(letters)] : []
  }

  const multi = answer.length > 1

  // --- Code block detection ---
  // Jika ada <pre> atau <code> di dalam body
  const preEl = bodySpan.querySelector('pre, code')
  const code_block = preEl ? preEl.textContent.trim() : null

  return {
    id,
    text: text.trim(),
    code_block,
    image: image || null,
    image_caption: image_caption || null,
    options,
    answer,
    multi,
    topic,
    explanation: null,
  }
}

function extractTextAndImage(spanEl) {
  let text = ''
  let image = null
  let image_caption = null

  // Walk child nodes
  for (const node of spanEl.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent
    } else if (node.nodeName === 'BR') {
      text += '\n'
    } else if (node.nodeName === 'IMG') {
      // src berisi base64 (hasil Save Page), data-savepage-src berisi URL asli
      // Prioritaskan src karena isinya base64 yang bisa langsung ditampilkan offline
      const src = node.getAttribute('src') || node.getAttribute('data-savepage-src') || ''
      if (src && src !== 'undefined' && src !== '') {
        image = src.startsWith('data:') ? src : src  // simpan base64 atau URL asli
        image_caption = node.getAttribute('alt') || null
      }
    } else if (node.nodeName === 'SPAN' || node.nodeName === 'P' || node.nodeName === 'DIV') {
      // Rekursif untuk nested spans
      const inner = extractTextAndImage(node)
      text += inner.text
      if (!image && inner.image) {
        image = inner.image
        image_caption = inner.image_caption
      }
    } else {
      text += node.textContent || ''
    }
  }

  // Bersihkan teks: hapus newlines berlebih di awal/akhir
  text = text.replace(/\n{3,}/g, '\n\n').trim()

  return { text, image, image_caption }
}
