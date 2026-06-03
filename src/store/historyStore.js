import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_HISTORY = 50

export const useHistoryStore = create(
  persist(
    (set) => ({
      history: [],

      addAttempt: (attempt) => {
        // Tambahkan id unik supaya bisa di-lookup nanti
        const record = { ...attempt, id: Date.now() }
        set((s) => {
          const next = [record, ...s.history].slice(0, MAX_HISTORY)
          return { history: next }
        })
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'pex_history',
    }
  )
)
