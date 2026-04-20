import { IGameScene } from './_sceneInterface'
import { WORLD, MAX_ORBS, CONSOLIDATE_NEARBY_RADIUS, CONSOLIDATE_THRESHOLD, CONSOLIDATE_EDGE_MIN, CONSOLIDATE_EDGE_MAX } from './_constants'
import { WeaponType, WEAPON_BASE } from './_types'

export function autoShoot(scene: IGameScene, time: number) {
  const targets = scene.enemies.getChildren() as any[]
  const nearest = targets.length > 0
    ? targets.reduce((a, b) => {
        const distA = Math.sqrt((scene.player.x - a.x) ** 2 + (scene.player.y - a.y) ** 2)
        const distB = Math.sqrt((scene.player.x - b.x) ** 2 + (scene.player.y - b.y) ** 2)
        return distA <= distB ? a : b
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
    } else {
      if (!nearest) continue
      if (wt === 'shotgun')    scene.fireShotgun(angle, wt)
      else if (wt === 'sniper')     scene.fireSniper(angle, wt)
      else if (wt === 'machinegun') scene.fireMachineGun(angle, wt)
      else if (wt === 'tesla')      scene.fireTesla(angle, wt)
      else if (wt === 'boomerang')  scene.fireBoomerang(angle, wt)
      else if (wt === 'rocket')     scene.fireRocket(angle, wt)
    }
    scene.weaponCooldowns[wt] = time + scene.effectiveShootRate(wt)
  }
}

export function fireShotgun(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const pellets = 6 + scene.extraBullets
  const cone = Math.PI / 5
  const step = pellets > 1 ? cone / (pellets - 1) : 0

  const fire = (a: number) => {
    const b = scene.bullets.create(scene.player.x, scene.player.y, 'bullet') as any
    b.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
    b.setRotation(a)
    b.setData('sx', scene.player.x).setData('sy', scene.player.y).setData('dmg', scene.shotgunDmg)
    b.setDepth(4)
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
}

export function fireMachineGun(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
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
  }
  const offset = 0.022
  for (let i = 0; i < scene.machineGunBurst; i++) {
    fire(angle + (scene.machineGunBurst > 1 ? (i - (scene.machineGunBurst - 1) / 2) * offset : 0))
  }
}

export function fireAura(scene: IGameScene) {
  const r = scene.auraRadius
  const dmg = scene.auraDmg
  for (const e of scene.enemies.getChildren() as any[]) {
    if (e.active && Math.sqrt((scene.player.x - e.x) ** 2 + (scene.player.y - e.y) ** 2) < r) {
      scene.damageEnemy(e, dmg, false)
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
      const line = scene.add.graphics().setDepth(15)
      line.lineStyle(2, 0xbfdbfe, 0.8)
      line.lineBetween(currentTarget.x, currentTarget.y, targetToZap.x, targetToZap.y)
      scene.tweens.add({ targets: line, alpha: 0, duration: 150, onComplete: () => line.destroy() })
      currentTarget = targetToZap
      if (!next) hitSet.delete(currentTarget) // allow arc back
      scene.time.delayedCall(50, chain)
    }
  }

  const startLine = scene.add.graphics().setDepth(15)
  startLine.lineStyle(2, 0xffffff, 0.9)
  startLine.lineBetween(scene.player.x, scene.player.y, currentTarget.x, currentTarget.y)
  scene.tweens.add({ targets: startLine, alpha: 0, duration: 150, onComplete: () => startLine.destroy() })
  chain()
}

export function fireBoomerang(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const count = scene.boomerangCount
  for (let i = 0; i < count; i++) {
    const a = angle + (i * Math.PI * 2) / count
    const b = scene.bullets.create(scene.player.x, scene.player.y, 'boomerang') as any
    b.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
    b.setData('dmg', scene.boomerangDmg)
    b.setData('dist', scene.boomerangDist)
    b.setData('sx', scene.player.x).setData('sy', scene.player.y)
    b.setData('returning', false)
    b.setData('wt', 'boomerang')
    if (scene.boomerangPierce) {
      b.setData('pierceLeft', 999)
      b.setData('hitEnemies', new Set())
    }
    b.setDepth(4)
  }
}

