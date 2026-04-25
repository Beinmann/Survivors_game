import { IGameScene } from './_sceneInterface'
import { WORLD } from './_constants'

export const PU_TYPES = [
  { key: 'pu_vacuum', label: 'XP Vacuum',   color: 0xa78bfa, stroke: 0xc4b5fd },
  { key: 'pu_frenzy', label: 'Frenzy',      color: 0xf97316, stroke: 0xfed7aa },
  { key: 'pu_nuke',   label: 'Nuke',        color: 0xef4444, stroke: 0xfca5a5 },
  { key: 'pu_freeze', label: 'Time Freeze', color: 0x22d3ee, stroke: 0xa5f3fc },
  { key: 'pu_heal',   label: 'Full Heal',   color: 0x4ade80, stroke: 0x86efac },
  { key: 'pu_orbs',   label: 'Orb Shower',  color: 0xfbbf24, stroke: 0xfde68a },
]

export function spawnPowerUp(scene: IGameScene, x?: number, y?: number, typeKey?: string) {
  const type = typeKey
    ? PU_TYPES.find(t => t.key === typeKey) ?? PU_TYPES[Math.floor(Math.random() * PU_TYPES.length)]
    : PU_TYPES[Math.floor(Math.random() * PU_TYPES.length)]

  let px: number, py: number
  if (x !== undefined && y !== undefined) {
    px = Math.max(80, Math.min(WORLD - 80, x))
    py = Math.max(80, Math.min(WORLD - 80, y))
  } else {
    const angle = Math.random() * Math.PI * 2
    const dist = 350 + Math.random() * 350
    px = Math.max(80, Math.min(WORLD - 80, scene.player.x + Math.cos(angle) * dist))
    py = Math.max(80, Math.min(WORLD - 80, scene.player.y + Math.sin(angle) * dist))
  }

  const pu = scene.powerUps.create(px, py, type.key)
  pu.setDepth(6).setData('type', type.key)

  scene.tweens.add({
    targets: pu, scaleX: 1.18, scaleY: 1.18,
    duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  })
}

export function dropMinibossReward(scene: IGameScene, x: number, y: number) {
  spawnPowerUp(scene, x, y)
}

export function onCollectPowerUp(scene: IGameScene, _p: any, powerUp: any) {
  const pu = powerUp as any
  if (!pu.active) return
  const type = pu.getData('type')
  pu.destroy()
  scene.applyPowerUp(type)
}

export function applyPowerUp(scene: IGameScene, type: string) {
  if (type === 'pu_vacuum') {
    for (const o of scene.xpOrbs.getChildren() as any[]) {
      if (o.active) o.setData('vacuumed', true)
    }
  } else if (type === 'pu_frenzy') {
    scene.frenzyTimer = 15000
  } else if (type === 'pu_nuke') {
    const cam = scene.cameras.main
    const l = cam.scrollX - 40, r = cam.scrollX + cam.width + 40
    const t = cam.scrollY - 40, b = cam.scrollY + cam.height + 40
    for (const e of [...scene.enemies.getChildren()] as any[]) {
      if (e.active && e.x >= l && e.x <= r && e.y >= t && e.y <= b) scene.killEnemy(e)
    }
    const flash = scene.add.graphics().setScrollFactor(0).setDepth(25)
    flash.fillStyle(0xffffff, 0.35).fillRect(0, 0, cam.width, cam.height)
    scene.tweens.add({ targets: flash, alpha: 0, duration: 350, onComplete: () => flash.destroy() })
  } else if (type === 'pu_freeze') {
    scene.freezeTimer = 5000
    const cam = scene.cameras.main
    const flash = scene.add.graphics().setScrollFactor(0).setDepth(25)
    flash.fillStyle(0x22d3ee, 0.2).fillRect(0, 0, cam.width, cam.height)
    scene.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() })
  } else if (type === 'pu_heal') {
    scene.hp = scene.maxHp
  } else if (type === 'pu_orbs') {
    for (let i = 0; i < 25; i++) {
      const a = (i / 25) * Math.PI * 2
      const r = 60 + Math.random() * 80
      const ox = scene.player.x + Math.cos(a) * r
      const oy = scene.player.y + Math.sin(a) * r
      scene.xpOrbs.create(ox, oy, 'orb').setDepth(2).setVelocity(0, 0).setData('xpValue', 1)
    }
  }
}
