import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from './idbStorage'

export const useBankStore = create(
  persist(
    (set, get) => ({
      banks: {}, // keyed by exam_code

      importBank: (bank) => {
        set((s) => ({
          banks: { ...s.banks, [bank.meta.exam_code]: bank },
        }))
      },

      removeBank: (examCode) => {
        set((s) => {
          const next = { ...s.banks }
          delete next[examCode]
          return { banks: next }
        })
      },

      getBank: (examCode) => get().banks[examCode],

      updateQuestion: (examCode, updatedQuestion) => {
        set((s) => {
          const bank = s.banks[examCode]
          if (!bank) return s
          const questions = bank.questions.map((q) =>
            q.id === updatedQuestion.id ? updatedQuestion : q
          )
          return {
            banks: {
              ...s.banks,
              [examCode]: { ...bank, questions },
            },
          }
        })
      },
    }),
    {
      name: 'pex_banks',
      storage: createJSONStorage(() => idbStorage),
    }
  )
)
