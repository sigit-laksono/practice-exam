import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Exam from './pages/Exam'
import Result from './pages/Result'
import Editor from './pages/Editor'
import { useExamStore } from './store/examStore'
import { useBankStore } from './store/bankStore'
import { useUiStore } from './store/uiStore'
import { autoLoadBanks } from './utils/autoLoader'

function RequireSession({ children }) {
  const session = useExamStore((s) => s.session)
  if (!session) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const importBank = useBankStore((s) => s.importBank)
  const banks = useBankStore((s) => s.banks)
  const dark = useUiStore((s) => s.dark)

  // Sinkronkan class dark (persisted store bisa berbeda dari tebakan awal inline script)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    const existingCodes = Object.keys(banks)
    autoLoadBanks(importBank, existingCodes)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/exam"
          element={
            <RequireSession>
              <Exam />
            </RequireSession>
          }
        />
        <Route
          path="/result"
          element={
            <RequireSession>
              <Result />
            </RequireSession>
          }
        />
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  )
}