export function fireRocket(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const burst = scene.rocketBurst
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

export function fireTrail(scene: IGameScene) {
  const f = scene.add.sprite(scene.player.x, scene.player.y, 'fire').setDepth(3).setScale(scene.trailSize / 16)
  f.setData('dmg', scene.trailDmg)
  f.setData('isTrail', true)
  f.setData('expiry', scene.time.now + scene.trailDuration)
  
  const checkHit = () => {
    if (!f.active) return
    for (const e of scene.enemies.getChildren() as any[]) {
      if (!e.active) continue
      const dist = Math.sqrt((f.x - e.x) ** 2 + (f.y - e.y) ** 2)
      if (dist < (scene.trailSize * 0.8)) {
        scene.damageEnemy(e, scene.trailDmg, false)
        if (scene.trailBurn) e.setData('burnTicks', 5)
      }
    }
    if (scene.time.now < f.getData('expiry')) {
      scene.time.delayedCall(250, checkHit)
    } else {
      if (scene.trailExplode) {
        const exp = scene.add.graphics().setDepth(4)
        exp.fillStyle(0xf97316, 0.6).fillCircle(f.x, f.y, 40)
        scene.tweens.add({ targets: exp, alpha: 0, duration: 300, onComplete: () => exp.destroy() })
        for (const e of scene.enemies.getChildren() as any[]) {
          if (e.active && Math.sqrt((f.x - e.x) ** 2 + (f.y - e.y) ** 2) < 40) {
            scene.damageEnemy(e, scene.trailDmg * 2)
          }
        }
      }
      f.destroy()
    }
  }
  checkHit()
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
    if (wt === 'rocket') {
      const exp = scene.add.graphics().setDepth(15)
      exp.fillStyle(0xef4444, 0.4).fillCircle(b.x, b.y, scene.rocketRadius)
      scene.tweens.add({ targets: exp, alpha: 0, duration: 200, onComplete: () => exp.destroy() })
      for (const enemyObj of scene.enemies.getChildren() as any[]) {
        if (enemyObj.active && Math.sqrt((b.x - enemyObj.x) ** 2 + (b.y - enemyObj.y) ** 2) < scene.rocketRadius) {
          scene.damageEnemy(enemyObj, dmg)
        }
      }
      if (scene.rocketSplit) {
        for (let i = 0; i < 3; i++) {
          const m = scene.bullets.create(b.x, b.y, 'rocket') as any
          m.setScale(0.5).setData('dmg', Math.floor(dmg / 2)).setData('wt', 'rocket').setData('homing', true).setDepth(4)
          const ma = Math.random() * Math.PI * 2
          m.setVelocity(Math.cos(ma) * 400, Math.sin(ma) * 400)
        }
      }
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

  const nearbyCount = (scene.xpOrbs.getChildren() as any[]).filter(o => {
    if (!o.active) return false
    const dist = Math.sqrt((scene.player.x - o.x) ** 2 + (scene.player.y - o.y) ** 2)
    return dist < CONSOLIDATE_NEARBY_RADIUS
  }).length
  const crowded = nearbyCount >= CONSOLIDATE_THRESHOLD

  if (crowded && scene.xpOrbs.countActive() < MAX_ORBS) {
    const angle = Math.random() * Math.PI * 2
    const dist = CONSOLIDATE_EDGE_MIN + Math.random() * (CONSOLIDATE_EDGE_MAX - CONSOLIDATE_EDGE_MIN)
    const cx = Math.max(0, Math.min(WORLD, scene.player.x + Math.cos(angle) * dist))
    const cy = Math.max(0, Math.min(WORLD, scene.player.y + Math.sin(angle) * dist))
    const orb = scene.xpOrbs.create(cx, cy, 'orb')
    orb.setDepth(2).setVelocity(0, 0).setAlpha(0.65)
    orb.setData('xpValue', orbCount)
    scene.tintConsolidatedOrb(orb, orbCount)
  } else {
    for (let i = 0; i < orbCount; i++) {
      if (scene.xpOrbs.countActive() < MAX_ORBS) {
        const ox = e.x + (Math.random() - 0.5) * 16
        const oy = e.y + (Math.random() - 0.5) * 16
        const orb = scene.xpOrbs.create(ox, oy, 'orb')
        orb.setDepth(2).setVelocity(0, 0).setAlpha(0.55)
        orb.setData('xpValue', 1)
      }
    }
  }
  e.destroy()
  scene.score++
  scene.scoreText.setText(`Score: ${scene.score}`)
}

export function tintConsolidatedOrb(scene: IGameScene, orb: any, value: number) {
  const t = Math.min(1, (value - 1) / 15)
  const g = Math.round(0x50 * (1 - t))
  orb.setTint((0xff << 16) | (g << 8))
  orb.setScale(1 + Math.min(1.5, (value - 1) * 0.08))
}
