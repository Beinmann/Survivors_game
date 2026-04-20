import { IGameScene } from './_sceneInterface'
import { ENEMY_TYPES } from './_enemyTypes'
import { ICON_DEFS } from './iconDefs'
import { PU_TYPES } from './_powerups'

export function buildTextures(scene: IGameScene) {
  const make = (key: string, draw: (g: any) => void, w: number, h: number) => {
    if (scene.textures.exists(key)) return
    const g = scene.make.graphics()
    draw(g); g.generateTexture(key, w, h); g.destroy()
  }

  make('player', g => {
    g.fillStyle(0x4ade80); g.fillRoundedRect(0, 0, 26, 26, 5)
    g.lineStyle(2, 0x86efac); g.strokeRoundedRect(1, 1, 24, 24, 5)
  }, 26, 26)

  // Ranger — teal circle with crosshair
  make('player_a', g => {
    g.fillStyle(0x0891b2); g.fillCircle(13, 13, 12)
    g.lineStyle(2, 0x22d3ee); g.strokeCircle(13, 13, 12)
    g.fillStyle(0x67e8f9); g.fillCircle(13, 13, 3)
    g.lineStyle(1.5, 0x67e8f9)
    g.lineBetween(13, 2, 13, 7)
    g.lineBetween(13, 19, 13, 24)
    g.lineBetween(2, 13, 7, 13)
    g.lineBetween(19, 13, 24, 13)
  }, 26, 26)

  // Mage — purple diamond with inner glow
  make('player_b', g => {
    g.fillStyle(0x7c3aed)
    g.fillTriangle(13, 1, 25, 13, 13, 25)
    g.fillTriangle(13, 1, 1, 13, 13, 25)
    g.lineStyle(2, 0xa78bfa)
    g.strokeTriangle(13, 1, 25, 13, 13, 25)
    g.strokeTriangle(13, 1, 1, 13, 13, 25)
    g.fillStyle(0xddd6fe, 0.6)
    g.fillTriangle(13, 7, 19, 13, 13, 19)
    g.fillTriangle(13, 7, 7, 13, 13, 19)
  }, 26, 26)

  // Scout — orange arrowhead pointing right
  make('player_c', g => {
    g.fillStyle(0xd97706)
    g.fillRect(2, 8, 13, 10)
    g.fillTriangle(15, 5, 24, 13, 15, 21)
    g.lineStyle(2, 0xfbbf24)
    g.lineBetween(2, 8, 15, 8)
    g.lineBetween(15, 8, 15, 5)
    g.lineBetween(15, 5, 24, 13)
    g.lineBetween(24, 13, 15, 21)
    g.lineBetween(15, 21, 15, 18)
    g.lineBetween(15, 18, 2, 18)
    g.lineBetween(2, 18, 2, 8)
  }, 26, 26)

  for (const t of ENEMY_TYPES) {
    const iconKey = 'eico_' + t.key.replace('enemy_', '')
    const def = ICON_DEFS.find(d => d.key === iconKey)
    make(t.key, g => {
      if (def) {
        const scale = t.size / 24
        g.setScale(scale, scale)
        def.draw(g)
      } else {
        g.fillStyle(t.color); g.fillRoundedRect(0, 0, t.size, t.size, t.radius)
        g.lineStyle(2, t.stroke); g.strokeRoundedRect(1, 1, t.size - 2, t.size - 2, t.radius)
      }
    }, t.size, t.size)
  }

  for (const t of PU_TYPES) {
    const def = ICON_DEFS.find(d => d.key === t.key)
    make(t.key, (g: any) => {
      if (def) {
        def.draw(g)
      } else {
        const s = 14
        g.fillStyle(t.color, 1)
        g.fillTriangle(s, 0,  s*2, s,  s, s*2)
        g.fillTriangle(s, 0,  0,   s,  s, s*2)
        g.lineStyle(2, t.stroke, 1)
        g.strokeTriangle(s, 0,  s*2, s,  s, s*2)
        g.strokeTriangle(s, 0,  0,   s,  s, s*2)
      }
    }, 28, 28)
  }

  make('obs_pillar', g => {
    g.fillStyle(0x2d3748); g.fillRect(0, 0, 48, 48)
    g.lineStyle(2, 0x4a5568); g.strokeRect(1, 1, 46, 46)
    g.lineStyle(1, 0x4a5568, 0.4)
    g.lineBetween(8, 8, 40, 40); g.lineBetween(40, 8, 8, 40)
  }, 48, 48)

  make('obs_hwall', g => {
    g.fillStyle(0x2d3748); g.fillRect(0, 0, 160, 40)
    g.lineStyle(2, 0x4a5568); g.strokeRect(1, 1, 158, 38)
    for (let x = 40; x < 160; x += 40) { g.lineStyle(1, 0x4a5568, 0.35); g.lineBetween(x, 4, x, 36) }
  }, 160, 40)

  make('obs_vwall', g => {
    g.fillStyle(0x2d3748); g.fillRect(0, 0, 40, 160)
    g.lineStyle(2, 0x4a5568); g.strokeRect(1, 1, 38, 158)
    for (let y = 40; y < 160; y += 40) { g.lineStyle(1, 0x4a5568, 0.35); g.lineBetween(4, y, 36, y) }
  }, 40, 160)

  make('bullet', g => {
    g.fillStyle(0xfbbf24); g.fillCircle(4, 4, 4)
  }, 8, 8)

  make('mgBullet', g => {
    g.fillStyle(0x4ade80); g.fillRect(0, 1, 10, 4)
    g.lineStyle(1, 0x86efac); g.strokeRect(0, 1, 10, 4)
  }, 10, 6)

  make('sniperBullet', g => {
    g.fillStyle(0x93c5fd); g.fillRect(0, 1, 14, 6)
    g.lineStyle(1, 0xbfdbfe); g.strokeRect(0, 1, 14, 6)
  }, 14, 8)

  make('scythe', g => {
    g.lineStyle(3, 0x94a3b8)
    g.beginPath()
    g.arc(10, 10, 8, -Math.PI/2, Math.PI/2)
    g.strokePath()
    g.lineStyle(1, 0xe2e8f0)
    g.beginPath()
    g.arc(10, 10, 6, -Math.PI/2, Math.PI/2)
    g.strokePath()
  }, 20, 20)

  make('boomerang', g => {
    g.lineStyle(2, 0xf87171)
    g.beginPath()
    g.moveTo(2, 2); g.lineTo(14, 8); g.lineTo(2, 14)
    g.strokePath()
  }, 16, 16)

  make('rocket', g => {
    g.fillStyle(0x475569); g.fillRect(2, 2, 12, 6)
    g.fillStyle(0xef4444); g.fillRect(0, 3, 3, 4)
  }, 16, 10)

  make('fire', g => {
    g.fillStyle(0xf97316, 0.8); g.fillCircle(8, 8, 8)
    g.fillStyle(0xfacc15, 0.5); g.fillCircle(8, 8, 5)
  }, 16, 16)

  make('orb', g => {
    g.fillStyle(0xa78bfa, 0.6)
    g.fillTriangle(5, 1, 9, 5, 5, 9)
    g.fillTriangle(5, 1, 1, 5, 5, 9)
    g.lineStyle(1, 0xddd6fe, 0.45)
    g.strokeTriangle(5, 1, 9, 5, 5, 9)
    g.strokeTriangle(5, 1, 1, 5, 5, 9)
  }, 10, 10)

  make('shock', g => {
    g.lineStyle(2.5, 0xc4b5fd)
    g.beginPath()
    g.moveTo(2, 14)
    g.lineTo(10, 8)
    g.lineTo(4, 8)
    g.lineTo(12, 2)
    g.strokePath()
  }, 14, 16)

  for (const def of ICON_DEFS) make(def.key, def.draw, def.w, def.h)
}
