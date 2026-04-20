import { IGameScene } from './_sceneInterface'
import { WORLD, DESPAWN_DIST } from './_constants'
import { ENEMY_TYPES } from './_enemyTypes'
import { getMapDef } from './_maps'

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

export function spawnPressure(scene: IGameScene): number {
  const n = scene.enemies.countActive()
  if (n <= 4)  return 0.1
  if (n <= 12) return 0.3
  if (n <= 25) return 0.6
  if (n <= 45) return 1.0
  return 2.5
}

export function spawnWave(scene: IGameScene) {
  const gameTimeSecs = scene.gameTime / 1000
  const count = 2 + Math.floor(gameTimeSecs / 25) + Math.floor(gameTimeSecs / 120)
  const mapWeights = getMapDef(scene.selectedMap).enemyWeights
  const available = ENEMY_TYPES
    .filter(t => gameTimeSecs >= t.unlockSecs)
    .map(t => {
      const ow = mapWeights[t.key]
      return ow !== undefined ? { ...t, weight: ow } : t
    })
    .filter(t => t.weight > 0)
  const totalWeight = available.reduce((s, t) => s + t.weight, 0)
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 550 + Math.random() * 250
    const x = clamp(scene.player.x + Math.cos(angle) * dist, 10, WORLD - 10)
    const y = clamp(scene.player.y + Math.sin(angle) * dist, 10, WORLD - 10)
    let r = Math.random() * totalWeight
    const type = available.find(t => (r -= t.weight) <= 0) ?? available[available.length - 1]

    const spawnOne = (sx: number, sy: number) => {
      const e = scene.enemies.create(sx, sy, type.key)
      e.setDepth(3).setData('hp', type.hp).setData('speed', type.speed).setData('orbBonus', type.orbBonus)
      if (type.key === 'enemy_charger') {
        e.setData('isCharger', true).setData('chargeState', 'idle').setData('chargeTimer', 2000 + Math.random() * 2000)
      }
      if (type.key === 'enemy_ghost') {
        e.setAlpha(0.45).setData('isGhost', true)
      }
      if (type.key === 'enemy_bomber') {
        e.setData('explodes', true)
      }
    }

    if (type.key === 'enemy_swarm') {
      for (let j = 0; j < 5; j++) {
        const sa = Math.random() * Math.PI * 2
        const sr = Math.random() * 50
        spawnOne(
          clamp(x + Math.cos(sa) * sr, 10, WORLD - 10),
          clamp(y + Math.sin(sa) * sr, 10, WORLD - 10),
        )
      }
    } else {
      spawnOne(x, y)
    }
  }
  scene.spawnTimer = scene.spawnRate * spawnPressure(scene)
}

export function spawnBossWave(scene: IGameScene) {
  const { width: w, height: h } = scene.cameras.main
  const warn = scene.add.text(w / 2, h / 2 - 60, '⚠ BOSS INCOMING', {
    fontSize: '26px', color: '#ef4444', stroke: '#000000', strokeThickness: 5,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(30)
  scene.tweens.add({ targets: warn, alpha: 0, duration: 3000, onComplete: () => warn.destroy() })

  scene.time.delayedCall(3000, () => {
    if (scene.dead) return
    const angle = Math.random() * Math.PI * 2
    const bx = clamp(scene.player.x + Math.cos(angle) * 620, 10, WORLD - 10)
    const by = clamp(scene.player.y + Math.sin(angle) * 620, 10, WORLD - 10)
    const boss = scene.enemies.create(bx, by, 'enemy_boss')
    boss.setDepth(3).setData('hp', 1500).setData('speed', 47).setData('orbBonus', 18)
  })
}

export function spawnObstacles(scene: IGameScene) {
  const cx = WORLD / 2, cy = WORLD / 2
  const safeR = 700
  const place = (key: string, count: number) => {
    for (let i = 0; i < count; i++) {
      let x: number, y: number
      do {
        x = 100 + Math.random() * (WORLD - 200)
        y = 100 + Math.random() * (WORLD - 200)
      } while (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < safeR)
      scene.obstacles.create(x, y, key).setDepth(3)
    }
  }
  place('obs_pillar', 260)
  place('obs_hwall',  130)
  place('obs_vwall',  130)
}

export function moveEnemies(scene: IGameScene, delta: number) {
  for (const e of scene.enemies.getChildren() as any[]) {
    const distToPlayer = Math.sqrt((scene.player.x - e.x) ** 2 + (scene.player.y - e.y) ** 2)
    if (distToPlayer > DESPAWN_DIST) { e.destroy(); continue }
    if (scene.freezeTimer > 0) { e.setVelocity(0, 0); continue }

    const stunned = e.getData('stunned') ?? 0
    if (stunned > 0) {
      e.setData('stunned', stunned - delta)
      e.setVelocity(0, 0)
      continue
    }

    const angle = Math.atan2(scene.player.y - e.y, scene.player.x - e.x)
    const speed = (e.getData('speed') ?? 70) * scene.globalSpeedMult

    if (e.getData('isCharger')) {
      const chargeState = e.getData('chargeState')
      const chargeTimer = e.getData('chargeTimer') - delta
      e.setData('chargeTimer', chargeTimer)

      if (chargeState === 'idle') {
        e.setVelocity(Math.cos(angle) * speed * 0.45, Math.sin(angle) * speed * 0.45)
        e.setRotation(angle)
        if (chargeTimer <= 0) {
          e.setData('chargeState', 'telegraph')
          e.setData('chargeTimer', 600)
          e.setTint(0xff6600)
        }
      } else if (chargeState === 'telegraph') {
        e.setVelocity(0, 0)
        if (chargeTimer <= 0) {
          e.setData('chargeAngle', angle)
          e.setData('chargeState', 'charging')
          e.setData('chargeTimer', 900)
          e.clearTint()
        }
      } else {
        const chargeAngle = e.getData('chargeAngle')
        e.setVelocity(Math.cos(chargeAngle) * 380, Math.sin(chargeAngle) * 380)
        e.setRotation(chargeAngle)
        if (chargeTimer <= 0) {
          e.setData('chargeState', 'idle')
          e.setData('chargeTimer', 2500 + Math.random() * 2000)
        }
      }
      continue
    }

    e.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
    e.setRotation(angle)
  }
}
