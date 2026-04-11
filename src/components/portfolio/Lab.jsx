import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Shared hook ──────────────────────────────────────────────────────────────

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

// ─── Experiment 001: Color Harmony ────────────────────────────────────────────

function hslToHex(h, s, l) {
  const a = (s * Math.min(l, 100 - l)) / 100
  const f = (n) => {
    const k = (n + h / 30) % 12
    const c = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

const HARMONY_MODES = {
  Complementary: (h) => [[h, 68, 52], [(h + 180) % 360, 68, 52]],
  Analogous: (h) => [[(h - 30 + 360) % 360, 68, 52], [h, 68, 52], [(h + 30) % 360, 68, 52]],
  Triadic: (h) => [[h, 68, 52], [(h + 120) % 360, 68, 52], [(h + 240) % 360, 68, 52]],
  'Split Comp': (h) => [[h, 68, 52], [(h + 150) % 360, 68, 52], [(h + 210) % 360, 68, 52]],
  Tetradic: (h) => [[h, 68, 52], [(h + 90) % 360, 68, 52], [(h + 180) % 360, 68, 52], [(h + 270) % 360, 68, 52]],
}

function ColorHarmony() {
  const [hue, setHue] = useState(240)
  const [copied, setCopied] = useState(null)

  const copyHex = (hex) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(hex)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  return (
    <div className="space-y-5">
      {/* Hue slider */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] tracking-wider flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          HUE
        </span>
        <input
          type="range" min="0" max="359" value={hue}
          onChange={e => setHue(+e.target.value)}
          className="flex-1"
          style={{
            background: `linear-gradient(to right, hsl(0,68%,52%) 0%, hsl(60,68%,52%) 17%, hsl(120,68%,52%) 33%, hsl(180,68%,52%) 50%, hsl(240,68%,52%) 67%, hsl(300,68%,52%) 83%, hsl(360,68%,52%) 100%)`,
          }}
          data-cursor="hover"
        />
        <span className="font-mono text-xs w-8 tabular-nums" style={{ color: 'var(--accent)' }}>
          {hue}°
        </span>
      </div>

      {/* Schemes */}
      {Object.entries(HARMONY_MODES).map(([name, fn]) => (
        <div key={name} className="flex items-center gap-3">
          <span
            className="font-mono text-[10px] tracking-wider flex-shrink-0"
            style={{ color: 'var(--text-muted)', width: 70 }}
          >
            {name}
          </span>
          <div className="flex gap-1 flex-1">
            {fn(hue).map((c, i) => {
              const hex = hslToHex(c[0], c[1], c[2])
              const isCopied = copied === hex
              return (
                <button
                  key={i}
                  title={isCopied ? 'Copied!' : hex}
                  onClick={() => copyHex(hex)}
                  data-cursor="hover"
                  className="flex-1 rounded relative group transition-transform hover:scale-105 hover:-translate-y-0.5"
                  style={{
                    height: 36,
                    background: hex,
                    border: isCopied ? '2px solid white' : 'none',
                    transition: 'transform 0.15s, border 0.15s',
                  }}
                >
                  <span
                    className="absolute inset-0 flex items-center justify-center font-mono text-[9px] opacity-0 group-hover:opacity-100 transition-opacity rounded"
                    style={{ background: 'rgba(0,0,0,0.4)', color: '#fff' }}
                  >
                    {isCopied ? '✓' : hex}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <p className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
        Click any swatch to copy hex
      </p>
    </div>
  )
}

// ─── Experiment 002: Type Scale ────────────────────────────────────────────────

const SCALE_RATIOS = {
  'Minor Third': 1.2,
  'Major Third': 1.25,
  'Perfect Fourth': 1.333,
  'Golden Ratio': 1.618,
  'Augmented Fourth': 1.414,
}
const STEP_NAMES = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl']
const SAMPLE_TEXT = ['Aa', 'The', 'Design', 'Matters most', 'The details aren\'t details', 'Good design is invisible', 'Interaction design shapes behavior']

function TypeScale() {
  const [base, setBase] = useState(16)
  const [ratio, setRatio] = useState('Perfect Fourth')

  const r = SCALE_RATIOS[ratio]
  const sizes = STEP_NAMES.map((_, i) => +(base * Math.pow(r, i - 2)).toFixed(1))

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>BASE</span>
          <input
            type="number"
            min="12"
            max="24"
            value={base}
            onChange={e => setBase(Math.max(12, Math.min(24, +e.target.value)))}
            className="w-14 rounded border px-2 py-1 font-mono text-xs text-center bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            data-cursor="hover"
          />
          <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>px</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {Object.keys(SCALE_RATIOS).map(r => (
            <button
              key={r}
              onClick={() => setRatio(r)}
              data-cursor="hover"
              className="font-mono text-[10px] tracking-wider px-2 py-1 rounded border transition-all"
              style={{
                borderColor: ratio === r ? 'var(--accent)' : 'var(--border)',
                color: ratio === r ? 'var(--accent)' : 'var(--text-muted)',
                background: ratio === r ? 'var(--accent-dim)' : 'transparent',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Scale preview */}
      <div className="space-y-1 pt-2 overflow-hidden">
        {[...sizes].reverse().map((size, i) => {
          const label = [...STEP_NAMES].reverse()[i]
          const sample = SAMPLE_TEXT[Math.min(i, SAMPLE_TEXT.length - 1)]
          const displaySize = Math.min(size, 52)
          return (
            <div key={label} className="flex items-baseline gap-3">
              <span
                className="font-mono text-[9px] flex-shrink-0 text-right tabular-nums"
                style={{ color: 'var(--text-muted)', width: 36 }}
              >
                {size}px
              </span>
              <span
                className="font-mono text-[9px] flex-shrink-0"
                style={{ color: 'var(--text-muted)', width: 24 }}
              >
                {label}
              </span>
              <span
                className="text-white leading-none truncate"
                style={{
                  fontSize: displaySize,
                  fontFamily: "'Space Grotesk', sans-serif",
                  opacity: 0.5 + (i / STEP_NAMES.length) * 0.5,
                }}
              >
                {sample}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Experiment 003: Reaction Time ────────────────────────────────────────────

const RATINGS = [
  [0, 150, 'Inhuman. Are you a bot?'],
  [150, 200, 'Elite reflexes. Exceptional.'],
  [200, 250, 'Above average. Sharp.'],
  [250, 350, 'Average human response time.'],
  [350, 500, 'Below average. Coffee time?'],
  [500, Infinity, 'You might be a product manager.'],
]

function getRating(ms) {
  return RATINGS.find(([min, max]) => ms >= min && ms < max)?.[2] ?? ''
}

function ReactionGame() {
  const [phase, setPhase] = useState('idle')  // idle | waiting | ready | result | tooEarly
  const [ms, setMs] = useState(null)
  const [best, setBest] = useState(null)
  const [history, setHistory] = useState([])
  const t = useRef(null)
  const startedAt = useRef(null)

  const begin = useCallback(() => {
    setPhase('waiting')
    setMs(null)
    clearTimeout(t.current)
    t.current = setTimeout(() => {
      setPhase('ready')
      startedAt.current = performance.now()
    }, 1500 + Math.random() * 2500)
  }, [])

  const react = useCallback(() => {
    if (phase === 'idle' || phase === 'result' || phase === 'tooEarly') { begin(); return }
    if (phase === 'waiting') {
      clearTimeout(t.current)
      setPhase('tooEarly')
      return
    }
    if (phase === 'ready') {
      const elapsed = Math.round(performance.now() - startedAt.current)
      setMs(elapsed)
      setPhase('result')
      setHistory(h => [...h.slice(-5), elapsed])
      setBest(b => b === null || elapsed < b ? elapsed : b)
    }
  }, [phase, begin])

  const bgColor = {
    idle: 'var(--surface2)',
    waiting: 'rgba(20,20,40,1)',
    ready: 'var(--accent)',
    result: 'var(--surface2)',
    tooEarly: 'rgba(239,68,68,0.25)',
  }[phase]

  return (
    <div className="space-y-4">
      <button
        onClick={react}
        data-cursor="hover"
        className="w-full rounded-xl flex flex-col items-center justify-center text-center select-none transition-colors duration-200"
        style={{ height: 160, background: bgColor }}
      >
        {phase === 'idle' && (
          <>
            <span className="text-white/70 text-sm font-medium">Click to start</span>
            <span className="font-mono text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>React when the color changes</span>
          </>
        )}
        {phase === 'waiting' && (
          <>
            <span className="text-white/40 text-sm font-medium">Wait for it…</span>
            <span className="font-mono text-[11px] mt-1 text-red-400">Don't click early!</span>
          </>
        )}
        {phase === 'ready' && (
          <span className="text-4xl font-bold text-white" style={{ animation: 'fade-in 0.05s ease' }}>
            CLICK!
          </span>
        )}
        {phase === 'result' && ms !== null && (
          <>
            <span className="text-4xl font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{ms}ms</span>
            <span className="font-mono text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{getRating(ms)}</span>
            <span className="font-mono text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>Click to try again</span>
          </>
        )}
        {phase === 'tooEarly' && (
          <>
            <span className="text-lg font-bold text-red-400">Too early!</span>
            <span className="font-mono text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Click to try again</span>
          </>
        )}
      </button>

      {/* History bars */}
      {history.length > 0 && (
        <div className="flex gap-2 items-end h-14">
          {history.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm"
                style={{
                  height: Math.max(4, (v / 500) * 48),
                  background: v === best ? 'var(--accent)' : 'var(--surface2)',
                  border: v === best ? '1px solid var(--accent)' : '1px solid var(--border)',
                  transition: 'background 0.2s',
                }}
              />
              <span
                className="font-mono text-[9px] tabular-nums"
                style={{ color: v === best ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                {v}
              </span>
            </div>
          ))}
          <div
            className="flex-1 flex flex-col items-center justify-end gap-1 pl-2"
            style={{ borderLeft: '1px solid var(--border)' }}
          >
            <span className="font-mono text-[9px]" style={{ color: 'var(--accent)' }}>BEST</span>
            <span className="font-mono text-xs font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{best}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Lab Section ──────────────────────────────────────────────────────────────

const EXPERIMENTS = [
  { id: '001', title: 'Color Harmony', desc: 'Generate color schemes from any hue', Component: ColorHarmony },
  { id: '002', title: 'Type Scale', desc: 'Modular scales with classic musical ratios', Component: TypeScale },
  { id: '003', title: 'Reaction Time', desc: 'How sharp are your reflexes?', Component: ReactionGame },
]

export default function Lab() {
  const [headerRef, headerInView] = useInView(0.1)
  const [open, setOpen] = useState(null)

  return (
    <section
      id="lab"
      className="py-24 px-6 md:px-12"
      style={{ maxWidth: 1400, margin: '0 auto' }}
    >
      {/* Header */}
      <div
        ref={headerRef}
        className="flex items-center gap-6 mb-4"
        style={{
          opacity: headerInView ? 1 : 0,
          transform: headerInView ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <span className="font-mono text-xs tracking-widest" style={{ color: 'var(--accent)' }}>04</span>
        <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
        <h2
          className="font-bold tracking-tighter"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)', color: 'rgba(255,255,255,0.9)' }}
        >
          THE LAB
        </h2>
      </div>

      <p
        className="mb-14 text-sm"
        style={{ color: 'var(--text-muted)', paddingLeft: '2rem' }}
      >
        Interactive design tools & experiments. Click to expand.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {EXPERIMENTS.map(({ id, title, desc, Component }, i) => {
          const isOpen = open === i
          return (
            <div
              key={id}
              className="rounded-xl border overflow-hidden"
              style={{
                borderColor: isOpen ? 'var(--accent)' : 'var(--border)',
                background: 'var(--surface)',
                opacity: headerInView ? 1 : 0,
                transform: headerInView ? 'none' : 'translateY(30px)',
                transition: `opacity 0.6s ${i * 0.1 + 0.2}s ease, transform 0.6s ${i * 0.1 + 0.2}s ease, border-color 0.25s`,
              }}
            >
              {/* Card header */}
              <button
                className="w-full p-5 text-left flex items-start justify-between"
                onClick={() => setOpen(isOpen ? null : i)}
                data-cursor="hover"
              >
                <div>
                  <div
                    className="font-mono text-[10px] tracking-widest mb-2"
                    style={{ color: isOpen ? 'var(--accent)' : 'var(--text-muted)' }}
                  >
                    {id}
                  </div>
                  <div className="font-semibold text-base" style={{ color: 'var(--text)' }}>{title}</div>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</div>
                </div>
                <span
                  className="text-lg flex-shrink-0 ml-2 transition-transform duration-300"
                  style={{
                    color: 'var(--text-muted)',
                    transform: isOpen ? 'rotate(45deg)' : 'none',
                  }}
                >
                  +
                </span>
              </button>

              {/* Experiment content */}
              <div
                className="overflow-hidden"
                style={{
                  maxHeight: isOpen ? 500 : 0,
                  transition: 'max-height 0.5s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <div className="px-5 pb-5">
                  <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <Component />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
