import { useState, useEffect, useRef } from 'react'

const NAV_LINKS = ['work', 'about', 'lab', 'contact']
const THEME_COLORS = { default: '#6366f1', plasma: '#f97316', matrix: '#00ff41' }

export default function Nav({ theme, onLogoSecret }) {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')
  const logoClickCount = useRef(0)
  const logoTimer = useRef(null)
  const [logoGlitch, setLogoGlitch] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Active section detection
  useEffect(() => {
    const ids = [...NAV_LINKS, 'home']
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
      },
      { rootMargin: '-45% 0px -45% 0px' }
    )
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const handleLogoClick = () => {
    setLogoGlitch(true)
    setTimeout(() => setLogoGlitch(false), 600)

    logoClickCount.current += 1
    clearTimeout(logoTimer.current)

    if (logoClickCount.current >= 5) {
      onLogoSecret()
      logoClickCount.current = 0
    } else {
      logoTimer.current = setTimeout(() => { logoClickCount.current = 0 }, 2200)
    }
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const accentColor = THEME_COLORS[theme] || THEME_COLORS.default

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[9000]"
      style={{
        background: scrolled ? 'rgba(2,4,7,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
      }}
    >
      <div
        className="flex items-center justify-between px-8"
        style={{ maxWidth: 1400, margin: '0 auto', height: 64 }}
      >
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          data-cursor="hover"
          className="relative font-mono text-sm tracking-[0.35em] uppercase font-medium group"
          style={{ color: logoGlitch ? accentColor : 'rgba(255,255,255,0.6)' }}
          title="Click 5× for a surprise"
        >
          <span
            className={logoGlitch ? 'glitch' : ''}
            data-text="RF"
            style={{ transition: 'color 0.2s' }}
          >
            RF
          </span>
          <span
            className="absolute -bottom-0.5 left-0 h-px w-0 group-hover:w-full transition-all duration-300"
            style={{ background: accentColor }}
          />
        </button>

        {/* Links + theme dots */}
        <div className="flex items-center gap-8">
          {NAV_LINKS.map(id => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              data-cursor="hover"
              className="font-mono text-xs tracking-widest uppercase transition-colors duration-200 relative"
              style={{ color: active === id ? accentColor : 'rgba(255,255,255,0.35)' }}
            >
              {id}
              {active === id && (
                <span
                  className="absolute -bottom-0.5 left-0 right-0 h-px"
                  style={{ background: accentColor }}
                />
              )}
            </button>
          ))}

          {/* Theme indicator dots */}
          <div
            className="flex items-center gap-1.5 ml-2"
            title="Press T to cycle themes"
            style={{ opacity: 0.5 }}
          >
            {Object.entries(THEME_COLORS).map(([t, c]) => (
              <div
                key={t}
                className="rounded-full transition-all duration-300"
                style={{
                  width: theme === t ? 8 : 5,
                  height: theme === t ? 8 : 5,
                  background: c,
                  opacity: theme === t ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
