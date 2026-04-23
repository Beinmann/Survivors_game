import { IGameScene } from './_sceneInterface'
import { WORLD, MAX_ORBS, CONSOLIDATE_NEARBY_RADIUS, CONSOLIDATE_THRESHOLD, CONSOLIDATE_EDGE_MIN, CONSOLIDATE_EDGE_MAX } from './_constants'
import { WeaponType, WEAPON_BASE } from './_types'

export function autoShoot(scene: IGameScene, time: number) {
  const targets = scene.enemies.getChildren() as any[]
  const px = scene.player.x, py = scene.player.y
  const nearest = targets.length > 0
    ? targets.reduce((a, b) => {
        const dax = px - a.x, day = py - a.y
        const dbx = px - b.x, dby = py - b.y
        return dax*dax + day*day <= dbx*dbx + dby*dby ? a : b
      })
    : null
  
  const angle = nearest
    ? Math.atan2(nearest.y - scene.player.y, nearest.x - scene.player.x)
    : 0

  for (const wt of scene.weapons) {
    if (time < (scene.weaponCooldowns[wt] ?? 0)) continue
    if (wt === 'aura') {
      scene.fireAura()
    } else if (wt === 'scythes') {
      scene.fireScythes()
    } else if (wt === 'trail') {
      scene.fireTrail()
    } else if (wt === 'turret') {
      scene.fireTurret()
    } else if (wt === 'orbital') {
      if (!nearest) continue
      scene.fireOrbital()
    } else if (wt === 'drones') {
      if (!nearest) continue
      scene.fireDrones()
    } else {
      if (!nearest) continue
      if (wt === 'shotgun')    scene.fireShotgun(angle, wt)
      else if (wt === 'sniper')     scene.fireSniper(angle, wt)
      else if (wt === 'machinegun') scene.fireMachineGun(angle, wt)
      else if (wt === 'tesla')      scene.fireTesla(angle, wt)
      else if (wt === 'boomerang')  scene.fireBoomerang(angle, wt)
      else if (wt === 'rocket')     scene.fireRocket(angle, wt)
      else if (wt === 'laser')      scene.fireLaser(angle)
      else if (wt === 'blackhole')  scene.fireBlackhole(angle, wt)
      else if (wt === 'grenade')    scene.fireGrenade(angle, wt)
      else if (wt === 'cryo')       scene.fireCryo(angle, wt)
      else if (wt === 'railgun')    scene.fireRailgun(angle)
    }
    scene.weaponCooldowns[wt] = time + scene.effectiveShootRate(wt)
  }
}

export function fireShotgun(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const pellets = 6 + scene.extraBullets + scene.bonusProjectiles
  const cone = Math.PI / 5
  const step = pellets > 1 ? cone / (pellets - 1) : 0

  const bulletScale = 1 + scene.bonusArea * 0.5
  const fire = (a: number) => {
    const b = scene.bullets.create(scene.player.x, scene.player.y, 'bullet') as any
    b.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
    b.setRotation(a)
    b.setData('sx', scene.player.x).setData('sy', scene.player.y).setData('dmg', scene.shotgunDmg)
    b.setDepth(4)
    if (bulletScale !== 1) { b.setScale(bulletScale); b.refreshBody() }
  }
  for (let i = 0; i < pellets; i++) fire(angle + (pellets > 1 ? -cone / 2 + step * i : 0))
}

export function fireSniper(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const b = scene.bullets.create(scene.player.x, scene.player.y, 'sniperBullet') as any
  b.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd)
  b.setRotation(angle)
  b.setData('dmg', scene.sniperDmg)
  b.setData('pierceLeft', scene.pierceCount)
  b.setData('hitEnemies', new Set())
  b.setDepth(4)
  const bulletScale = 1 + scene.bonusArea * 0.5
  if (bulletScale !== 1) { b.setScale(bulletScale); b.refreshBody() }
}

export function fireMachineGun(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const bulletScale = 1 + scene.bonusArea * 0.5
  const fire = (a: number) => {
    const b = scene.bullets.create(scene.player.x, scene.player.y, 'mgBullet') as any
    b.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
    b.setRotation(a)
    b.setData('dmg', scene.machineGunDmg)
    if (scene.machineGunPierce) {
      b.setData('pierceLeft', 1)
      b.setData('hitEnemies', new Set())
    }
    b.setDepth(4)
    if (bulletScale !== 1) { b.setScale(bulletScale); b.refreshBody() }
  }
  const offset = 0.022
  const burst = scene.machineGunBurst + scene.bonusProjectiles
  for (let i = 0; i < burst; i++) {
    fire(angle + (burst > 1 ? (i - (burst - 1) / 2) * offset : 0))
  }
}

function spawnShockIcon(scene: IGameScene, x: number, y: number) {
  const shock = scene.add.sprite(x, y, 'shock').setDepth(15).setScale(0.5 + Math.random() * 0.5)
  shock.setRotation(Math.random() * Math.PI * 2)
  scene.tweens.add({ targets: shock, alpha: 0, duration: 200, onComplete: () => shock.destroy() })
}

export function fireAura(scene: IGameScene) {
  const r = scene.auraRadius * (1 + scene.bonusArea)
  const dmg = scene.auraDmg
  for (const e of scene.enemies.getChildren() as any[]) {
    if (e.active && Math.sqrt((scene.player.x - e.x) ** 2 + (scene.player.y - e.y) ** 2) < r) {
      scene.damageEnemy(e, dmg, false)
      spawnShockIcon(scene, e.x, e.y)
    }
  }
}

