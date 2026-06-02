import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_HISTORY = 50

export const useHistoryStore = create(
  persist(
    (set) => ({
      history: [],

      addAttempt: (attempt) => {
        set((s) => {
          const next = [attempt, ...s.history].slice(0, MAX_HISTORY)
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
