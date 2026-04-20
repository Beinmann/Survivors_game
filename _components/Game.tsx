'use client'

import { useEffect, useRef } from 'react'
import { createGameScene } from './_scene'

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null)

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
        physics: { default: 'arcade', arcade: { debug: false } },
        scene: [GameScene],
        audio: { noAudio: true },
      })
    }

    init()
    return () => {
      cancelled = true
      phaserGame?.destroy(true)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-[520px] rounded-xl overflow-hidden border border-zinc-800 bg-[#111111]"
    />
  )
}
