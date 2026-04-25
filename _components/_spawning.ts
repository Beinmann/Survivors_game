import { IGameScene } from './_sceneInterface'
import { WORLD, DESPAWN_DIST } from './_constants'
import { ENEMY_TYPES } from './_enemyTypes'
import { getMapDef } from './_maps'
import { WaveDef } from './_waves'

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

export function getActiveWave(
  waves: WaveDef[],
  gameTimeSecs: number,
): { wave: WaveDef; index: number; startSec: number; endSec: number } | null {
  let acc = 0
  for (let i = 0; i < waves.length; i++) {
    const end = acc + waves[i].durationSec
    if (gameTimeSecs < end) return { wave: waves[i], index: i, startSec: acc, endSec: end }
    acc = end
  }
  return null
}

export function showWaveBanner(scene: IGameScene, text: string, enemyKeys?: string[]) {
  const { width: w, height: h } = scene.cameras.main
  const banner = scene.add.text(w / 2, h / 2 - 100, text, {
    fontSize: '28px', color: '#facc15', stroke: '#000000', strokeThickness: 5,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(30)
  scene.tweens.add({
    targets: banner, alpha: 0, duration: 2500, delay: 500,
    onComplete: () => banner.destroy(),
  })

  if (enemyKeys && enemyKeys.length > 0) {
    const ordered = ENEMY_TYPES.map(t => t.key).filter(k => enemyKeys.includes(k))
    const iconSize = 28, gap = 8
    const rowW = ordered.length * iconSize + (ordered.length - 1) * gap
    const startX = w / 2 - rowW / 2 + iconSize / 2
    const y = h / 2 - 100 + 32
    const icons: any[] = []
    ordered.forEach((key, i) => {
      const img = scene.add.image(startX + i * (iconSize + gap), y, key)
        .setScrollFactor(0).setDepth(30).setDisplaySize(iconSize, iconSize)
      icons.push(img)
    })
    scene.tweens.add({
      targets: icons, alpha: 0, duration: 2500, delay: 500,
      onComplete: () => icons.forEach(o => o.destroy()),
    })
  }
}

export function spawnWave(scene: IGameScene) {
  const gameTimeSecs = scene.gameTime / 1000
  const count = 2 + Math.floor(gameTimeSecs / 25) + Math.floor(gameTimeSecs / 120)
  const map = getMapDef(scene.selectedMap)
  const active = getActiveWave(map.waves, gameTimeSecs)

  let available: typeof ENEMY_TYPES
  if (active) {
    const w = active.wave.weights
    available = ENEMY_TYPES
      .map(t => ({ ...t, weight: w[t.key] ?? 0 }))
      .filter(t => t.weight > 0)
  } else {
    available = ENEMY_TYPES.filter(t => t.weight > 0)
  }

  if (available.length === 0) {
    scene.spawnTimer = scene.spawnRate * spawnPressure(scene)
    return
  }

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
      e.setDepth(3).setData('hp', type.hp).setData('speed', type.speed).setData('orbBonus', type.orbBonus).setData('maxHp', type.hp)
      if (type.key === 'enemy_charger') {
        e.setData('isCharger', true).setData('chargeState', 'idle').setData('chargeTimer', 2000 + Math.random() * 2000)
      }
      if (type.key === 'enemy_ghost') {
        e.setAlpha(0.45).setData('isGhost', true)
      }
      if (type.key === 'enemy_bomber') {
        e.setData('explodes', true)
      }
      if (type.key === 'enemy_splitter') {
        e.setData('splits', true)
      }
      if (type.key === 'enemy_plague') {
        e.setData('leavesPool', true)
      }
      if (type.key === 'enemy_juggernaut') {
        e.setData('knockback', true)
      }
      if (type.key === 'enemy_sapper') {
        e.setData('sapper', true).setData('sapperState', 'idle')
      }
      if (type.key === 'enemy_hunter') {
        e.setData('isHunter', true).setData('hunterDist', 140 + Math.random() * 40).setData('hunterDir', Math.random() < 0.5 ? -1 : 1)
      }
      if (type.key === 'enemy_dasher') {
        e.setData('isDasher', true).setData('chargeState', 'idle').setData('chargeTimer', 1000 + Math.random() * 800).setData('dashesLeft', 0)
      }
      if (type.key === 'enemy_healer') {
        e.setData('isHealer', true).setData('healTimer', 1500)
      }
      if (type.key === 'enemy_berserker') {
        e.setData('berserker', true).setData('baseSpeed', type.speed)
      }
      if (type.key === 'enemy_lockdown') {
        e.setData('lockdown', true)
      }
      if (type.key === 'enemy_scavenger') {
        e.setData('isScavenger', true)
      }
      if (type.key === 'enemy_ambusher') {
        e.setData('isAmbusher', true).setData('ambushState', 'dormant').setData('ambushTimer', 3000).setAlpha(0.75).setTint(0x555555)
      }
      if (type.key === 'enemy_blinker') {
        e.setData('isBlinker', true).setData('blinkTimer', 1800 + Math.random() * 500)
      }
      if (type.key === 'enemy_nest') {
        e.setData('isNest', true).setData('nestSpawnTimer', 2000).setData('nestChildren', [])
        e.setVelocity(0, 0)
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
    boss.setDepth(3).setData('hp', 1500).setData('speed', 47).setData('orbBonus', 18).setData('maxHp', 1500)
  })
}

export function spawnMiniBoss(scene: IGameScene) {
  const gameTimeSecs = scene.gameTime / 1000
  const candidates = ENEMY_TYPES.filter(
    t => t.key.startsWith('enemy_miniboss_') && t.unlockSecs <= gameTimeSecs,
  )
  if (candidates.length === 0) return

  const type = candidates[Math.floor(Math.random() * candidates.length)]
  const angle = Math.random() * Math.PI * 2
  const bx = clamp(scene.player.x + Math.cos(angle) * 620, 10, WORLD - 10)
  const by = clamp(scene.player.y + Math.sin(angle) * 620, 10, WORLD - 10)
  const e = scene.enemies.create(bx, by, type.key)
  e.setDepth(3)
    .setData('hp', type.hp)
    .setData('maxHp', type.hp)
    .setData('speed', type.speed)
    .setData('orbBonus', type.orbBonus)
    .setData('isMiniboss', true)
  if (type.key === 'enemy_miniboss_warden') {
    e.setData('knockback', true)
  }
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
      } while ((x - cx) ** 2 + (y - cy) ** 2 < safeR * safeR)
      scene.obstacles.create(x, y, key).setDepth(3)
    }
  }
  place('obs_pillar', 260)
  place('obs_hwall',  130)
  place('obs_vwall',  130)
}