export function fireTesla(scene: IGameScene, angle: number, wt: WeaponType) {
  const targets = scene.enemies.getChildren() as any[]
  if (targets.length === 0) return

  let currentTarget = targets.reduce((a, b) => {
    const distA = Math.sqrt((scene.player.x - a.x) ** 2 + (scene.player.y - a.y) ** 2)
    const distB = Math.sqrt((scene.player.x - b.x) ** 2 + (scene.player.y - b.y) ** 2)
    return distA <= distB ? a : b
  })

  const hitSet = new Set()
  let jumps = scene.teslaJumps
  const chain = () => {
    if (!currentTarget || !currentTarget.active) return
    hitSet.add(currentTarget)
    scene.damageEnemy(currentTarget, scene.teslaDmg, true)

    spawnShockIcon(scene, currentTarget.x, currentTarget.y)

    if (scene.teslaStun) {
      currentTarget.setData('stunned', 1000)
    }

    if (jumps <= 0) return
    jumps--

    // Find next target
    const next = targets.find(e => e.active && !hitSet.has(e) &&
      Math.sqrt((e.x - currentTarget.x) ** 2 + (e.y - currentTarget.y) ** 2) < 85)
    
    const targetToZap = next || (scene.teslaArcBack ? currentTarget : null)
    if (targetToZap) {
      const line = scene.acquireGfx(15)
      line.lineStyle(2, 0xbfdbfe, 0.8)
      line.lineBetween(currentTarget.x, currentTarget.y, targetToZap.x, targetToZap.y)
      scene.tweens.add({ targets: line, alpha: 0, duration: 150, onComplete: () => scene.releaseGfx(line) })
      currentTarget = targetToZap
      if (!next) hitSet.delete(currentTarget) // allow arc back
      scene.time.delayedCall(50, chain)
    }
  }

  const startLine = scene.acquireGfx(15)
  startLine.lineStyle(2, 0xffffff, 0.9)
  startLine.lineBetween(scene.player.x, scene.player.y, currentTarget.x, currentTarget.y)
  scene.tweens.add({ targets: startLine, alpha: 0, duration: 150, onComplete: () => scene.releaseGfx(startLine) })
  chain()
}

export function fireBoomerang(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const count = scene.boomerangCount + scene.bonusProjectiles
  const bulletScale = 1 + scene.bonusArea * 0.5
  const effectiveDist = scene.boomerangDist * (1 + scene.bonusArea)
  for (let i = 0; i < count; i++) {
    const a = angle + (i * Math.PI * 2) / count
    const b = scene.bullets.create(scene.player.x, scene.player.y, 'boomerang') as any
    b.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
    b.setData('dmg', scene.boomerangDmg)
    b.setData('dist', effectiveDist)
    b.setData('sx', scene.player.x).setData('sy', scene.player.y)
    b.setData('returning', false)
    b.setData('wt', 'boomerang')
    if (scene.boomerangPierce) {
      b.setData('pierceLeft', 999)
      b.setData('hitEnemies', new Set())
    }
    b.setDepth(4)
    if (bulletScale !== 1) { b.setScale(bulletScale); b.refreshBody() }
  }
}

export function fireRocket(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const burst = scene.rocketBurst + scene.bonusProjectiles
  for (let i = 0; i < burst; i++) {
    scene.time.delayedCall(i * 100, () => {
      if (!scene.player.active) return
      const b = scene.bullets.create(scene.player.x, scene.player.y, 'rocket') as any
      b.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd)
      b.setRotation(angle)
      b.setData('dmg', scene.rocketDmg)
      b.setData('wt', 'rocket')
      b.setData('homing', true)
      b.setDepth(4)
    })
  }
}

function spawnTrailSprite(scene: IGameScene, x: number, y: number) {
  const effectiveTrailSize = scene.trailSize * (1 + scene.bonusArea)
  const f = scene.add.sprite(x, y, 'fire').setDepth(3).setScale(effectiveTrailSize / 16)
  f.setData('isTrail', true)
  f.setData('expiry', scene.gameTime + scene.trailDuration)
  scene.trailSprites.push(f)
}

export function updateTrailSprites(scene: IGameScene, delta: number) {
  if (scene.trailSprites.length === 0) return

  const now = scene.gameTime
  for (let i = scene.trailSprites.length - 1; i >= 0; i--) {
    const f = scene.trailSprites[i]
    if (!f.active) { scene.trailSprites.splice(i, 1); continue }
    if (now >= f.getData('expiry')) {
      if (scene.trailExplode) {
        const exp = scene.acquireGfx(4)
        exp.fillStyle(0xf97316, 0.6).fillCircle(f.x, f.y, 40)
        scene.tweens.add({ targets: exp, alpha: 0, duration: 300, onComplete: () => scene.releaseGfx(exp) })
        const r2 = 1600
        for (const e of scene.enemies.getChildren() as any[]) {
          if (!e.active) continue
          const dx = f.x - e.x, dy = f.y - e.y
          if (dx*dx + dy*dy < r2) scene.damageEnemy(e, scene.trailDmg * 2)
        }
      }
      f.destroy()
      scene.trailSprites.splice(i, 1)
    }
  }

  scene._trailCheckTimer += delta
  if (scene._trailCheckTimer < 250) return
  scene._trailCheckTimer = 0

  if (scene.trailSprites.length === 0) return
  const enemies = scene.enemies.getChildren() as any[]
  if (enemies.length === 0) return
  const effectiveTrailSize = scene.trailSize * (1 + scene.bonusArea)
  const hitR2 = (effectiveTrailSize * 0.8) * (effectiveTrailSize * 0.8)
  for (const f of scene.trailSprites) {
    if (!f.active) continue
    for (const e of enemies) {
      if (!e.active) continue
      const dx = f.x - e.x, dy = f.y - e.y
      if (dx*dx + dy*dy < hitR2) {
        scene.damageEnemy(e, scene.trailDmg, false)
        if (scene.trailBurn) e.setData('burnTicks', 5)
      }
    }
  }
}

