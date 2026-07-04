import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const systemDark =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches

export const useUiStore = create(
  persist(
    (set) => ({
      dark: systemDark,
      toggleDark: () =>
        set((s) => {
          const dark = !s.dark
          document.documentElement.classList.toggle('dark', dark)
          return { dark }
        }),
    }),
    { name: 'pex_ui' }
  )
)
