import { useState, useRef, useEffect } from 'react'

function useInView(threshold = 0.1) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

const EMAIL = 'ryan@ryanfedyk.xyz'

const LINKS = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/ryanfedyk' },
  { label: 'Dribbble', href: 'https://dribbble.com/ryanfedyk' },
  { label: 'Twitter / X', href: 'https://twitter.com/ryanfedyk' },
  { label: 'ryanfedyk.xyz', href: 'https://ryanfedyk.xyz' },
]

export default function Contact() {
  const [copied, setCopied] = useState(false)
  const [ref, inView] = useInView(0.1)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // fallback: select + copy
    }
  }

  return (
    <section
      id="contact"
      className="py-32 px-6 md:px-12 relative overflow-hidden"
      style={{ maxWidth: 1400, margin: '0 auto' }}
    >
      {/* Ambient glow at bottom */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '60%',
          background: 'radial-gradient(ellipse 60% 50% at 50% 100%, var(--accent-dim) 0%, transparent 70%)',
        }}
      />

      <div
        ref={ref}
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'none' : 'translateY(30px)',
          transition: 'opacity 1s ease, transform 1s ease',
        }}
      >
        {/* Section header */}
        <div className="flex items-center gap-6 mb-20">
          <span className="font-mono text-xs tracking-widest" style={{ color: 'var(--accent)' }}>05</span>
          <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
          <h2
            className="font-bold tracking-tighter"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)', color: 'rgba(255,255,255,0.9)' }}
          >
            CONTACT
          </h2>
        </div>

        {/* Headline */}
        <div className="max-w-3xl relative z-10">
          <p
            className="font-bold leading-tight tracking-tight mb-12"
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 4rem)',
              color: 'var(--text)',
            }}
          >
            Let's make something{' '}
            <span className="gradient-text">remarkable</span>{' '}
            together.
          </p>

          {/* Email copy */}
          <button
            onClick={copyEmail}
            data-cursor="hover"
            className="group flex items-center gap-4 mb-16"
          >
            <span
              className="font-medium border-b pb-0.5 transition-colors duration-200"
              style={{
                fontSize: 'clamp(1rem, 2.5vw, 1.75rem)',
                color: copied ? 'var(--accent3)' : 'rgba(255,255,255,0.8)',
                borderColor: copied ? 'var(--accent3)' : 'var(--border)',
              }}
            >
              {EMAIL}
            </span>
            <span
              className="font-mono text-sm flex-shrink-0 transition-all duration-200"
              style={{ color: copied ? 'var(--accent3)' : 'var(--text-muted)' }}
            >
              {copied ? '✓ copied' : '→ copy'}
            </span>
          </button>

          {/* Social links */}
          <div
            className="flex flex-wrap gap-6 pt-8"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {LINKS.map(l => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="hover"
                className="group flex items-center gap-1.5 font-mono text-sm tracking-wider transition-colors duration-200"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="group-hover:text-white transition-colors duration-200">{l.label}</span>
                <span
                  className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  style={{ color: 'var(--accent)' }}
                >
                  ↗
                </span>
              </a>
            ))}
          </div>

          {/* Footer */}
          <div
            className="mt-20 pt-8 flex flex-wrap justify-between items-center gap-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-6">
              <span className="font-mono text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>
                © 2026 RYAN FEDYK
              </span>
              <span className="font-mono text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>
                SF / REMOTE
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Press
              </span>
              {[['T', 'cycle themes'], ['`', 'reveal mode'], ['↑↑↓↓←→←→BA', 'secret']].map(([k, h]) => (
                <span key={k} className="flex items-center gap-1.5">
                  <kbd
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      color: 'var(--accent)',
                    }}
                  >
                    {k}
                  </kbd>
                  <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