export function fireTrail(scene: IGameScene) {
  const cx = scene.player.x
  const cy = scene.player.y
  const lx = scene.trailLastX
  const ly = scene.trailLastY
  const spacing = scene.trailSize * (1 + scene.bonusArea) * 0.6

  if (lx === 0 && ly === 0) {
    spawnTrailSprite(scene, cx, cy)
  } else {
    const dx = cx - lx
    const dy = cy - ly
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < spacing) {
      spawnTrailSprite(scene, cx, cy)
    } else {
      const steps = Math.ceil(dist / spacing)
      for (let i = 1; i <= steps; i++) {
        spawnTrailSprite(scene, lx + dx * (i / steps), ly + dy * (i / steps))
      }
    }
  }

  scene.trailLastX = cx
  scene.trailLastY = cy
}

export function onBulletHitEnemy(scene: IGameScene, bullet: any, enemy: any) {
  const b = bullet as any
  const e = enemy as any
  if (!b.active || !e.active) return

  const pierceLeft = b.getData('pierceLeft')

  if (pierceLeft !== undefined) {
    const hitSet: Set<any> = b.getData('hitEnemies')
    if (hitSet.has(e)) return
    hitSet.add(e)
    const dmg = b.getData('dmg') ?? (b.getData('wt') === 'boomerang' ? scene.boomerangDmg : scene.sniperDmg)
    scene.damageEnemy(e, dmg)
    const remaining = pierceLeft - 1
    if (remaining <= 0) b.destroy()
    else b.setData('pierceLeft', remaining)
  } else {
    const wt = b.getData('wt')
    const dmg = b.getData('dmg') ?? (wt === 'rocket' ? scene.rocketDmg : scene.shotgunDmg)
    if (wt === 'grenade') {
      return
    }
    if (wt === 'rocket') {
      const effectiveRocketRadius = scene.rocketRadius * (1 + scene.bonusArea)
      const exp = scene.acquireGfx(15)
      exp.fillStyle(0xef4444, 0.4).fillCircle(b.x, b.y, effectiveRocketRadius)
      scene.tweens.add({ targets: exp, alpha: 0, duration: 200, onComplete: () => scene.releaseGfx(exp) })
      for (const enemyObj of scene.enemies.getChildren() as any[]) {
        if (enemyObj.active && Math.sqrt((b.x - enemyObj.x) ** 2 + (b.y - enemyObj.y) ** 2) < effectiveRocketRadius) {
          scene.damageEnemy(enemyObj, dmg)
        }
      }
      if (scene.rocketSplit && !b.getData('split')) {
        for (let i = 0; i < 3; i++) {
          const m = scene.bullets.create(b.x, b.y, 'rocket') as any
          m.setScale(0.5).setData('dmg', Math.floor(dmg / 2)).setData('wt', 'rocket').setData('homing', true).setData('split', true).setDepth(4)
          const ma = Math.random() * Math.PI * 2
          m.setVelocity(Math.cos(ma) * 400, Math.sin(ma) * 400)
        }
      }
    }
    if (wt === 'cryo') {
      e.setData('slowed', scene.cryoSlowDuration)
    }
    b.destroy()
    if (wt !== 'rocket') scene.damageEnemy(e, dmg)
  }
}

export function onPlayerHitEnemy(scene: IGameScene, _p: any, _e: any) {
  if (scene.iframes > 0) return
  const contactDmg = 10 + Math.floor((scene.gameTime / 1000) / 60) * 4
  scene.hp = Math.max(0, scene.hp - contactDmg)
  scene.iframes = 650
  if (scene.hp <= 0) scene.showGameOver()
}

export function damageEnemy(scene: IGameScene, e: any, dmg: number, flash = true) {
  if (!e.active) return
  const hp = e.getData('hp') - dmg
  if (hp <= 0) { scene.killEnemy(e); return }
  e.setData('hp', hp)
  if (flash) {
    e.setTint(0xffffff)
    scene.time.delayedCall(90, () => { if (e.active) e.clearTint() })
  }
}

