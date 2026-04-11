import { useEffect, useRef, useState } from 'react'

const LERP = 0.1

export default function Cursor({ type }) {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const spotRef = useRef(null)
  const pos = useRef({ x: -300, y: -300 })
  const lag = useRef({ x: -300, y: -300 })
  const raf = useRef(null)
  const [visible, setVisible] = useState(false)
  const [clicked, setClicked] = useState(false)

  useEffect(() => {
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (!visible) setVisible(true)
    }
    const onDown = () => setClicked(true)
    const onUp = () => setClicked(false)

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('mouseleave', () => setVisible(false))
    window.addEventListener('mouseenter', () => setVisible(true))

    const tick = () => {
      lag.current.x += (pos.current.x - lag.current.x) * LERP
      lag.current.y += (pos.current.y - lag.current.y) * LERP

      if (dotRef.current) {
        dotRef.current.style.left = `${pos.current.x}px`
        dotRef.current.style.top = `${pos.current.y}px`
      }
      if (ringRef.current) {
        ringRef.current.style.left = `${lag.current.x}px`
        ringRef.current.style.top = `${lag.current.y}px`
      }
      if (spotRef.current) {
        spotRef.current.style.left = `${lag.current.x - 120}px`
        spotRef.current.style.top = `${lag.current.y - 120}px`
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      cancelAnimationFrame(raf.current)
    }
  }, []) // eslint-disable-line

  const isReveal = type === 'reveal'
  const isHover = type === 'hover'
  const isText = type === 'text'

  const ringSize = isReveal ? 80 : isHover ? 60 : 38
  const ringColor = isReveal ? 'var(--accent3)' : isHover ? 'var(--accent2)' : 'var(--accent)'
  const dotSize = clicked ? 5 : 7

  return (
    <>
      {/* Sharp dot — no lag */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: dotSize,
          height: dotSize,
          background: '#ffffff',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 99999,
          opacity: visible ? 1 : 0,
          transition: 'width 0.12s ease, height 0.12s ease, opacity 0.25s ease',
          willChange: 'left, top',
          mixBlendMode: 'difference',
        }}
      />

      {/* Ring — lerped */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: ringSize,
          height: ringSize,
          border: `1.5px solid ${ringColor}`,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 99998,
          opacity: visible && !isText ? 0.75 : 0,
          transition: 'width 0.35s cubic-bezier(0.16,1,0.3,1), height 0.35s cubic-bezier(0.16,1,0.3,1), border-color 0.25s, opacity 0.3s',
          willChange: 'left, top',
        }}
      />

      {/* Reveal spotlight */}
      <div
        ref={spotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 99990,
          opacity: isReveal && visible ? 1 : 0,
          transition: 'opacity 0.4s ease',
          willChange: 'left, top',
        }}
      />
    </>
  )
}
