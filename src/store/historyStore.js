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

      // Hapus satu attempt. Pakai identitas objek karena entri lama bisa belum punya id.
      removeAttempt: (attempt) =>
        set((s) => ({ history: s.history.filter((h) => h !== attempt) })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'pex_history',
    }
  )
)