export function killEnemy(scene: IGameScene, e: any) {
  if (!e.active) return

  if (e.getData('explodes')) {
    const expRadius = 80
    const expFlash = scene.add.graphics().setDepth(8)
    expFlash.fillStyle(0xff4400, 0.55).fillCircle(e.x, e.y, expRadius)
    expFlash.lineStyle(2, 0xff8800, 0.9).strokeCircle(e.x, e.y, expRadius)
    scene.tweens.add({ targets: expFlash, alpha: 0, duration: 450, onComplete: () => expFlash.destroy() })
    
    const distToPlayer = Math.sqrt((scene.player.x - e.x) ** 2 + (scene.player.y - e.y) ** 2)
    if (scene.iframes <= 0 && distToPlayer <= expRadius) {
      const contactDmg = 10 + Math.floor((scene.gameTime / 1000) / 60) * 4
      scene.hp = Math.max(0, scene.hp - contactDmg)
      scene.iframes = 650
      if (scene.hp <= 0) scene.showGameOver()
    }
  }

  const orbBonus = e.getData('orbBonus') ?? 0
  const orbCount = 1 + orbBonus

  const cr2 = CONSOLIDATE_NEARBY_RADIUS * CONSOLIDATE_NEARBY_RADIUS
  let nearbyCount = 0
  for (const o of scene.xpOrbs.getChildren() as any[]) {
    if (!o.active) continue
    const dx = scene.player.x - o.x, dy = scene.player.y - o.y
    if (dx*dx + dy*dy < cr2) nearbyCount++
  }
  const crowded = nearbyCount >= CONSOLIDATE_THRESHOLD

  if (crowded) {
    let existing: any = null
    let bestDist2 = Infinity
    for (const o of scene.xpOrbs.getChildren() as any[]) {
      if (!o.active) continue
      if ((o.getData('xpValue') ?? 1) <= 1) continue
      const dx = scene.player.x - o.x, dy = scene.player.y - o.y
      const d2 = dx*dx + dy*dy
      if (d2 < bestDist2) { bestDist2 = d2; existing = o }
    }

    if (existing) {
      const newVal = (existing.getData('xpValue') ?? 1) + orbCount
      existing.setData('xpValue', newVal)
      scene.tintConsolidatedOrb(existing, newVal)
    } else if (scene.xpOrbs.countActive() < MAX_ORBS) {
      const angle = Math.random() * Math.PI * 2
      const dist = CONSOLIDATE_EDGE_MIN + Math.random() * (CONSOLIDATE_EDGE_MAX - CONSOLIDATE_EDGE_MIN)
      const cx = Math.max(0, Math.min(WORLD, scene.player.x + Math.cos(angle) * dist))
      const cy = Math.max(0, Math.min(WORLD, scene.player.y + Math.sin(angle) * dist))
      const orb = scene.xpOrbs.create(cx, cy, 'orb')
      orb.setDepth(2).setVelocity(0, 0)
      orb.setData('xpValue', orbCount)
      scene.tintConsolidatedOrb(orb, orbCount)
    }
  } else {
    for (let i = 0; i < orbCount; i++) {
      if (scene.xpOrbs.countActive() < MAX_ORBS) {
        const ox = e.x + (Math.random() - 0.5) * 16
        const oy = e.y + (Math.random() - 0.5) * 16
        const orb = scene.xpOrbs.create(ox, oy, 'orb')
        orb.setDepth(2).setVelocity(0, 0)
        orb.setData('xpValue', 1)
      }
    }
  }
  e.destroy()
  scene.score++
  scene.scoreText.setText(`Score: ${scene.score}`)
}

export function tintConsolidatedOrb(scene: IGameScene, orb: any, value: number) {
  const t = Math.min(1, (value - 1) / 40)
  const g = Math.round(0x50 * (1 - t))
  orb.setTint((0xff << 16) | (g << 8))
  orb.setScale(1 + Math.min(3.5, Math.sqrt(Math.max(0, value - 1)) * 0.25))
}

// ── Laser Beam ────────────────────────────────────────────────────────────

export function fireLaser(scene: IGameScene, angle: number) {
  const range = scene.laserRange * (1 + scene.bonusArea)
  const width = scene.laserWidth * (1 + scene.bonusArea * 0.5)
  const sx = scene.player.x, sy = scene.player.y
  const ex = sx + Math.cos(angle) * range
  const ey = sy + Math.sin(angle) * range

  const line = scene.acquireGfx(6)
  line.lineStyle(width, 0xfde047, 0.55).lineBetween(sx, sy, ex, ey)
  line.lineStyle(Math.max(2, width * 0.4), 0xffffff, 0.95).lineBetween(sx, sy, ex, ey)
  scene.tweens.add({ targets: line, alpha: 0, duration: 150, onComplete: () => scene.releaseGfx(line) })

  const dx = ex - sx, dy = ey - sy
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return
  const tol2 = (width * 0.7 + 14) * (width * 0.7 + 14)
  const hits: { e: any; t: number }[] = []
  for (const e of scene.enemies.getChildren() as any[]) {
    if (!e.active) continue
    const t = Math.max(0, Math.min(1, ((e.x - sx) * dx + (e.y - sy) * dy) / len2))
    const px = sx + dx * t, py = sy + dy * t
    const d2 = (e.x - px) ** 2 + (e.y - py) ** 2
    if (d2 < tol2) hits.push({ e, t })
  }
  hits.sort((a, b) => a.t - b.t)
  const max = scene.laserPierce
  for (let i = 0; i < Math.min(hits.length, max); i++) {
    scene.damageEnemy(hits[i].e, scene.laserDmg, true)
  }
}

// ── Turret ────────────────────────────────────────────────────────────────

