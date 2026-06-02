import { create } from 'zustand'

// session shape:
// { examCode, cert, questions: [...], answers: {id: [labels]}, bookmarks: Set<id>,
//   questionStates: {id: 'unanswered'|'answered'|'bookmarked'},
//   currentIndex, startTime, durationSeconds, submitted, result }

export const useExamStore = create((set, get) => ({
  session: null,

  startSession: ({ examCode, cert, questions, durationSeconds }) => {
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
      },
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
}))
