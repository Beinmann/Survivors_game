'use client'

import { useEffect, useRef, useState } from 'react'
import { createGameScene } from './_scene'

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    let phaserGame: { destroy: (removeCanvas: boolean) => void } | null = null
    let cancelled = false

    async function init() {
      // Phaser ESM build uses named exports only — no default export
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Phaser = (await import('phaser')) as any
      if (cancelled) return

      const GameScene = createGameScene(Phaser)

      phaserGame = new Phaser.Game({
        type: Phaser.AUTO,
        width: container.clientWidth || 800,
        height: 520,
        backgroundColor: '#111111',
        parent: container,
        physics: { default: 'arcade', arcade: { debug: false, fixedStep: false } },
        scene: [GameScene],
        audio: { noAudio: true },
      })
    }

    init()

    const handleVisibility = () => {
      if (!document.hidden) (phaserGame as any)?.loop?.resetDelta?.()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const scaleCanvas = () => {
      const canvas = container.querySelector('canvas')
      if (!canvas) return
      const sx = window.innerWidth / canvas.width
      const sy = window.innerHeight / canvas.height
      const s = Math.min(sx, sy)
      const ox = (window.innerWidth - canvas.width * s) / 2
      const oy = (window.innerHeight - canvas.height * s) / 2
      canvas.style.transform = `scale(${s})`
      canvas.style.transformOrigin = '0 0'
      canvas.style.position = 'absolute'
      canvas.style.left = `${ox}px`
      canvas.style.top = `${oy}px`
    }

    const unscaleCanvas = () => {
      const canvas = container.querySelector('canvas')
      if (!canvas) return
      canvas.style.transform = ''
      canvas.style.transformOrigin = ''
      canvas.style.position = ''
      canvas.style.left = ''
      canvas.style.top = ''
    }

    const handleFullscreenChange = () => {
      const fs = !!document.fullscreenElement
      setIsFullscreen(fs)
      if (fs) scaleCanvas(); else unscaleCanvas()
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!document.fullscreenElement) {
          container.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelled = true
      if (document.fullscreenElement === container) document.exitFullscreen().catch(() => {})
      document.removeEventListener('visibilitychange', handleVisibility)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown)
      phaserGame?.destroy(true)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] rounded-xl overflow-hidden border border-zinc-800 bg-[#111111]"
    >
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen (F)'}
        className="absolute bottom-2 right-2 z-10 p-1.5 rounded text-zinc-600 hover:text-zinc-200 hover:bg-black/50 transition-colors"
      >
        <FullscreenIcon active={isFullscreen} />
      </button>
    </div>
  )
}

function FullscreenIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {active ? (
        <>
          <polyline points="1,4 4,4 4,1" />
          <polyline points="10,1 10,4 13,4" />
          <polyline points="13,10 10,10 10,13" />
          <polyline points="4,13 4,10 1,10" />
        </>
      ) : (
        <>
          <polyline points="4,1 1,1 1,4" />
          <polyline points="10,1 13,1 13,4" />
          <polyline points="13,10 13,13 10,13" />
          <polyline points="1,10 1,13 4,13" />
        </>
      )}
    </svg>
  )
}
