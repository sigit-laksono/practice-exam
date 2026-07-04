import { Moon, Sun } from 'lucide-react'
import { useUiStore } from '../store/uiStore'
import Button from './ui/Button'

export default function ThemeToggle() {
  const dark = useUiStore((s) => s.dark)
  const toggleDark = useUiStore((s) => s.toggleDark)
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDark}
      aria-label={dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      title={dark ? 'Mode terang' : 'Mode gelap'}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  )
}
