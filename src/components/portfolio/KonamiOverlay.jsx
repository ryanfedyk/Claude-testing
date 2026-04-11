import { useEffect } from 'react'

const ASCII_ART = `
 ██╗   ██╗ ██████╗ ██╗   ██╗
 ╚██╗ ██╔╝██╔═══██╗██║   ██║
  ╚████╔╝ ██║   ██║██║   ██║
   ╚██╔╝  ██║   ██║██║   ██║
    ██║   ╚██████╔╝╚██████╔╝
    ╚═╝    ╚═════╝  ╚═════╝

 ███████╗ ██████╗ ██╗   ██╗███╗   ██╗██████╗
 ██╔════╝██╔═══██╗██║   ██║████╗  ██║██╔══██╗
 █████╗  ██║   ██║██║   ██║██╔██╗ ██║██║  ██║
 ██╔══╝  ██║   ██║██║   ██║██║╚██╗██║██║  ██║
 ██║     ╚██████╔╝╚██████╔╝██║ ╚████║██████╔╝
 ╚═╝      ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═════╝ `

export default function KonamiOverlay({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[99999]"
      style={{
        background: 'rgba(2,4,7,0.96)',
        backdropFilter: 'blur(24px)',
        animation: 'fade-in 0.3s ease',
      }}
      onClick={onClose}
    >
      {/* Scan line effect */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: 0.03 }}
      >
        <div
          style={{
            width: '100%',
            height: 2,
            background: 'var(--accent)',
            animation: 'scan 4s linear infinite',
          }}
        />
      </div>

      <div
        className="max-w-xl w-full text-center"
        style={{ animation: 'konami-in 0.5s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ASCII art */}
        <pre
          className="font-mono leading-tight mb-6 select-none"
          style={{
            fontSize: 'clamp(6px, 1.1vw, 10px)',
            color: 'var(--accent)',
            whiteSpace: 'pre',
          }}
          aria-hidden="true"
        >
          {ASCII_ART}
        </pre>

        {/* Code sequence display */}
        <div
          className="font-mono text-xs tracking-widest mb-4"
          style={{ color: 'var(--accent2)' }}
        >
          ↑ ↑ ↓ ↓ ← → ← → B A — ACHIEVEMENT UNLOCKED
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>
          You're a real one.
        </h2>
        <p
          className="text-sm leading-relaxed mb-8 max-w-sm mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          Only the most curious visitors find this. You think in systems, test boundaries, and appreciate hidden craft — sounds like we'd work well together.
        </p>

        {/* Terminal block */}
        <div
          className="font-mono text-xs p-4 rounded-lg border text-left mb-8 mx-auto max-w-sm"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="mb-1.5" style={{ color: 'var(--accent)' }}>
            // STATUS.json
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            {`{`}
          </div>
          <div className="ml-4" style={{ color: 'var(--text-secondary)' }}>
            {`"role": "Lead Interaction Designer",`}
          </div>
          <div className="ml-4" style={{ color: 'var(--text-secondary)' }}>
            {`"status": "available for the right problem",`}
          </div>
          <div className="ml-4" style={{ color: 'var(--text-secondary)' }}>
            {`"open_to": ["principal IxD", "lead IC", "advisory"],`}
          </div>
          <div className="ml-4" style={{ color: 'var(--accent3)' }}>
            {`"contact": "ryan@ryanfedyk.xyz"`}
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            {`}`}
          </div>
          <div
            className="mt-1"
            style={{ color: 'var(--accent)', animation: 'blink 1s step-end infinite' }}
          >
            █
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          data-cursor="hover"
          className="font-mono text-xs tracking-widest px-6 py-3 rounded-lg border transition-colors duration-200 hover:border-white/30 hover:text-white"
          style={{
            color: 'var(--text-muted)',
            borderColor: 'var(--border)',
          }}
        >
          [ESC] CLOSE
        </button>

        <div className="mt-4 font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Click anywhere or press ESC
        </div>
      </div>
    </div>
  )
}
