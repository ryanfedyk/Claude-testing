import { useEffect, useRef, useState } from 'react'

const CHARS = '!<>-_\\/[]{}=+*^?#@&%$ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function useScramble(text, delayMs = 0) {
  const [out, setOut] = useState(() => text.replace(/[^ ]/g, '_'))
  const iv = useRef(null)

  useEffect(() => {
    let iter = 0
    const run = () => {
      clearInterval(iv.current)
      iv.current = setInterval(() => {
        setOut(
          text.split('').map((ch, i) => {
            if (ch === ' ') return ' '
            if (i < iter) return ch
            return CHARS[Math.floor(Math.random() * CHARS.length)]
          }).join('')
        )
        iter += 0.4
        if (iter >= text.length) {
          clearInterval(iv.current)
          setOut(text)
        }
      }, 32)
    }
    const t = setTimeout(run, delayMs)
    return () => { clearTimeout(t); clearInterval(iv.current) }
  }, [text, delayMs])

  return out
}

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="font-mono text-xs tracking-widest tabular-nums">
      {time.toLocaleTimeString('en-US', { hour12: false })}
    </span>
  )
}

export default function Hero({ revealMode }) {
  const heroRef = useRef(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [entered, setEntered] = useState(false)

  const firstName = useScramble('RYAN', 300)
  const lastName = useScramble('FEDYK', 700)

  useEffect(() => {
    // Trigger entrance animations
    const t = setTimeout(() => setEntered(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onMove = (e) => {
      if (!heroRef.current) return
      const r = heroRef.current.getBoundingClientRect()
      setMouse({
        x: (e.clientX - r.left) / r.width - 0.5,
        y: (e.clientY - r.top) / r.height - 0.5,
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ paddingTop: 64 }}
    >
      {/* Animated dot grid */}
      <div
        className="absolute inset-0 hero-grid pointer-events-none"
        style={{
          transform: `translate(${mouse.x * -24}px, ${mouse.y * -24}px)`,
          transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}
      />

      {/* Radial glow that follows mouse */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at ${50 + mouse.x * 12}% ${45 + mouse.y * 12}%, var(--accent-dim) 0%, transparent 70%)`,
          transition: 'background 0.5s ease-out',
        }}
      />

      {/* Top status bar */}
      <div
        className="relative z-10 px-8 py-3 flex justify-between items-center"
        style={{
          opacity: entered ? 1 : 0,
          transition: 'opacity 0.8s 0.3s ease',
        }}
      >
        <div
          className="font-mono text-xs tracking-widest flex items-center gap-2"
          style={{ color: 'var(--text-muted)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{
              background: '#22c55e',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }}
          />
          AVAILABLE FOR SENIOR IXD ROLES
        </div>
        <div className="font-mono text-xs flex items-center gap-5" style={{ color: 'var(--text-muted)' }}>
          <Clock />
          <span className="tracking-widest">SF / REMOTE</span>
        </div>
      </div>

      {/* Main name — enormous */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-12 py-8">
        <div className="select-none">
          {/* First name */}
          <div
            className="font-bold leading-none"
            style={{
              fontSize: 'clamp(5rem, 19vw, 240px)',
              lineHeight: 0.88,
              letterSpacing: '-0.025em',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <span
              className="block text-white"
              style={{
                opacity: entered ? 1 : 0,
                transform: entered ? 'none' : 'translateY(40px)',
                transition: 'opacity 0.9s 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.9s 0.4s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {firstName}
            </span>

            {/* Last name — outlined */}
            <span
              className="block"
              style={{
                WebkitTextStroke: '2px rgba(255,255,255,0.65)',
                WebkitTextFillColor: 'transparent',
                opacity: entered ? 1 : 0,
                transform: entered ? 'none' : 'translateY(40px)',
                transition: 'opacity 0.9s 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.9s 0.6s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {lastName}
            </span>
          </div>

          {/* Title rule */}
          <div
            className="flex items-center gap-4 mt-5"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? 'none' : 'translateY(20px)',
              transition: 'opacity 0.8s 1s ease, transform 0.8s 1s ease',
            }}
          >
            <div className="h-px w-10 flex-shrink-0" style={{ background: 'var(--accent)' }} />
            <span
              className="font-mono text-sm md:text-base tracking-[0.2em] uppercase"
              style={{ color: 'var(--text-secondary)' }}
            >
              Lead Interaction Designer
            </span>
            <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
          </div>

          {/* Reveal mode hint */}
          {revealMode && (
            <div
              className="inline-flex items-center gap-2 mt-4 font-mono text-xs px-3 py-1.5 rounded border"
              style={{
                color: 'var(--accent3)',
                borderColor: 'var(--accent3)',
                background: 'rgba(34,211,238,0.05)',
                animation: 'fade-in 0.3s ease',
              }}
            >
              ◈ Click the RF logo in the nav 5× to unlock a classified case study
            </div>
          )}
        </div>
      </div>

      {/* Bottom stats bar */}
      <div
        className="relative z-10 px-6 md:px-12 pb-10"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.8s 1.3s ease, transform 0.8s 1.3s ease',
        }}
      >
        <div
          className="flex flex-wrap items-center gap-6 md:gap-12 pt-6"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div>
            <div
              className="font-bold text-3xl md:text-4xl tabular-nums"
              style={{ color: 'var(--accent)', fontFamily: "'Space Grotesk'" }}
            >
              11
            </div>
            <div className="font-mono text-[11px] tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
              YEARS AT GOOGLE
            </div>
          </div>

          <div className="h-10 w-px" style={{ background: 'var(--border)' }} />

          <div>
            <div className="font-bold text-3xl md:text-4xl tabular-nums" style={{ color: 'rgba(255,255,255,0.7)' }}>
              2
            </div>
            <div className="font-mono text-[11px] tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
              COMPANIES
            </div>
          </div>

          <div className="h-10 w-px" style={{ background: 'var(--border)' }} />

          <div>
            <div className="font-bold text-3xl md:text-4xl tabular-nums" style={{ color: 'rgba(255,255,255,0.7)' }}>
              3B+
            </div>
            <div className="font-mono text-[11px] tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
              USERS TOUCHED
            </div>
          </div>

          <div className="h-10 w-px hidden md:block" style={{ background: 'var(--border)' }} />

          <div className="hidden md:block">
            <div className="font-bold text-3xl md:text-4xl tabular-nums" style={{ color: 'rgba(255,255,255,0.7)' }}>
              ∞
            </div>
            <div className="font-mono text-[11px] tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
              PIXELS PUSHED
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="ml-auto flex flex-col items-center gap-1.5" style={{ opacity: 0.35 }}>
            <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--text-muted)' }}>
              SCROLL
            </span>
            <div
              className="w-px h-8 rounded-full"
              style={{
                background: 'var(--accent)',
                animation: 'scroll-hint 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