export function fireTurret(scene: IGameScene) {
  while (scene.turrets.length >= scene.turretMax) {
    const old = scene.turrets.shift()
    if (old?.sprite?.active) old.sprite.destroy()
  }
  const s = scene.add.sprite(scene.player.x, scene.player.y, 'turret').setDepth(4)
  scene.turrets.push({
    sprite: s,
    expiry: scene.gameTime + scene.turretDuration,
    fireCd: 0,
  })
  const ring = scene.acquireGfx(3)
  ring.lineStyle(2, 0xfbbf24, 0.8).strokeCircle(s.x, s.y, 22)
  scene.tweens.add({ targets: ring, alpha: 0, duration: 350, onComplete: () => scene.releaseGfx(ring) })
}

// ── Orbital Strike ────────────────────────────────────────────────────────

export function fireOrbital(scene: IGameScene) {
  const enemies = scene.enemies.getChildren().filter((e: any) => e.active) as any[]
  if (enemies.length === 0) return
  const count = scene.orbitalCount
  const picks: any[] = []
  for (let i = 0; i < count; i++) {
    picks.push(enemies[Math.floor(Math.random() * enemies.length)])
  }
  const radius = scene.orbitalRadius * (1 + scene.bonusArea)
  for (const t of picks) {
    const reticle = scene.acquireGfx(7)
    const drawReticle = (x: number, y: number, t01: number) => {
      reticle.clear()
      const alpha = 0.3 + t01 * 0.7
      reticle.lineStyle(2, 0xef4444, alpha).strokeCircle(x, y, radius)
      reticle.lineStyle(1.5, 0xfca5a5, alpha).strokeCircle(x, y, radius * 0.6)
      reticle.lineStyle(1, 0xef4444, alpha)
      reticle.lineBetween(x - radius - 6, y, x - radius + 6, y)
      reticle.lineBetween(x + radius - 6, y, x + radius + 6, y)
      reticle.lineBetween(x, y - radius - 6, x, y - radius + 6)
      reticle.lineBetween(x, y + radius - 6, x, y + radius + 6)
    }
    drawReticle(t.x, t.y, 0)
    scene.orbitalStrikes.push({
      target: t,
      reticle,
      drawReticle,
      x: t.x, y: t.y,
      timer: 1000,
      totalTimer: 1000,
      radius,
    })
  }
}

// ── Black Hole ────────────────────────────────────────────────────────────

export function fireBlackhole(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const flightDist = 280
  const s = scene.add.sprite(scene.player.x, scene.player.y, 'blackhole').setDepth(4)
  scene.blackholes.push({
    sprite: s,
    vx: Math.cos(angle) * spd,
    vy: Math.sin(angle) * spd,
    phase: 'flying',
    flightLeft: (flightDist / spd) * 1000,
    duration: scene.blackholeDuration,
    radius: scene.blackholeRadius * (1 + scene.bonusArea),
    pull: scene.blackholePull,
    dmg: scene.blackholeDmg,
    tickTimer: 0,
    pulse: 0,
  })
}

// ── Grenade Launcher ──────────────────────────────────────────────────────

export function fireGrenade(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const b = scene.bullets.create(scene.player.x, scene.player.y, 'grenade') as any
  b.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd)
  b.setRotation(angle)
  b.setData('dmg', scene.grenadeDmg)
  b.setData('wt', 'grenade')
  b.setData('timer', 1500)
  b.setData('bouncesLeft', scene.grenadeBounces)
  b.setBounce(1, 1)
  b.setDepth(4)
  const bulletScale = 1 + scene.bonusArea * 0.5
  if (bulletScale !== 1) { b.setScale(bulletScale); b.refreshBody() }
  const extra = scene.bonusProjectiles
  for (let i = 0; i < extra; i++) {
    const a = angle + (i + 1) * 0.18 * (i % 2 === 0 ? 1 : -1)
    const b2 = scene.bullets.create(scene.player.x, scene.player.y, 'grenade') as any
    b2.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
    b2.setRotation(a)
    b2.setData('dmg', scene.grenadeDmg)
    b2.setData('wt', 'grenade')
    b2.setData('timer', 1500)
    b2.setData('bouncesLeft', scene.grenadeBounces)
    b2.setBounce(1, 1)
    b2.setDepth(4)
    if (bulletScale !== 1) { b2.setScale(bulletScale); b2.refreshBody() }
  }
}

export function explodeGrenade(scene: IGameScene, b: any) {
  if (!b.active) return
  const radius = scene.grenadeRadius * (1 + scene.bonusArea)
  const dmg = b.getData('dmg') ?? scene.grenadeDmg
  const exp = scene.acquireGfx(15)
  exp.fillStyle(0xfbbf24, 0.55).fillCircle(b.x, b.y, radius)
  exp.lineStyle(2, 0xfde68a, 0.9).strokeCircle(b.x, b.y, radius)
  scene.tweens.add({ targets: exp, alpha: 0, duration: 280, onComplete: () => scene.releaseGfx(exp) })
  for (const e of scene.enemies.getChildren() as any[]) {
    if (!e.active) continue
    if ((b.x - e.x) ** 2 + (b.y - e.y) ** 2 < radius * radius) {
      scene.damageEnemy(e, dmg)
    }
  }
  b.destroy()
}

// ── Cryo Shards ───────────────────────────────────────────────────────────

