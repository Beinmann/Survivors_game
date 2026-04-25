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

  make('rocket_evolved', g => {
    g.fillStyle(0xfbbf24); g.fillRect(2, 1, 14, 8)
    g.fillStyle(0xb45309); g.fillRect(3, 3, 12, 4)
    g.fillStyle(0xef4444); g.fillRect(0, 2, 4, 6)
    g.fillStyle(0xfde68a); g.fillRect(13, 3, 3, 4)
    g.lineStyle(1, 0xfde68a, 0.9); g.strokeRect(2, 1, 14, 8)
  }, 18, 10)


  make('turret', g => {
    g.fillStyle(0x1f2937); g.fillCircle(14, 14, 11)
    g.lineStyle(2, 0xfbbf24); g.strokeCircle(14, 14, 11)
    g.fillStyle(0xfbbf24); g.fillRect(14, 12, 14, 4)
    g.fillStyle(0xf59e0b); g.fillCircle(14, 14, 4)
  }, 28, 28)

  make('turretbullet', g => {
    g.fillStyle(0xfbbf24); g.fillRect(0, 1, 10, 4)
    g.lineStyle(1, 0xfde68a); g.strokeRect(0, 1, 10, 4)
  }, 10, 6)

  make('blackhole', g => {
    g.fillStyle(0x000000, 1); g.fillCircle(14, 14, 10)
    g.lineStyle(2, 0xa78bfa, 0.9); g.strokeCircle(14, 14, 12)
    g.lineStyle(1, 0xc4b5fd, 0.7); g.strokeCircle(14, 14, 8)
    g.fillStyle(0xa78bfa, 0.5); g.fillCircle(14, 14, 4)
  }, 28, 28)

  make('cryoshard', g => {
    g.fillStyle(0x22d3ee); g.fillTriangle(6, 0, 12, 6, 6, 12)
    g.fillTriangle(6, 0, 0, 6, 6, 12)
    g.lineStyle(1, 0xa5f3fc); g.strokeTriangle(6, 0, 12, 6, 6, 12)
    g.strokeTriangle(6, 0, 0, 6, 6, 12)
  }, 12, 12)

  make('drone', g => {
    g.fillStyle(0xd1d5db); g.fillRect(2, 4, 10, 4)
    g.fillStyle(0x6b7280); g.fillRect(5, 3, 4, 6)
    g.lineStyle(1, 0x9ca3af); g.strokeRect(2, 4, 10, 4)
    g.fillStyle(0xef4444); g.fillCircle(12, 6, 1.2)
  }, 14, 12)

  make('orb', g => {
    g.fillStyle(0x38bdf8, 0.65)
    g.fillTriangle(2.5, 0.5, 4.5, 2.5, 2.5, 4.5)
    g.fillTriangle(2.5, 0.5, 0.5, 2.5, 2.5, 4.5)
    g.lineStyle(0.8, 0xbae6fd, 0.5)
    g.strokeTriangle(2.5, 0.5, 4.5, 2.5, 2.5, 4.5)
    g.strokeTriangle(2.5, 0.5, 0.5, 2.5, 2.5, 4.5)
  }, 5, 5)

  make('drone_hit', g => {
    g.lineStyle(2, 0xf97316)
    g.lineBetween(1, 1, 9, 9)
    g.lineBetween(9, 1, 1, 9)
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
