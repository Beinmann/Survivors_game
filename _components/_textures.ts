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

  for (const t of ENEMY_TYPES) {
    make(t.key, g => {
      g.fillStyle(t.color); g.fillRoundedRect(0, 0, t.size, t.size, t.radius)
      g.lineStyle(2, t.stroke); g.strokeRoundedRect(1, 1, t.size - 2, t.size - 2, t.radius)
    }, t.size, t.size)
  }

  for (const t of PU_TYPES) {
    make(t.key, (g: any) => {
      const s = 14
      g.fillStyle(t.color, 1)
      g.fillTriangle(s, 0,  s*2, s,  s, s*2)
      g.fillTriangle(s, 0,  0,   s,  s, s*2)
      g.lineStyle(2, t.stroke, 1)
      g.strokeTriangle(s, 0,  s*2, s,  s, s*2)
      g.strokeTriangle(s, 0,  0,   s,  s, s*2)
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

  make('orb', g => {
    g.fillStyle(0xa78bfa); g.fillCircle(5, 5, 5)
    g.lineStyle(1, 0xc4b5fd); g.strokeCircle(5, 5, 4)
  }, 10, 10)

  for (const def of ICON_DEFS) make(def.key, def.draw, def.w, def.h)
}
