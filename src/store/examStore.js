import { create } from 'zustand'

// session shape:
// { examCode, cert, questions: [...], answers: {id: [labels]}, bookmarks: Set<id>,
//   questionStates: {id: 'unanswered'|'answered'|'bookmarked'},
//   currentIndex, startTime, durationSeconds, submitted, result }

export const useExamStore = create((set, get) => ({
  session: null,

  startSession: ({ examCode, cert, questions, durationSeconds, questionNumberOffset = 0, practiceMode = false, focusLock = false }) => {
    const states = {}
    questions.forEach((q) => {
      states[q.id] = 'unanswered'
    })
    set({
      session: {
        examCode,
        cert,
        questions,
        answers: {},
        bookmarks: new Set(),
        questionStates: states,
        currentIndex: 0,
        startTime: Date.now(),
        durationSeconds,
        submitted: false,
        result: null,
        questionNumberOffset, // nomor soal pertama di bank (0-indexed)
        practiceMode,
        focusLock, // fullscreen + deteksi pindah tab/aplikasi selama ujian
        revealed: new Set(), // id soal yang sudah ditampilkan feedback benar/salah (practice mode)
      },
    })
  },

  // Kunci jawaban soal & tandai untuk ditampilkan feedback benar/salah (practice mode)
  revealQuestion: (questionId) => {
    set((s) => {
      if (!s.session) return s
      const hasAnswer = s.session.answers[questionId]?.length > 0
      if (!hasAnswer || s.session.revealed.has(questionId)) return s
      const revealed = new Set(s.session.revealed)
      revealed.add(questionId)
      return { session: { ...s.session, revealed } }
    })
  },

  setAnswer: (questionId, selectedLabels) => {
    set((s) => {
      if (!s.session) return s
      const bookmarks = s.session.bookmarks
      const isBookmarked = bookmarks.has(questionId)
      return {
        session: {
          ...s.session,
          answers: { ...s.session.answers, [questionId]: selectedLabels },
          questionStates: {
            ...s.session.questionStates,
            [questionId]: isBookmarked ? 'bookmarked' : 'answered',
          },
        },
      }
    })
  },

  toggleBookmark: (questionId) => {
    set((s) => {
      if (!s.session) return s
      const bookmarks = new Set(s.session.bookmarks)
      if (bookmarks.has(questionId)) {
        bookmarks.delete(questionId)
      } else {
        bookmarks.add(questionId)
      }
      const hasAnswer =
        s.session.answers[questionId] &&
        s.session.answers[questionId].length > 0
      const newState = bookmarks.has(questionId)
        ? 'bookmarked'
        : hasAnswer
        ? 'answered'
        : 'unanswered'
      return {
        session: {
          ...s.session,
          bookmarks,
          questionStates: {
            ...s.session.questionStates,
            [questionId]: newState,
          },
        },
      }
    })
  },

  setCurrentIndex: (index) => {
    set((s) => {
      if (!s.session) return s
      return { session: { ...s.session, currentIndex: index } }
    })
  },

  submitSession: (result) => {
    set((s) => {
      if (!s.session) return s
      return {
        session: { ...s.session, submitted: true, result },
      }
    })
  },

  clearSession: () => set({ session: null }),

  // Load ulang hasil ujian dari historyStore untuk ditampilkan di Result page
  loadHistoryReview: (attempt, questions) => {
    const detailMap = {}
    ;(attempt.details || []).forEach((d) => { detailMap[d.id] = d })

    const questionStates = {}
    const bookmarkSet = new Set(attempt.bookmarks || [])
    questions.forEach((q) => {
      const hasAnswer = attempt.answers?.[q.id]?.length > 0
      questionStates[q.id] = bookmarkSet.has(q.id)
        ? 'bookmarked'
        : hasAnswer ? 'answered' : 'unanswered'
    })

    set({
      session: {
        examCode: attempt.exam_code,
        cert: attempt.cert,
        questions,
        answers: attempt.answers || {},
        bookmarks: bookmarkSet,
        questionStates,
        currentIndex: 0,
        startTime: Date.now() - (attempt.duration_seconds || 0) * 1000,
        durationSeconds: attempt.duration_seconds || 3600,
        submitted: true,
        result: {
          correct: attempt.correct,
          wrong: attempt.total - attempt.correct,
          total: attempt.total,
          score: attempt.score,
          details: attempt.details || [],
        },
      },
    })
  },
}))
