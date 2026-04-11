import { useState, useRef, useEffect } from 'react'

const PROJECTS = [
  {
    id: '01',
    name: 'GEMINI',
    sub: 'AI Conversation Design',
    company: 'Google',
    years: '2022 → 2024',
    role: 'Lead Interaction Designer',
    description:
      "Led IxD for Google's generative AI assistant across mobile, web, and embedded surfaces. Defined conversational turn-taking patterns, error recovery flows, and multi-modal interaction paradigms — reaching 1B+ users at launch. Built the interaction system for Gemini Live's real-time voice mode.",
    tags: ['AI / ML', 'Conversational UI', 'Design Systems', 'Motion Design'],
    accentColor: '#4285F4',
    secret: false,
  },
  {
    id: '02',
    name: 'MATERIAL YOU',
    sub: 'Android Design Language',
    company: 'Google',
    years: '2020 → 2022',
    role: 'Senior Interaction Designer',
    description:
      'Core design lead for Android 12 "Material You" adaptive design system. Defined dynamic color extraction algorithms, shape expression tokens, and motion choreography principles. Authored the interaction specification that now governs 3B+ Android devices globally.',
    tags: ['Design Systems', 'Android', 'Motion Design', 'Accessibility'],
    accentColor: '#4285F4',
    secret: false,
  },
  {
    id: '03',
    name: 'GOOGLE MAPS',
    sub: 'Navigation Redesign',
    company: 'Google',
    years: '2016 → 2020',
    role: 'Interaction Designer',
    description:
      'Redesigned core navigation, live traffic interpretation, and local discovery flows for Google Maps. Introduced Overview mode, rearchitected the step-by-step directions panel, and authored the micro-interaction standards for ETA updates — shipped to 2B monthly users.',
    tags: ['Navigation', 'Data Visualization', 'Mobile', 'User Research'],
    accentColor: '#4285F4',
    secret: false,
  },
  {
    id: '04',
    name: 'WINDOWS 11',
    sub: 'Shell & Desktop Experience',
    company: 'Microsoft',
    years: '2010 → 2013',
    role: 'Interaction Designer',
    description:
      'Defined the interaction model for the Windows 11 Start menu, taskbar, notification center, and multitasking system. Modernized the desktop paradigm for touchscreen-first usage without losing keyboard and mouse precision — shipped to 600M+ devices at launch.',
    tags: ['Desktop', 'Touch Interfaces', 'Systems Design', 'Windows'],
    accentColor: '#0078D4',
    secret: false,
  },
  {
    id: '??',
    name: '[CLASSIFIED]',
    sub: 'NDA — Unlock to reveal',
    company: '████████',
    years: '████ → ████',
    role: '████████████████████████',
    description:
      'This project is classified. Enable reveal mode (press ` backtick) or click the RF logo in the nav 5 times to unlock.',
    tags: ['████████', '██████', '████'],
    accentColor: '#22d3ee',
    secret: true,
  },
]

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