export function fireCryo(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const shards = scene.cryoShardCount + scene.bonusProjectiles
  const cone = Math.PI / 6
  const step = shards > 1 ? cone / (shards - 1) : 0
  const bulletScale = 1 + scene.bonusArea * 0.5
  for (let i = 0; i < shards; i++) {
    const a = angle + (shards > 1 ? -cone / 2 + step * i : 0)
    const b = scene.bullets.create(scene.player.x, scene.player.y, 'cryoshard') as any
    b.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
    b.setRotation(a)
    b.setData('sx', scene.player.x).setData('sy', scene.player.y)
    b.setData('maxRange', 380)
    b.setData('dmg', scene.cryoDmg)
    b.setData('wt', 'cryo')
    b.setDepth(4)
    if (bulletScale !== 1) { b.setScale(bulletScale); b.refreshBody() }
  }
}

// ── Railgun ───────────────────────────────────────────────────────────────

export function fireRailgun(scene: IGameScene, angle: number) {
  const chargeTime = scene.railgunChargeTime
  const gfx = scene.add.graphics().setDepth(5)
  scene.railgunCharges.push({
    angle,
    followPlayer: true,
    timer: chargeTime,
    totalTimer: chargeTime,
    gfx,
  })
}

// ── Swarm Drones ──────────────────────────────────────────────────────────

export function fireDrones(scene: IGameScene) {
  const target = scene.droneCount + scene.bonusProjectiles
  let active = 0
  for (const d of scene.drones) if (d.sprite?.active) active++
  for (let i = active; i < target; i++) {
    const ang = Math.random() * Math.PI * 2
    const s = scene.add.sprite(
      scene.player.x + Math.cos(ang) * 80,
      scene.player.y + Math.sin(ang) * 80,
      'drone',
    ).setDepth(4)
    scene.drones.push({
      sprite: s,
      gfx: scene.add.graphics().setDepth(5),
      target: null,
      atkCd: 0,
      orbitAngle: ang,
      speed: 460,
      diving: false,
      diveTargetX: 0,
      diveTargetY: 0,
      striking: false,
      strikeTimer: 0,
      strikeRot: 0,
      strikeOffsetX: 0,
      strikeOffsetY: 0,
    })
  }
}

// ── Specials update loop ──────────────────────────────────────────────────

export function updateSpecials(scene: IGameScene, delta: number) {
  updateTurrets(scene, delta)
  updateBlackholes(scene, delta)
  updateOrbitalStrikes(scene, delta)
  updateRailgunCharges(scene, delta)
  updateDrones(scene, delta)
  updateGrenadeTimers(scene, delta)
}

function updateGrenadeTimers(scene: IGameScene, delta: number) {
  const bullets = scene.bullets.getChildren() as any[]
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]
    if (!b.active) continue
    if (b.getData('wt') !== 'grenade') continue
    const t = (b.getData('timer') ?? 1500) - delta
    if (t <= 0) { explodeGrenade(scene, b); continue }
    b.setData('timer', t)
  }
}

function updateTurrets(scene: IGameScene, delta: number) {
  for (let i = scene.turrets.length - 1; i >= 0; i--) {
    const tr = scene.turrets[i]
    if (!tr.sprite?.active) { scene.turrets.splice(i, 1); continue }
    if (scene.gameTime >= tr.expiry) {
      tr.sprite.destroy()
      scene.turrets.splice(i, 1)
      continue
    }
    tr.fireCd -= delta
    if (tr.fireCd <= 0) {
      const enemies = scene.enemies.getChildren() as any[]
      let nearest: any = null
      let bestD2 = Infinity
      for (const e of enemies) {
        if (!e.active) continue
        const d2 = (e.x - tr.sprite.x) ** 2 + (e.y - tr.sprite.y) ** 2
        if (d2 < bestD2 && d2 < 520 * 520) { bestD2 = d2; nearest = e }
      }
      if (nearest) {
        const a = Math.atan2(nearest.y - tr.sprite.y, nearest.x - tr.sprite.x)
        tr.sprite.setRotation(a)
        const spd = WEAPON_BASE['turret'].bulletSpd * (1 + (scene.bonusWeaponBulletSpd['turret'] ?? 0))
        const bul = scene.bullets.create(tr.sprite.x, tr.sprite.y, 'turretbullet') as any
        bul.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
        bul.setRotation(a)
        bul.setData('dmg', scene.turretDmg)
        bul.setData('wt', 'turretbullet')
        bul.setDepth(4)
        tr.fireCd = scene.turretFireRate
      } else {
        tr.fireCd = 100
      }
    }
  }
}