export function moveEnemies(scene: IGameScene, delta: number) {
  const px = scene.player.x, py = scene.player.y
  const despawnDist2 = DESPAWN_DIST * DESPAWN_DIST
  for (const e of scene.enemies.getChildren() as any[]) {
    const edx = px - e.x, edy = py - e.y
    if (edx*edx + edy*edy > despawnDist2) { e.destroy(); continue }
    if (scene.freezeTimer > 0) { e.setVelocity(0, 0); continue }

    const stunned = e.getData('stunned') ?? 0
    if (stunned > 0) {
      e.setData('stunned', stunned - delta)
      e.setVelocity(0, 0)
      continue
    }

    const slowed = e.getData('slowed') ?? 0
    if (slowed > 0) e.setData('slowed', slowed - delta)

    const angle = Math.atan2(py - e.y, px - e.x)
    let speed = (e.getData('speed') ?? 70) * scene.globalSpeedMult
    if (slowed > 0) speed *= 0.5

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

    if (e.getData('isDasher')) {
      const st = e.getData('chargeState')
      const t = e.getData('chargeTimer') - delta
      e.setData('chargeTimer', t)
      if (st === 'idle') {
        e.setVelocity(Math.cos(angle) * speed * 0.6, Math.sin(angle) * speed * 0.6)
        e.setRotation(angle)
        if (t <= 0) {
          e.setData('chargeState', 'telegraph')
          e.setData('chargeTimer', 350)
          e.setData('dashesLeft', 2)
          e.setTint(0x22d3ee)
        }
      } else if (st === 'telegraph') {
        e.setVelocity(0, 0)
        if (t <= 0) {
          e.setData('chargeAngle', angle)
          e.setData('chargeState', 'charging')
          e.setData('chargeTimer', 420)
          e.clearTint()
        }
      } else {
        const ca = e.getData('chargeAngle')
        e.setVelocity(Math.cos(ca) * 430, Math.sin(ca) * 430)
        e.setRotation(ca)
        if (t <= 0) {
          const remaining = (e.getData('dashesLeft') ?? 1) - 1
          e.setData('dashesLeft', remaining)
          if (remaining > 0) {
            e.setData('chargeState', 'telegraph')
            e.setData('chargeTimer', 180)
            e.setTint(0x22d3ee)
          } else {
            e.setData('chargeState', 'idle')
            e.setData('chargeTimer', 1200 + Math.random() * 600)
          }
        }
      }
      continue
    }

    if (e.getData('isHunter')) {
      const dist = Math.hypot(edx, edy)
      const target = e.getData('hunterDist') ?? 140
      const dir = e.getData('hunterDir') ?? 1
      let moveAngle: number
      if (dist > target + 25) {
        moveAngle = angle
      } else if (dist < target - 25) {
        moveAngle = angle + Math.PI
      } else {
        moveAngle = angle + dir * Math.PI / 2
      }
      e.setVelocity(Math.cos(moveAngle) * speed, Math.sin(moveAngle) * speed)
      e.setRotation(angle)
      continue
    }

    if (e.getData('isBlinker')) {
      const t = (e.getData('blinkTimer') ?? 0) - delta
      if (t <= 0) {
        const spark = scene.add.graphics().setDepth(4)
        spark.lineStyle(2, 0xecfeff, 0.9).strokeCircle(e.x, e.y, 12)
        const dist = Math.hypot(edx, edy)
        const step = Math.min(140, dist - 20)
        if (step > 0) {
          e.setPosition(e.x + Math.cos(angle) * step, e.y + Math.sin(angle) * step)
        }
        scene.tweens.add({ targets: spark, alpha: 0, duration: 220, onComplete: () => spark.destroy() })
        e.setData('blinkTimer', 1600 + Math.random() * 800)
      } else {
        e.setData('blinkTimer', t)
      }
      e.setVelocity(Math.cos(angle) * speed * 0.6, Math.sin(angle) * speed * 0.6)
      e.setRotation(angle)
      continue
    }

    if (e.getData('isScavenger')) {
      let targetOrb: any = null
      let bestD2 = Infinity
      for (const o of scene.xpOrbs.getChildren() as any[]) {
        if (!o.active) continue
        const dx = o.x - e.x, dy = o.y - e.y
        const d2 = dx*dx + dy*dy
        if (d2 < bestD2) { bestD2 = d2; targetOrb = o }
      }
      if (targetOrb) {
        const ang = Math.atan2(targetOrb.y - e.y, targetOrb.x - e.x)
        e.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed)
        e.setRotation(ang)
        if (bestD2 < 18 * 18 && targetOrb.active) targetOrb.destroy()
      } else {
        e.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        e.setRotation(angle)
      }
      continue
    }

    if (e.getData('isAmbusher')) {
      const st = e.getData('ambushState')
      if (st === 'dormant') {
        e.setVelocity(0, 0)
        const t = (e.getData('ambushTimer') ?? 0) - delta
        e.setData('ambushTimer', t)
        const triggered = t <= 0 || (edx*edx + edy*edy) < 120 * 120
        if (triggered) {
          e.setData('ambushState', 'active')
          e.clearTint()
          e.setAlpha(1)
        }
        continue
      }
    }

    if (e.getData('isNest')) {
      e.setVelocity(0, 0)
      const t = (e.getData('nestSpawnTimer') ?? 0) - delta
      const children: any[] = e.getData('nestChildren') ?? []
      const alive = children.filter(c => c.active)
      if (alive.length !== children.length) e.setData('nestChildren', alive)
      if (t <= 0 && alive.length < 3) {
        const sa = Math.random() * Math.PI * 2
        const sr = 30 + Math.random() * 20
        const child = scene.enemies.create(e.x + Math.cos(sa) * sr, e.y + Math.sin(sa) * sr, 'enemy_grunt') as any
        child.setDepth(3).setData('hp', 30).setData('speed', 80).setData('orbBonus', 0).setData('maxHp', 30)
        alive.push(child)
        e.setData('nestChildren', alive)
        e.setData('nestSpawnTimer', 2000)
      } else {
        e.setData('nestSpawnTimer', t)
      }
      continue
    }

    if (e.getData('isHealer')) {
      const t = (e.getData('healTimer') ?? 0) - delta
      if (t <= 0) {
        const r2 = 140 * 140
        for (const other of scene.enemies.getChildren() as any[]) {
          if (!other.active || other === e) continue
          const dx = other.x - e.x, dy = other.y - e.y
          if (dx*dx + dy*dy > r2) continue
          const maxHp = other.getData('maxHp') ?? other.getData('hp')
          const cur = other.getData('hp') ?? maxHp
          if (cur < maxHp) {
            other.setData('hp', Math.min(maxHp, cur + 12))
          }
        }
        const pulse = scene.add.graphics().setDepth(4)
        pulse.lineStyle(2, 0x86efac, 0.7).strokeCircle(e.x, e.y, 140)
        scene.tweens.add({ targets: pulse, alpha: 0, duration: 420, onComplete: () => pulse.destroy() })
        e.setData('healTimer', 1500)
      } else {
        e.setData('healTimer', t)
      }
    }

    if (e.getData('sapper')) {
      const st = e.getData('sapperState')
      const dist2 = edx*edx + edy*edy
      if (st === 'idle' && dist2 < 150 * 150) {
        e.setData('sapperState', 'telegraph')
        e.setData('sapperTimer', 900)
        e.setTint(0xff8800)
      }
      if (st === 'telegraph') {
        e.setVelocity(0, 0)
        const tt = (e.getData('sapperTimer') ?? 0) - delta
        e.setData('sapperTimer', tt)
        if (tt <= 0) {
          scene.killEnemy(e)
        }
        continue
      }
    }

    e.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
    e.setRotation(angle)
  }
}