function ProjectRow({ project, index, revealMode, secretUnlocked }) {
  const [expanded, setExpanded] = useState(false)
  const [rowRef, inView] = useInView(0.1)

  const isLocked = project.secret && !secretUnlocked && !revealMode
  const isUnlocked = project.secret && (secretUnlocked || revealMode)

  const handleClick = () => {
    if (isLocked) return
    setExpanded(e => !e)
  }

  return (
    <div
      ref={rowRef}
      className="border-b"
      style={{
        borderColor: 'var(--border)',
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(28px)',
        transition: `opacity 0.7s ${index * 0.08}s cubic-bezier(0.16,1,0.3,1), transform 0.7s ${index * 0.08}s cubic-bezier(0.16,1,0.3,1)`,
      }}
    >
      {/* Row header */}
      <button
        className="w-full text-left flex items-center gap-4 md:gap-8 py-7 md:py-8 group"
        style={{
          background: expanded ? 'rgba(255,255,255,0.015)' : 'transparent',
          transition: 'background 0.2s',
        }}
        onClick={handleClick}
        data-cursor="hover"
      >
        {/* Index */}
        <span
          className="font-mono text-sm tracking-wider flex-shrink-0 w-8 transition-colors duration-200"
          style={{ color: expanded ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          {project.id}
        </span>

        {/* Name + sub */}
        <div className="flex-1 min-w-0 flex items-baseline gap-3 flex-wrap">
          <span
            className="font-bold text-xl md:text-2xl lg:text-3xl tracking-tight transition-all duration-200"
            style={{
              color: expanded ? 'var(--text)' : 'rgba(255,255,255,0.72)',
              filter: isLocked ? 'blur(8px)' : 'none',
            }}
          >
            {project.name}
          </span>
          <span
            className="font-mono text-xs tracking-wider transition-all"
            style={{
              color: 'var(--text-muted)',
              filter: isLocked ? 'blur(4px)' : 'none',
            }}
          >
            {project.sub}
          </span>
        </div>

        {/* Meta */}
        <div
          className="hidden lg:flex items-center gap-8 flex-shrink-0"
          style={{ filter: isLocked ? 'blur(4px)' : 'none' }}
        >
          <span
            className="font-medium text-sm"
            style={{ color: project.accentColor }}
          >
            {project.company}
          </span>
          <span className="font-mono text-xs tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {project.years}
          </span>
        </div>

        {/* Arrow */}
        <span
          className="flex-shrink-0 transition-all duration-300 text-base"
          style={{
            color: expanded ? 'var(--accent)' : 'var(--text-muted)',
            transform: expanded ? 'rotate(45deg)' : 'none',
            marginLeft: 8,
          }}
        >
          {isLocked ? '🔒' : '+'}
        </span>
      </button>

      {/* Expanded content */}
      <div
        className="overflow-hidden"
        style={{
          maxHeight: expanded ? 600 : 0,
          transition: 'max-height 0.55s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10"
          style={{ paddingLeft: '3rem' }}
        >
          {/* Description */}
          <div className="md:col-span-2">
            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isUnlocked
                ? 'Project Sunroof — Google X (Alphabet): Lead interaction designer on an unreleased energy-intelligence platform combining satellite ML models, behavioral economics, and predictive solar ROI to reshape residential clean energy adoption. Architected the end-to-end decision flow for homeowners. NDA restricts specifics — contact to discuss under NDA.'
                : project.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-5">
              {(isUnlocked ? ['Satellite ML', 'Behavioral Design', 'Energy Tech', 'Google X'] : project.tags).map(tag => (
                <span
                  key={tag}
                  className="font-mono text-xs tracking-wider px-3 py-1 rounded-full"
                  style={{
                    color: 'var(--accent)',
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-dim)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Role / CTA */}
          <div className="space-y-5">
            <div>
              <div className="font-mono text-[11px] tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                ROLE
              </div>
              <div className="font-medium" style={{ color: 'var(--text)' }}>
                {isUnlocked ? 'Lead Interaction Designer (Contract)' : project.role}
              </div>
            </div>
            <div>
              <div className="font-mono text-[11px] tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                COMPANY
              </div>
              <div
                className="font-semibold"
                style={{ color: isUnlocked ? 'var(--accent3)' : project.accentColor }}
              >
                {isUnlocked ? 'Google X / Alphabet' : project.company}
              </div>
            </div>

            {!project.secret && (
              <button
                className="group inline-flex items-center gap-2 text-sm font-medium mt-2"
                style={{ color: 'var(--accent)' }}
                data-cursor="hover"
                onClick={(e) => {
                  e.stopPropagation()
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <span
                  className="border-b pb-0.5"
                  style={{ borderColor: 'var(--accent-dim)' }}
                >
                  Request case study
                </span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            )}

            {isUnlocked && (
              <div
                className="font-mono text-xs p-3 rounded border"
                style={{
                  color: 'var(--accent3)',
                  borderColor: 'var(--accent3)',
                  background: 'rgba(34,211,238,0.05)',
                }}
              >
                Contact ryan@ryanfedyk.xyz to discuss under NDA
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Work({ revealMode, secretUnlocked }) {
  const [headerRef, headerInView] = useInView(0.2)

  return (
    <section
      id="work"
      className="py-24 px-6 md:px-12"
      style={{ maxWidth: 1400, margin: '0 auto' }}
    >
      {/* Section header */}
      <div
        ref={headerRef}
        className="flex items-center gap-6 mb-16"
        style={{
          opacity: headerInView ? 1 : 0,
          transform: headerInView ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <span className="font-mono text-xs tracking-widest" style={{ color: 'var(--accent)' }}>02</span>
        <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
        <h2
          className="font-bold tracking-tighter"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)', color: 'rgba(255,255,255,0.9)' }}
        >
          SELECTED WORK
        </h2>
      </div>

      {/* Project list */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        {PROJECTS.map((p, i) => (
          <ProjectRow
            key={p.id}
            project={p}
            index={i}
            revealMode={revealMode}
            secretUnlocked={secretUnlocked}
          />
        ))}
      </div>
    </section>
  )
}