function updateBlackholes(scene: IGameScene, delta: number) {
  for (let i = scene.blackholes.length - 1; i >= 0; i--) {
    const bh = scene.blackholes[i]
    if (!bh.sprite?.active) { scene.blackholes.splice(i, 1); continue }
    bh.pulse += delta
    bh.sprite.setRotation(bh.pulse * 0.005)
    if (bh.phase === 'flying') {
      bh.sprite.x += bh.vx * delta / 1000
      bh.sprite.y += bh.vy * delta / 1000
      bh.flightLeft -= delta
      if (bh.flightLeft <= 0) {
        bh.phase = 'landed'
        const ring = scene.acquireGfx(3)
        ring.lineStyle(3, 0xa78bfa, 0.9).strokeCircle(bh.sprite.x, bh.sprite.y, bh.radius)
        scene.tweens.add({ targets: ring, alpha: 0, duration: 400, onComplete: () => scene.releaseGfx(ring) })
      }
    } else {
      bh.duration -= delta
      bh.tickTimer += delta
      const r = bh.radius
      const r2 = r * r
      const doTick = bh.tickTimer >= 250
      if (doTick) bh.tickTimer = 0
      for (const e of scene.enemies.getChildren() as any[]) {
        if (!e.active) continue
        const dx = bh.sprite.x - e.x, dy = bh.sprite.y - e.y
        const d2 = dx * dx + dy * dy
        if (d2 > r2) continue
        const d = Math.sqrt(d2) || 1
        const pullSpd = bh.pull * (1 - Math.min(1, d / r) * 0.3)
        e.setVelocity((dx / d) * pullSpd, (dy / d) * pullSpd)
        if (doTick) scene.damageEnemy(e, bh.dmg, false)
      }
      if (bh.duration <= 0) {
        const finalExp = scene.acquireGfx(5)
        finalExp.fillStyle(0xa78bfa, 0.6).fillCircle(bh.sprite.x, bh.sprite.y, r * 1.1)
        scene.tweens.add({ targets: finalExp, alpha: 0, duration: 300, onComplete: () => scene.releaseGfx(finalExp) })
        for (const e of scene.enemies.getChildren() as any[]) {
          if (!e.active) continue
          if ((bh.sprite.x - e.x) ** 2 + (bh.sprite.y - e.y) ** 2 < r2) {
            scene.damageEnemy(e, bh.dmg * 4)
          }
        }
        bh.sprite.destroy()
        scene.blackholes.splice(i, 1)
      }
    }
  }
}

function updateOrbitalStrikes(scene: IGameScene, delta: number) {
  for (let i = scene.orbitalStrikes.length - 1; i >= 0; i--) {
    const s = scene.orbitalStrikes[i]
    if (s.target?.active) { s.x = s.target.x; s.y = s.target.y }
    s.timer -= delta
    const t01 = 1 - s.timer / s.totalTimer
    s.drawReticle(s.x, s.y, t01)
    if (s.timer <= 0) {
      if (s.reticle?.active) scene.releaseGfx(s.reticle)
      const flash = scene.acquireGfx(6)
      flash.fillStyle(0xef4444, 0.5).fillCircle(s.x, s.y, s.radius)
      flash.lineStyle(3, 0xfde68a, 0.95).strokeCircle(s.x, s.y, s.radius)
      scene.tweens.add({ targets: flash, alpha: 0, duration: 320, onComplete: () => scene.releaseGfx(flash) })
      const r2 = s.radius * s.radius
      for (const e of scene.enemies.getChildren() as any[]) {
        if (!e.active) continue
        if ((s.x - e.x) ** 2 + (s.y - e.y) ** 2 < r2) scene.damageEnemy(e, scene.orbitalDmg)
      }
      scene.orbitalStrikes.splice(i, 1)
    }
  }
}

const RAILGUN_FIRE_DURATION = 900
const RAILGUN_TICK_INTERVAL = 150

function updateRailgunCharges(scene: IGameScene, delta: number) {
  for (let i = scene.railgunCharges.length - 1; i >= 0; i--) {
    const c = scene.railgunCharges[i]
    const sx = scene.player.x, sy = scene.player.y
    const range = 1600
    const ex = sx + Math.cos(c.angle) * range
    const ey = sy + Math.sin(c.angle) * range
    c.gfx.clear()

    if (c.firing) {
      c.firingTimer -= delta
      c.tickTimer -= delta
      const fade = 1 - c.firingTimer / RAILGUN_FIRE_DURATION
      const alpha = Math.max(0, 0.9 - fade * 0.3)
      const bw = scene.railgunWidth * 2.4 * (1 + scene.bonusArea * 0.5)
      const flicker = 0.92 + Math.random() * 0.16
      c.gfx.lineStyle(bw * flicker, 0x93c5fd, alpha).lineBetween(sx, sy, ex, ey)
      c.gfx.lineStyle(Math.max(2, bw * 0.35) * flicker, 0xffffff, Math.min(1, alpha + 0.15)).lineBetween(sx, sy, ex, ey)

      if (c.tickTimer <= 0) {
        c.tickTimer += RAILGUN_TICK_INTERVAL
        const dx = ex - sx, dy = ey - sy
        const len2 = dx * dx + dy * dy
        const tol = bw * 0.55 + 18
        const tol2 = tol * tol
        for (const e of scene.enemies.getChildren() as any[]) {
          if (!e.active) continue
          const t = Math.max(0, Math.min(1, ((e.x - sx) * dx + (e.y - sy) * dy) / len2))
          const px = sx + dx * t, py = sy + dy * t
          if ((e.x - px) ** 2 + (e.y - py) ** 2 < tol2) {
            scene.damageEnemy(e, scene.railgunDmg, true)
          }
        }
      }

      if (c.firingTimer <= 0) {
        c.gfx.destroy()
        scene.railgunCharges.splice(i, 1)
      }
      continue
    }

    c.timer -= delta
    const t01 = 1 - c.timer / c.totalTimer
    const alpha = 0.15 + t01 * 0.55
    const w = Math.max(1, scene.railgunWidth * 0.4 + t01 * scene.railgunWidth * 0.6)
    c.gfx.lineStyle(w, 0x60a5fa, alpha).lineBetween(sx, sy, ex, ey)
    c.gfx.lineStyle(Math.max(1, w * 0.35), 0xffffff, alpha).lineBetween(sx, sy, ex, ey)
    if (c.timer <= 0) {
      c.firing = true
      c.firingTimer = RAILGUN_FIRE_DURATION
      c.tickTimer = 0
    }
  }
}

