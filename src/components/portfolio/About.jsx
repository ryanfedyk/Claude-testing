import { useRef, useEffect, useState } from 'react'

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

const TIMELINE = [
  {
    co: 'Google',
    role: 'Interaction Designer → Lead IxD → Principal Designer',
    years: '2013 → 2024',
    color: '#4285F4',
    initial: 'G',
    note: '11 years · 4 product areas',
  },
  {
    co: 'Microsoft',
    role: 'Interaction Designer, Windows Shell',
    years: '2010 → 2013',
    color: '#0078D4',
    initial: 'M',
    note: '3 years · Windows 11',
  },
  {
    co: 'Carnegie Mellon',
    role: 'MFA Interaction Design',
    years: '2008 → 2010',
    color: '#C41230',
    initial: 'C',
    note: 'Graduate thesis: haptic feedback in ambient computing',
  },
]

const SKILLS = [
  { label: 'Interaction Design', level: 97 },
  { label: 'Design Systems', level: 93 },
  { label: 'Prototyping', level: 95 },
  { label: 'Motion Design', level: 87 },
  { label: 'User Research', level: 84 },
  { label: 'AI Interface Design', level: 88 },
]

const TOOLS = ['Figma', 'Framer', 'Origami Studio', 'ProtoPie', 'After Effects', 'Swift UI', 'React', 'GSAP', 'Spline']

function SkillBar({ label, level, delay }) {
  const [ref, inView] = useInView(0.3)
  return (
    <div ref={ref} className="flex items-center gap-4 group">
      <span
        className="font-mono text-xs tracking-wider flex-shrink-0"
        style={{ color: 'var(--text-secondary)', width: 140 }}
      >
        {label}
      </span>
      <div className="flex-1 h-px rounded-full" style={{ background: 'var(--surface2)' }}>
        <div
          className="h-full rounded-full"
          style={{
            background: 'var(--gradient)',
            width: inView ? `${level}%` : '0%',
            transition: `width 1.3s ${delay}s cubic-bezier(0.16,1,0.3,1)`,
          }}
        />
      </div>
      <span
        className="font-mono text-xs w-7 text-right tabular-nums"
        style={{ color: 'var(--text-muted)' }}
      >
        {inView ? level : 0}
      </span>
    </div>
  )
}

export default function About() {
  const [headerRef, headerInView] = useInView(0.1)

  return (
    <section
      id="about"
      className="py-24 px-6 md:px-12"
      style={{ maxWidth: 1400, margin: '0 auto' }}
    >
      {/* Section header */}
      <div
        ref={headerRef}
        className="flex items-center gap-6 mb-20"
        style={{
          opacity: headerInView ? 1 : 0,
          transform: headerInView ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <span className="font-mono text-xs tracking-widest" style={{ color: 'var(--accent)' }}>03</span>
        <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
        <h2
          className="font-bold tracking-tighter"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)', color: 'rgba(255,255,255,0.9)' }}
        >
          ABOUT
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
        {/* Left — bio + skills */}
        <div className="lg:col-span-3 space-y-8">
          <p
            className="text-lg md:text-xl leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            I design for the moments <em>between</em> taps — the transitions, the feedback, the rhythm that makes a product feel alive. After 11 years shaping interaction at Google and 3 at Microsoft, I've learned that great UX is invisible.
          </p>
          <p
            className="text-base md:text-lg leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            My practice centers on systems thinking: building interaction frameworks that scale from a single component to a billion-user platform. I believe the best interfaces feel <em>inevitable</em> — you never notice the craft, only the result.
          </p>
          <p
            className="text-base md:text-lg leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            Right now I'm obsessed with AI interfaces — specifically, how do we design systems that augment human agency without eroding it? That tension keeps me up at night. In the best possible way.
          </p>

          {/* Skill bars */}
          <div className="pt-6 space-y-4">
            <div className="font-mono text-[11px] tracking-widest mb-5" style={{ color: 'var(--accent)' }}>
              CRAFT DEPTH
            </div>
            {SKILLS.map((s, i) => (
              <SkillBar key={s.label} label={s.label} level={s.level} delay={i * 0.08} />
            ))}
          </div>
        </div>

        {/* Right — timeline + tools */}
        <div className="lg:col-span-2">
          <div className="font-mono text-[11px] tracking-widest mb-8" style={{ color: 'var(--accent)' }}>
            EXPERIENCE
          </div>

          <div className="space-y-0">
            {TIMELINE.map((item, i) => (
              <div key={i} className="relative flex gap-5 pb-10 last:pb-0">
                {/* Connector line */}
                {i < TIMELINE.length - 1 && (
                  <div
                    className="absolute top-10 bottom-0 w-px"
                    style={{ left: 20, background: 'var(--border)' }}
                  />
                )}

                {/* Logo badge */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                  style={{
                    background: `${item.color}18`,
                    color: item.color,
                    border: `1px solid ${item.color}35`,
                  }}
                >
                  {item.initial}
                </div>

                {/* Info */}
                <div>
                  <div className="font-semibold text-base" style={{ color: 'var(--text)' }}>{item.co}</div>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.role}</div>
                  <div className="font-mono text-xs mt-1.5 tracking-wider" style={{ color: item.color }}>
                    {item.years}
                  </div>
                  <div className="font-mono text-[10px] mt-1 tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {item.note}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tools */}
          <div className="mt-10 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="font-mono text-[11px] tracking-widest mb-4" style={{ color: 'var(--accent)' }}>
              TOOLS
            </div>
            <div className="flex flex-wrap gap-2">
              {TOOLS.map(t => (
                <span
                  key={t}
                  className="font-mono text-xs px-3 py-1.5 rounded border"
                  style={{
                    color: 'var(--text-secondary)',
                    borderColor: 'var(--border)',
                    background: 'var(--surface)',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
