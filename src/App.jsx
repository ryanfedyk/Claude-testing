import { useState, useEffect, useRef } from 'react'
import Cursor from './components/portfolio/Cursor'
import Nav from './components/portfolio/Nav'
import Hero from './components/portfolio/Hero'
import Work from './components/portfolio/Work'
import About from './components/portfolio/About'
import Lab from './components/portfolio/Lab'
import Contact from './components/portfolio/Contact'
import KonamiOverlay from './components/portfolio/KonamiOverlay'

const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']
const THEMES = ['default', 'plasma', 'matrix']

export default function App() {
  const [theme, setTheme] = useState('default')
  const [cursorType, setCursorType] = useState('default')
  const [konamiActive, setKonamiActive] = useState(false)
  const [revealMode, setRevealMode] = useState(false)
  const [secretUnlocked, setSecretUnlocked] = useState(false)
  const konamiBuffer = useRef([])

  // Console Easter egg
  useEffect(() => {
    console.log(
      '%c██████╗ ██╗   ██╗ █████╗ ███╗   ██╗    ███████╗███████╗██████╗ ██╗   ██╗██╗  ██╗\n██╔══██╗╚██╗ ██╔╝██╔══██╗████╗  ██║    ██╔════╝██╔════╝██╔══██╗╚██╗ ██╔╝██║ ██╔╝\n██████╔╝ ╚████╔╝ ███████║██╔██╗ ██║    █████╗  █████╗  ██║  ██║ ╚████╔╝ █████╔╝ \n██╔══██╗  ╚██╔╝  ██╔══██║██║╚██╗██║    ██╔══╝  ██╔══╝  ██║  ██║  ╚██╔╝  ██╔═██╗ \n██║  ██║   ██║   ██║  ██║██║ ╚████║    ██║     ███████╗██████╔╝   ██║   ██║  ██╗\n╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝     ╚══════╝╚═════╝    ╚═╝   ╚═╝  ╚═╝',
      'color:#6366f1;font-family:monospace;font-size:8px;line-height:1.3'
    )
    console.log('%c👋  You opened devtools. Respect.', 'color:#a855f7;font-size:14px;font-weight:700;padding:4px 0')
    console.log('%c↑↑↓↓←→←→BA  anywhere on the page for a surprise', 'color:#22d3ee;font-size:12px;padding:2px 0')
    console.log('%c[T] cycle themes   [` backtick] reveal mode   [logo ×5] unlock classified project', 'color:#555;font-size:11px;padding:2px 0')
  }, [])

  // Global keyboard shortcuts + Konami detector
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        if (e.key === 't' || e.key === 'T') {
          setTheme(t => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length])
        }
        if (e.key === '`') {
          setRevealMode(r => !r)
        }
      }
      konamiBuffer.current = [...konamiBuffer.current.slice(-9), e.key]
      if (JSON.stringify(konamiBuffer.current) === JSON.stringify(KONAMI)) {
        setKonamiActive(true)
        konamiBuffer.current = []
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Sync theme to document
  useEffect(() => {
    const html = document.documentElement
    if (theme === 'default') html.removeAttribute('data-theme')
    else html.setAttribute('data-theme', theme)
  }, [theme])

  // Cursor context detection
  useEffect(() => {
    const over = (e) => {
      const el = e.target
      if (el.closest('button, a, [data-cursor="hover"], [role="button"], input, select')) {
        setCursorType(revealMode ? 'reveal' : 'hover')
      } else if (el.closest('p, h1, h2, h3, h4, span, li')) {
        setCursorType(revealMode ? 'reveal' : 'text')
      } else {
        setCursorType(revealMode ? 'reveal' : 'default')
      }
    }
    window.addEventListener('mouseover', over)
    return () => window.removeEventListener('mouseover', over)
  }, [revealMode])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="noise-overlay" aria-hidden="true" />
      <Cursor type={revealMode ? 'reveal' : cursorType} />

      {revealMode && (
        <div
          className="fixed bottom-6 right-6 z-[9990] font-mono text-xs tracking-widest px-3 py-1.5 rounded-full"
          style={{
            color: 'var(--accent3)',
            border: '1px solid var(--accent3)',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(12px)',
          }}
        >
          ◉ REVEAL MODE
        </div>
      )}

      <Nav theme={theme} onLogoSecret={() => setSecretUnlocked(s => !s)} />

      <main>
        <Hero revealMode={revealMode} />
        <Work revealMode={revealMode} secretUnlocked={secretUnlocked} />
        <About />
        <Lab />
        <Contact />
      </main>

      {konamiActive && <KonamiOverlay onClose={() => setKonamiActive(false)} />}
    </div>
  )
}