function updateDrones(scene: IGameScene, delta: number) {
  const dtSec = delta / 1000
  const standoff = 55
  const idleRadius = 110
  const hitRange = 16
  const dashSpeedMul = 2.8
  const cam = scene.cameras.main
  const recallDist = Math.max(cam.width, cam.height) * 0.6
  const recallDist2 = recallDist * recallDist

  for (let i = scene.drones.length - 1; i >= 0; i--) {
    const d = scene.drones[i]
    if (!d.sprite?.active) { d.gfx?.destroy(); scene.drones.splice(i, 1); continue }
    d.atkCd = Math.max(0, d.atkCd - delta)
    d.gfx.clear()

    if (d.striking) {
      d.strikeTimer -= delta
      if (d.target?.active && d.strikeTimer > 0) {
        d.sprite.x = d.target.x + d.strikeOffsetX
        d.sprite.y = d.target.y + d.strikeOffsetY
        d.sprite.setRotation(d.strikeRot)
        const alpha = Math.max(0, d.strikeTimer / 200)
        d.gfx.lineStyle(3, 0xfde68a, alpha)
        d.gfx.lineBetween(d.sprite.x, d.sprite.y, d.target.x, d.target.y)
        d.gfx.lineStyle(1.5, 0xfbbf24, Math.min(1, alpha + 0.2))
        d.gfx.lineBetween(d.sprite.x, d.sprite.y, d.target.x, d.target.y)
        continue
      }
      d.striking = false
    }

    const pdx = d.sprite.x - scene.player.x, pdy = d.sprite.y - scene.player.y
    if (pdx * pdx + pdy * pdy > recallDist2) {
      d.sprite.x = scene.player.x + Math.cos(d.orbitAngle) * 60
      d.sprite.y = scene.player.y + Math.sin(d.orbitAngle) * 60
      d.target = null
      d.diving = false
    }

    if (!d.target?.active) {
      d.diving = false
      const claimed = new Set<any>()
      for (const other of scene.drones) {
        if (other !== d && other.target?.active) claimed.add(other.target)
      }
      const enemies = scene.enemies.getChildren() as any[]
      let best: any = null, bestD2 = Infinity
      for (const e of enemies) {
        if (!e.active || claimed.has(e)) continue
        const d2 = (e.x - d.sprite.x) ** 2 + (e.y - d.sprite.y) ** 2
        if (d2 < bestD2) { bestD2 = d2; best = e }
      }
      d.target = best
    }

    if (d.target?.active) {
      if (d.diving) {
        const ddx = d.diveTargetX - d.sprite.x, ddy = d.diveTargetY - d.sprite.y
        const ddist = Math.sqrt(ddx * ddx + ddy * ddy) || 1
        const move = Math.min(d.speed * dashSpeedMul * dtSec, ddist)
        d.sprite.x += (ddx / ddist) * move
        d.sprite.y += (ddy / ddist) * move
        d.sprite.setRotation(Math.atan2(ddy, ddx))
        const hdx = d.target.x - d.sprite.x, hdy = d.target.y - d.sprite.y
        if (hdx * hdx + hdy * hdy < hitRange * hitRange) {
          scene.damageEnemy(d.target, scene.droneDmg, true)
          d.atkCd = scene.weaponShootRates['drones']
          d.diving = false
          d.striking = true
          d.strikeTimer = 200
          d.strikeRot = d.sprite.rotation
          d.strikeOffsetX = d.sprite.x - d.target.x
          d.strikeOffsetY = d.sprite.y - d.target.y
          scene.tweens.add({ targets: d.sprite, scale: { from: 1.5, to: 1 }, duration: 180 })
        } else if (ddist < 6) {
          d.diving = false
        }
      } else {
        const goal = Math.atan2(scene.player.y - d.target.y, scene.player.x - d.target.x)
        let diff = goal - d.orbitAngle
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        d.orbitAngle += diff * Math.min(1, dtSec * 1.2)
        const tx = d.target.x + Math.cos(d.orbitAngle) * standoff
        const ty = d.target.y + Math.sin(d.orbitAngle) * standoff
        const dx = tx - d.sprite.x, dy = ty - d.sprite.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const move = Math.min(d.speed * dtSec, dist)
        d.sprite.x += (dx / dist) * move
        d.sprite.y += (dy / dist) * move
        const fdx = d.target.x - d.sprite.x, fdy = d.target.y - d.sprite.y
        d.sprite.setRotation(Math.atan2(fdy, fdx))
        if (d.atkCd <= 0 && dist < standoff * 0.8) {
          d.diving = true
          d.diveTargetX = d.target.x
          d.diveTargetY = d.target.y
        }
      }
    } else {
      d.orbitAngle += dtSec * 1.1
      const tx = scene.player.x + Math.cos(d.orbitAngle) * idleRadius
      const ty = scene.player.y + Math.sin(d.orbitAngle) * idleRadius
      const dx = tx - d.sprite.x, dy = ty - d.sprite.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const move = Math.min(d.speed * dtSec, dist)
      d.sprite.x += (dx / dist) * move
      d.sprite.y += (dy / dist) * move
      d.sprite.setRotation(Math.atan2(dy, dx))
    }
  }
}
