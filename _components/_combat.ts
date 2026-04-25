import { IGameScene } from './_sceneInterface'
import { MAX_ORBS, VISION_MARGIN, OFFSCREEN_MERGE_RADIUS } from './_constants'
import { WeaponType, WEAPON_BASE } from './_types'
import { dropMinibossReward } from './_powerups'

// Phaser's arcade physics steps body.position during the scene's UPDATE
// event, but only syncs body -> gameObject in POST_UPDATE — which runs
// AFTER user update(). So `player.x/y` here is the previous frame's
// rendered position, while body.center is the position the player will
// render at this frame. Use body.center for muzzle/beam start so shots
// don't trail behind a moving player. (Falls back to player.x/y in case
// the body is briefly missing.)
export function playerEmitX(scene: IGameScene): number {
  return scene.player.body?.center?.x ?? scene.player.x
}
export function playerEmitY(scene: IGameScene): number {
  return scene.player.body?.center?.y ?? scene.player.y
}

export function autoShoot(scene: IGameScene, time: number) {
  const targets = scene.enemies.getChildren() as any[]
  const px = playerEmitX(scene), py = playerEmitY(scene)
  const nearest = targets.length > 0
    ? targets.reduce((a, b) => {
        const dax = px - a.x, day = py - a.y
        const dbx = px - b.x, dby = py - b.y
        return dax*dax + day*day <= dbx*dbx + dby*dby ? a : b
      })
    : null
  
  const angle = nearest
    ? Math.atan2(nearest.y - py, nearest.x - px)
    : 0

  for (const wt of scene.weapons) {
    if (time < (scene.weaponCooldowns[wt] ?? 0)) continue
    if (wt === 'aura') {
      scene.fireAura()
    } else if (wt === 'scythes') {
      scene.fireScythes()
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
      else if (wt === 'cryo')       scene.fireCryo(angle, wt)
      else if (wt === 'railgun')    scene.fireRailgun(angle)
      else if (wt === 'cleave')     scene.fireCleave(angle)
    }
    scene.weaponCooldowns[wt] = time + scene.effectiveShootRate(wt)
  }
}

export function fireShotgun(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const evolved = !!scene.weaponEvolutions['shotgun']
  const pellets = 6 + scene.extraBullets + scene.bonusProjectiles
  const cone = evolved ? Math.PI / 5 + Math.PI / 6 : Math.PI / 5
  const step = pellets > 1 ? cone / (pellets - 1) : 0
  const rangeBonus = evolved ? 1.4 : 1

  const bulletScale = 1 + scene.bonusArea * 0.5
  const ex = playerEmitX(scene), ey = playerEmitY(scene)
  const fire = (a: number) => {
    const b = scene.bullets.create(ex, ey, evolved ? 'bullet_shock' : 'bullet') as any
    b.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
    b.setRotation(a)
    b.setData('sx', ex).setData('sy', ey).setData('dmg', scene.shotgunDmg)
    b.setData('maxRange', scene.shotgunRange * rangeBonus)
    if (evolved) b.setData('wt', 'shotgun')
    b.setDepth(4)
    if (bulletScale !== 1) { b.setScale(bulletScale); b.refreshBody() }
  }
  for (let i = 0; i < pellets; i++) fire(angle + (pellets > 1 ? -cone / 2 + step * i : 0))
}

export function fireSniper(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const evolved = !!scene.weaponEvolutions['sniper']
  const b = scene.bullets.create(playerEmitX(scene), playerEmitY(scene), evolved ? 'sniperBullet_evolved' : 'sniperBullet') as any
  b.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd)
  b.setRotation(angle)
  b.setData('dmg', scene.sniperDmg)
  b.setData('hitEnemies', new Set())
  if (evolved) {
    b.setData('wt', 'sniper_ricochet')
    b.setData('ricochetLeft', 6)
  } else {
    b.setData('pierceLeft', scene.pierceCount)
  }
  b.setDepth(4)
  const bulletScale = 1 + scene.bonusArea * 0.5
  if (bulletScale !== 1) { b.setScale(bulletScale); b.refreshBody() }
}

export function fireMachineGun(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const evolved = !!scene.weaponEvolutions['machinegun']
  const bulletScale = 1 + scene.bonusArea * 0.5
  const ex = playerEmitX(scene), ey = playerEmitY(scene)
  const fire = (a: number, ox: number, oy: number) => {
    const b = scene.bullets.create(ex + ox, ey + oy, evolved ? 'mgBullet_evolved' : 'mgBullet') as any
    b.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
    b.setRotation(a)
    const isCrit = scene.machineGunCritChance > 0 && Math.random() < scene.machineGunCritChance
    b.setData('dmg', isCrit ? scene.machineGunDmg * 3 : scene.machineGunDmg)
    const finalScale = isCrit ? bulletScale * 1.5 : bulletScale
    if (finalScale !== 1) { b.setScale(finalScale); b.refreshBody() }
    if (isCrit) b.setTint(0xfde047)
    b.setDepth(4)
  }
  const offset = 0.022
  const count = scene.machineGunBullets + scene.bonusProjectiles
  for (let i = 0; i < count; i++) {
    const a = angle + (count > 1 ? (i - (count - 1) / 2) * offset : 0)
    fire(a, 0, 0)
    if (evolved) {
      const side = scene.mgGhostSide
      const px = -Math.sin(a) * 10 * side
      const py = Math.cos(a) * 10 * side
      fire(a, px, py)
      scene.mgGhostSide = -side as 1 | -1
    }
  }
}

function spawnShockIcon(scene: IGameScene, x: number, y: number) {
  const shock = scene.add.sprite(x, y, 'shock').setDepth(15).setScale(0.5 + Math.random() * 0.5)
  shock.setRotation(Math.random() * Math.PI * 2)
  scene.tweens.add({ targets: shock, alpha: 0, duration: 200, onComplete: () => shock.destroy() })
}

function spawnDroneHitIcon(scene: IGameScene, x: number, y: number) {
  const icon = scene.add.sprite(x + (Math.random() - 0.5) * 8, y - 6 + (Math.random() - 0.5) * 4, 'drone_hit').setDepth(15)
  scene.tweens.add({ targets: icon, alpha: 0, y: icon.y - 6, duration: 220, onComplete: () => icon.destroy() })
}

export function fireAura(scene: IGameScene) {
  const evolved = !!scene.weaponEvolutions['aura']
  const r = scene.auraRadius * (1 + scene.bonusArea)
  const dmg = scene.auraDmg
  const px = playerEmitX(scene), py = playerEmitY(scene)
  const enemies = scene.enemies.getChildren() as any[]
  const inAura: any[] = []
  for (const e of enemies) {
    if (!e.active) continue
    const dx = px - e.x, dy = py - e.y
    const enemyRadius = (e.displayWidth ?? 0) * 0.5
    const reach = r + enemyRadius
    if (dx * dx + dy * dy < reach * reach) {
      scene.damageEnemy(e, dmg, false)
      spawnShockIcon(scene, e.x, e.y)
      inAura.push(e)
    }
  }
  if (!evolved || inAura.length === 0) return
  const boltCount = Math.min(3, inAura.length)
  const picked = new Set<any>()
  const boltDmg = Math.max(1, Math.floor(dmg * 1.5))
  const BOLT_R = 40
  const BOLT_R2 = BOLT_R * BOLT_R
  for (let i = 0; i < boltCount; i++) {
    let target: any = null
    for (let attempt = 0; attempt < 8 && !target; attempt++) {
      const cand = inAura[Math.floor(Math.random() * inAura.length)]
      if (!picked.has(cand)) target = cand
    }
    if (!target) target = inAura[i]
    picked.add(target)
    spawnAuraBolt(scene, target.x, target.y, boltDmg, BOLT_R, BOLT_R2)
  }
}

function spawnAuraBolt(scene: IGameScene, tx: number, ty: number, dmg: number, radius: number, r2: number) {
  const bolt = scene.acquireGfx(7)
  bolt.lineStyle(5, 0xbfdbfe, 0.85).lineBetween(tx, ty - 200, tx, ty)
  bolt.lineStyle(2, 0xffffff, 1).lineBetween(tx, ty - 200, tx, ty)
  bolt.fillStyle(0xfde047, 0.55).fillCircle(tx, ty, radius * 0.7)
  bolt.lineStyle(2, 0xffffff, 0.95).strokeCircle(tx, ty, radius)
  scene.tweens.add({ targets: bolt, alpha: 0, duration: 220, onComplete: () => scene.releaseGfx(bolt) })
  for (const e of scene.enemies.getChildren() as any[]) {
    if (!e.active) continue
    const dx = e.x - tx, dy = e.y - ty
    if (dx * dx + dy * dy <= r2) scene.damageEnemy(e, dmg, false)
  }
}

export function fireTesla(scene: IGameScene, angle: number, wt: WeaponType) {
  const targets = scene.enemies.getChildren() as any[]
  if (targets.length === 0) return

  const px = playerEmitX(scene), py = playerEmitY(scene)
  const teslaRange = 200 * (1 + scene.bonusArea)
  const nearby = targets.filter(e => e.active &&
    Math.sqrt((px - e.x) ** 2 + (py - e.y) ** 2) <= teslaRange)
  if (nearby.length === 0) return
  let currentTarget = nearby.reduce((a, b) => {
    const distA = Math.sqrt((px - a.x) ** 2 + (py - a.y) ** 2)
    const distB = Math.sqrt((px - b.x) ** 2 + (py - b.y) ** 2)
    return distA <= distB ? a : b
  })

  if (scene.weaponEvolutions['tesla']) {
    const gfx = scene.add.graphics().setDepth(6)
    scene.damageEnemy(currentTarget, scene.teslaDmg, true)
    spawnShockIcon(scene, currentTarget.x, currentTarget.y)
    if (scene.teslaStun) currentTarget.setData('stunned', 500)
    scene.teslaStorms.push({
      gfx,
      current: currentTarget,
      lastX: currentTarget.x,
      lastY: currentTarget.y,
      duration: 1500,
      age: 0,
      jumpTimer: 90,
      damage: scene.teslaDmg,
      segments: [] as { x1: number; y1: number; x2: number; y2: number; age: number }[],
    })
    return
  }

  const hitSet = new Set()
  let jumps = scene.teslaJumps + scene.bonusProjectiles
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
  startLine.lineBetween(px, py, currentTarget.x, currentTarget.y)
  scene.tweens.add({ targets: startLine, alpha: 0, duration: 150, onComplete: () => scene.releaseGfx(startLine) })
  chain()
}

export function fireBoomerang(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const evolved = !!scene.weaponEvolutions['boomerang']
  const bulletScale = 1 + scene.bonusArea * 0.5
  const effectiveDist = scene.boomerangDist * (1 + scene.bonusArea)
  const ex = playerEmitX(scene), ey = playerEmitY(scene)

  if (evolved) {
    const count = 1 + scene.bonusProjectiles
    const dir = Math.random() < 0.5 ? 1 : -1
    for (let i = 0; i < count; i++) {
      const a = angle + (count > 1 ? (i / count) * Math.PI * 2 : 0)
      const b = scene.bullets.create(ex, ey, 'boomerang') as any
      b.setData('dmg', scene.boomerangDmg)
      b.setData('sx', ex).setData('sy', ey)
      b.setData('wt', 'boomerang')
      b.setData('spiral', true)
      b.setData('spiralStart', scene.gameTime)
      b.setData('spiralHalfDur', 600)
      b.setData('spiralR', effectiveDist)
      b.setData('spiralAngle', a)
      b.setData('spiralDir', dir)
      b.setData('phaseFlipped', false)
      b.setData('pierceLeft', 999)
      b.setData('hitEnemies', new Set())
      b.setVelocity(0, 0)
      b.setDepth(4)
      const sc = bulletScale * 1.2
      b.setScale(sc); b.refreshBody()
    }
    return
  }

  const count = scene.boomerangCount + scene.bonusProjectiles
  for (let i = 0; i < count; i++) {
    const a = angle + (i * Math.PI * 2) / count
    const b = scene.bullets.create(ex, ey, 'boomerang') as any
    b.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
    b.setData('dmg', scene.boomerangDmg)
    b.setData('dist', effectiveDist)
    b.setData('sx', ex).setData('sy', ey)
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
  const evolved = !!scene.weaponEvolutions['rocket']
  const tex = evolved ? 'rocket_evolved' : 'rocket'
  const b = scene.bullets.create(playerEmitX(scene), playerEmitY(scene), tex) as any
  b.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd)
  b.setRotation(angle)
  b.setData('dmg', scene.rocketDmg)
  b.setData('wt', 'rocket')
  b.setData('homing', true)
  b.setData('splitDepth', 0)
  if (evolved) b.setData('evolved', true)
  b.setDepth(4)
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
    const wtPierce = b.getData('wt')
    if (wtPierce === 'cryo') {
      e.setData('slowed', scene.cryoSlowDuration)
      if (b.getData('cascadeChild')) e.setData('_cryoCascadeChild', true)
    }
    const dmg = b.getData('dmg') ?? (wtPierce === 'boomerang' ? scene.boomerangDmg : scene.sniperDmg)
    scene.damageEnemy(e, dmg)
    const remaining = pierceLeft - 1
    if (remaining <= 0) b.destroy()
    else b.setData('pierceLeft', remaining)
  } else {
    const wt = b.getData('wt')
    const dmg = b.getData('dmg') ?? (wt === 'rocket' ? scene.rocketDmg : scene.shotgunDmg)
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
      const evolvedRocket = !!b.getData('evolved')
      const splitDepth = b.getData('splitDepth') ?? 0
      const canSplit = (evolvedRocket || scene.rocketSplit) && splitDepth < 1
      if (canSplit) {
        const childCount = evolvedRocket ? 2 : 3
        const childDmgRatio = evolvedRocket ? 1.0 : 0.5
        const childSpd = evolvedRocket ? 550 : 400
        const childTex = evolvedRocket ? 'rocket_evolved' : 'rocket'
        const childScale = evolvedRocket ? 0.7 : 0.5
        for (let i = 0; i < childCount; i++) {
          const m = scene.bullets.create(b.x, b.y, childTex) as any
          m.setScale(childScale)
            .setData('dmg', Math.max(1, Math.floor(dmg * childDmgRatio)))
            .setData('wt', 'rocket')
            .setData('homing', true)
            .setData('splitDepth', splitDepth + 1)
            .setDepth(4)
          if (evolvedRocket) m.setData('evolved', true)
          const ma = Math.random() * Math.PI * 2
          m.setVelocity(Math.cos(ma) * childSpd, Math.sin(ma) * childSpd)
        }
      }
    }
    if (wt === 'sniper_ricochet') {
      const hitSet: Set<any> = b.getData('hitEnemies')
      if (hitSet.has(e)) return
      hitSet.add(e)
      scene.damageEnemy(e, dmg)
      const ricochetLeft = (b.getData('ricochetLeft') ?? 0) - 1
      if (ricochetLeft <= 0) { b.destroy(); return }
      const RICOCHET_RANGE = 240
      const r2 = RICOCHET_RANGE * RICOCHET_RANGE
      let nearest: any = null
      let bestD2 = r2
      for (const other of scene.enemies.getChildren() as any[]) {
        if (!other.active || hitSet.has(other)) continue
        const dx = other.x - e.x, dy = other.y - e.y
        const d2 = dx * dx + dy * dy
        if (d2 < bestD2) { bestD2 = d2; nearest = other }
      }
      if (!nearest) { b.destroy(); return }
      const a = Math.atan2(nearest.y - b.y, nearest.x - b.x)
      const spd = Math.hypot(b.body.velocity.x, b.body.velocity.y) || (scene.weaponBulletSpd['sniper'] ?? WEAPON_BASE['sniper'].bulletSpd)
      b.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
      b.setRotation(a)
      b.setData('ricochetLeft', ricochetLeft)
      const trail = scene.acquireGfx(15)
      trail.lineStyle(2, 0xfde68a, 0.85).lineBetween(e.x, e.y, nearest.x, nearest.y)
      scene.tweens.add({ targets: trail, alpha: 0, duration: 140, onComplete: () => scene.releaseGfx(trail) })
      return
    }
    if (wt === 'shotgun') {
      const CHAIN_RANGE = 160
      const chainR2 = CHAIN_RANGE * CHAIN_RANGE
      const ratios = [0.6, 0.4, 0.25]
      const chainHit = new Set<any>([e])
      let cur = e
      for (const ratio of ratios) {
        let nearest: any = null
        let bestD2 = chainR2
        for (const other of scene.enemies.getChildren() as any[]) {
          if (!other.active || chainHit.has(other)) continue
          const dx = other.x - cur.x, dy = other.y - cur.y
          const d2 = dx * dx + dy * dy
          if (d2 < bestD2) { bestD2 = d2; nearest = other }
        }
        if (!nearest) break
        const chainDmg = Math.max(1, Math.floor(dmg * ratio))
        scene.damageEnemy(nearest, chainDmg, true)
        chainHit.add(nearest)
        const line = scene.acquireGfx(15)
        line.lineStyle(4, 0xbfdbfe, 0.85).lineBetween(cur.x, cur.y, nearest.x, nearest.y)
        line.lineStyle(1.5, 0xffffff, 1).lineBetween(cur.x, cur.y, nearest.x, nearest.y)
        scene.tweens.add({ targets: line, alpha: 0, duration: 220, onComplete: () => scene.releaseGfx(line) })
        cur = nearest
      }
    }
    b.destroy()
    if (wt !== 'rocket') scene.damageEnemy(e, dmg)
  }
}

export function onPlayerHitEnemy(scene: IGameScene, _p: any, _e: any) {
  if (scene.iframes > 0 || scene.debugInvuln) return
  const e = _e as any
  if (e?.getData?.('isAmbusher') && e.getData('ambushState') === 'dormant') return
  const contactDmg = 10 + Math.floor((scene.gameTime / 1000) / 60) * 4
  scene.hp = Math.max(0, scene.hp - contactDmg)
  scene.iframes = 650
  if (e?.getData?.('knockback')) {
    const dx = scene.player.x - e.x, dy = scene.player.y - e.y
    const d = Math.hypot(dx, dy) || 1
    const push = 420
    scene.player.setVelocity((dx / d) * push, (dy / d) * push)
  }
  if (scene.hp <= 0) scene.showGameOver()
}

export function damageEnemy(scene: IGameScene, e: any, dmg: number, flash = true) {
  if (!e.active) return
  if (e.getData('isAmbusher') && e.getData('ambushState') === 'dormant') {
    e.setData('ambushState', 'active')
    e.clearTint()
    e.setAlpha(1)
  }
  const hp = e.getData('hp') - dmg
  if (hp <= 0) { scene.killEnemy(e); return }
  e.setData('hp', hp)
  if (e.getData('berserker') && !e.getData('berserked')) {
    const maxHp = e.getData('maxHp') ?? hp
    if (hp / maxHp <= 0.3) {
      e.setData('berserked', true)
      e.setData('speed', (e.getData('speed') ?? 75) * 2)
      e.setTint(0xff0000)
      return
    }
  }
  if (flash) {
    e.setTint(0xffffff)
    scene.time.delayedCall(90, () => {
      if (!e.active) return
      if (e.getData('berserked')) e.setTint(0xff0000)
      else e.clearTint()
    })
  }
}

export function killEnemy(scene: IGameScene, e: any) {
  if (!e.active || e.getData('_dying')) return
  e.setData('_dying', true)

  if (scene.weaponEvolutions['cryo'] && (e.getData('slowed') ?? 0) > 0 && !e.getData('_cryoCascadeChild')) {
    spawnSnowflakeBurst(scene, e.x, e.y)
  }

  const doExplosion = (expRadius: number, color: number, ringColor: number, dmgToEnemies: number) => {
    const expFlash = scene.add.graphics().setDepth(8)
    expFlash.fillStyle(color, 0.55).fillCircle(e.x, e.y, expRadius)
    expFlash.lineStyle(2, ringColor, 0.9).strokeCircle(e.x, e.y, expRadius)
    scene.tweens.add({ targets: expFlash, alpha: 0, duration: 450, onComplete: () => expFlash.destroy() })

    const distToPlayer = Math.sqrt((scene.player.x - e.x) ** 2 + (scene.player.y - e.y) ** 2)
    if (scene.iframes <= 0 && !scene.debugInvuln && distToPlayer <= expRadius) {
      const contactDmg = 10 + Math.floor((scene.gameTime / 1000) / 60) * 4
      scene.hp = Math.max(0, scene.hp - contactDmg)
      scene.iframes = 650
      if (scene.hp <= 0) scene.showGameOver()
    }

    const expR2 = expRadius * expRadius
    for (const other of scene.enemies.getChildren() as any[]) {
      if (!other.active || other === e) continue
      const dx = other.x - e.x, dy = other.y - e.y
      if (dx * dx + dy * dy <= expR2) damageEnemy(scene, other, dmgToEnemies, false)
    }
  }

  if (e.getData('explodes')) {
    doExplosion(80, 0xff4400, 0xff8800, 150)
  }
  if (e.getData('sapper')) {
    doExplosion(160, 0xfbbf24, 0xb45309, 120)
  }
  if (e.getData('splits')) {
    const count = 3
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.3
      const r = 18 + Math.random() * 10
      const sx = e.x + Math.cos(a) * r, sy = e.y + Math.sin(a) * r
      const child = scene.enemies.create(sx, sy, 'enemy_splitterling') as any
      child.setDepth(3).setData('hp', 20).setData('speed', 140).setData('orbBonus', 0).setData('maxHp', 20)
    }
  }
  if (e.getData('leavesPool')) {
    const radius = 65
    const duration = 4000
    const gfx = scene.add.graphics().setDepth(1)
    scene.plaguePools.push({ x: e.x, y: e.y, radius, age: 0, duration, tickAccum: 0, gfx })
  }

  const orbBonus = e.getData('orbBonus') ?? 0
  const orbCount = 1 + orbBonus

  const view = scene.cameras.main.worldView
  const onScreen =
    e.x >= view.x - VISION_MARGIN &&
    e.x <= view.x + view.width + VISION_MARGIN &&
    e.y >= view.y - VISION_MARGIN &&
    e.y <= view.y + view.height + VISION_MARGIN

  if (onScreen) {
    for (let i = 0; i < orbCount; i++) {
      if (scene.xpOrbs.countActive() < MAX_ORBS) {
        const ox = e.x + (Math.random() - 0.5) * 16
        const oy = e.y + (Math.random() - 0.5) * 16
        const orb = scene.xpOrbs.create(ox, oy, 'orb')
        orb.setDepth(2).setVelocity(0, 0)
        orb.setData('xpValue', 1)
      }
    }
  } else {
    const mergeR2 = OFFSCREEN_MERGE_RADIUS * OFFSCREEN_MERGE_RADIUS
    let existing: any = null
    let bestDist2 = Infinity
    for (const o of scene.xpOrbs.getChildren() as any[]) {
      if (!o.active) continue
      if ((o.getData('xpValue') ?? 1) <= 1) continue
      const dx = e.x - o.x, dy = e.y - o.y
      const d2 = dx * dx + dy * dy
      if (d2 < mergeR2 && d2 < bestDist2) { bestDist2 = d2; existing = o }
    }

    if (existing) {
      const newVal = (existing.getData('xpValue') ?? 1) + orbCount
      existing.setData('xpValue', newVal)
      scene.tintConsolidatedOrb(existing, newVal)
    } else if (scene.xpOrbs.countActive() < MAX_ORBS) {
      const orb = scene.xpOrbs.create(e.x, e.y, 'orb')
      orb.setDepth(2).setVelocity(0, 0)
      orb.setData('xpValue', orbCount)
      if (orbCount > 1) scene.tintConsolidatedOrb(orb, orbCount)
    }
  }
  const isMiniboss = e.getData('isMiniboss')
  const ex = e.x, ey = e.y
  e.destroy()
  if (isMiniboss) dropMinibossReward(scene, ex, ey)
  scene.score++
  const orbBonusVal = e.getData('orbBonus') ?? 0
  scene.runCoins += e.getData('boss') ? 20 : (isMiniboss ? 8 : (orbBonusVal > 0 ? 3 : 1))
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
  const evolved = !!scene.weaponEvolutions['laser']
  if (evolved) {
    scene.laserPatternAngle = (scene.laserPatternAngle + Math.PI / 9) % (Math.PI * 2)
    const base = scene.laserPatternAngle
    for (let i = 0; i < 4; i++) fireLaserBeam(scene, base + (i * Math.PI) / 2)
    const sx = playerEmitX(scene), sy = playerEmitY(scene)
    const glow = scene.acquireGfx(5)
    glow.lineStyle(2, 0xfde047, 0.45).strokeCircle(sx, sy, 18)
    glow.lineStyle(1, 0xffffff, 0.75).strokeCircle(sx, sy, 10)
    scene.tweens.add({ targets: glow, alpha: 0, duration: 220, onComplete: () => scene.releaseGfx(glow) })
  } else {
    fireLaserBeam(scene, angle)
  }
}

function fireLaserBeam(scene: IGameScene, angle: number) {
  const range = scene.laserRange * (1 + scene.bonusArea)
  const width = scene.laserWidth * (1 + scene.bonusArea * 0.5)
  const sx = playerEmitX(scene), sy = playerEmitY(scene)
  const ex = sx + Math.cos(angle) * range
  const ey = sy + Math.sin(angle) * range

  const line = scene.acquireGfx(6)
  line.lineStyle(width, 0xfde047, 0.55).lineBetween(sx, sy, ex, ey)
  line.lineStyle(Math.max(2, width * 0.5), 0xffffff, 0.95).lineBetween(sx, sy, ex, ey)
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
  const maxTurrets = scene.turretMax + scene.bonusProjectiles
  while (scene.turrets.length >= maxTurrets) {
    const old = scene.turrets.shift()
    if (old?.sprite?.active) old.sprite.destroy()
  }
  const s = scene.add.sprite(playerEmitX(scene), playerEmitY(scene), 'turret').setDepth(4)
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
  const evolved = !!scene.weaponEvolutions['orbital']
  const px = playerEmitX(scene), py = playerEmitY(scene)

  let total = 0
  const weights = enemies.map((e) => {
    const w = 1 / (Math.hypot(e.x - px, e.y - py) + 100)
    total += w
    return w
  })
  let r = Math.random() * total
  let idx = enemies.length - 1
  for (let j = 0; j < enemies.length; j++) {
    r -= weights[j]
    if (r <= 0) { idx = j; break }
  }
  const target = enemies[idx]

  const baseRadius = scene.orbitalRadius * (1 + scene.bonusArea)
  const telegraph = evolved ? 600 : 1000

  if (evolved && Math.random() < 0.2) {
    const patternRadius = baseRadius * 0.7
    const ringDist = baseRadius * 1.4
    const choice = Math.floor(Math.random() * 3)
    if (choice === 0) {
      // Triangle around the target
      for (let i = 0; i < 3; i++) {
        const ang = (i * 2 * Math.PI) / 3 + Math.random() * 0.4
        scheduleStrike(scene, null, target.x + Math.cos(ang) * ringDist, target.y + Math.sin(ang) * ringDist, patternRadius, telegraph)
      }
    } else if (choice === 1) {
      // Cross
      const offs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      for (const [ox, oy] of offs) {
        scheduleStrike(scene, null, target.x + ox * ringDist, target.y + oy * ringDist, patternRadius, telegraph)
      }
    } else {
      // Line through the target
      const ang = Math.random() * Math.PI * 2
      for (let i = -1; i <= 1; i++) {
        scheduleStrike(scene, i === 0 ? target : null, target.x + Math.cos(ang) * ringDist * i, target.y + Math.sin(ang) * ringDist * i, patternRadius, telegraph)
      }
    }
    return
  }

  scheduleStrike(scene, target, target.x, target.y, baseRadius, telegraph)
}

function scheduleStrike(scene: IGameScene, target: any, x: number, y: number, radius: number, telegraph: number) {
  const reticle = scene.acquireGfx(7)
  const drawReticle = (rx: number, ry: number, t01: number) => {
    reticle.clear()
    const alpha = 0.3 + t01 * 0.7
    reticle.lineStyle(2, 0xef4444, alpha).strokeCircle(rx, ry, radius)
    reticle.lineStyle(1.5, 0xfca5a5, alpha).strokeCircle(rx, ry, radius * 0.6)
    reticle.lineStyle(1, 0xef4444, alpha)
    reticle.lineBetween(rx - radius - 6, ry, rx - radius + 6, ry)
    reticle.lineBetween(rx + radius - 6, ry, rx + radius + 6, ry)
    reticle.lineBetween(rx, ry - radius - 6, rx, ry - radius + 6)
    reticle.lineBetween(rx, ry + radius - 6, rx, ry + radius + 6)
  }
  drawReticle(x, y, 0)
  scene.orbitalStrikes.push({
    target,
    reticle,
    drawReticle,
    x, y,
    timer: telegraph,
    totalTimer: telegraph,
    radius,
  })
}

// ── Black Hole ────────────────────────────────────────────────────────────

function spawnBlackhole(scene: IGameScene, x: number, y: number, vx: number, vy: number, evolved: boolean, params?: Partial<{ coreRadius: number; midRadius: number; outerRadius: number; corePull: number; midPull: number; outerPull: number; duration: number; dmg: number; phase: 'flying' | 'landed'; flightLeft: number }>) {
  const areaScale = 1 + scene.bonusArea
  const s = scene.add.sprite(x, y, evolved ? 'blackhole_evolved' : 'blackhole').setDepth(4)
  const bh: any = {
    sprite: s,
    vx, vy,
    phase: params?.phase ?? 'flying',
    flightLeft: params?.flightLeft ?? (280 / Math.max(1, Math.hypot(vx, vy))) * 1000,
    duration: params?.duration ?? scene.blackholeDuration,
    coreRadius:  params?.coreRadius  ?? scene.blackholeCoreRadius  * areaScale,
    midRadius:   params?.midRadius   ?? scene.blackholeMidRadius   * areaScale,
    outerRadius: params?.outerRadius ?? scene.blackholeOuterRadius * areaScale,
    corePull:    params?.corePull    ?? scene.blackholeCorePull,
    midPull:     params?.midPull     ?? scene.blackholeMidPull,
    outerPull:   params?.outerPull   ?? scene.blackholeOuterPull,
    dmg: params?.dmg ?? scene.blackholeDmg,
    tickTimer: 0,
    pulse: 0,
    evolved,
    halo: null as any,
    rings: null as any,
    arms: null as any,
    streaks: [] as any[],
    streakSpawnTimer: 0,
    binaryPair: null as any,
    binaryFilament: null as any,
  }
  scene.blackholes.push(bh)
  return bh
}

export function fireBlackhole(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const evolved = !!scene.weaponEvolutions['blackhole']
  const ex = playerEmitX(scene), ey = playerEmitY(scene)
  if (evolved) {
    const off = (15 * Math.PI) / 180
    const a1 = angle - off, a2 = angle + off
    const bh1 = spawnBlackhole(scene, ex, ey, Math.cos(a1) * spd, Math.sin(a1) * spd, true)
    const bh2 = spawnBlackhole(scene, ex, ey, Math.cos(a2) * spd, Math.sin(a2) * spd, true)
    bh1.binaryPair = bh2
    bh2.binaryPair = bh1
    return
  }
  spawnBlackhole(scene, ex, ey, Math.cos(angle) * spd, Math.sin(angle) * spd, false)
}

// ── Cryo Shards ───────────────────────────────────────────────────────────

export function fireCryo(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const shards = scene.cryoShardCount + scene.bonusProjectiles
  const cone = Math.PI / 6
  const step = shards > 1 ? cone / (shards - 1) : 0
  const bulletScale = 1 + scene.bonusArea * 0.5
  const ex = playerEmitX(scene), ey = playerEmitY(scene)
  for (let i = 0; i < shards; i++) {
    const a = angle + (shards > 1 ? -cone / 2 + step * i : 0)
    const b = scene.bullets.create(ex, ey, 'cryoshard') as any
    b.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
    b.setRotation(a)
    b.setData('sx', ex).setData('sy', ey)
    b.setData('maxRange', 380)
    b.setData('dmg', scene.cryoDmg)
    b.setData('wt', 'cryo')
    b.setData('pierceLeft', 999)
    b.setData('hitEnemies', new Set())
    b.setDepth(4)
    if (bulletScale !== 1) { b.setScale(bulletScale); b.refreshBody() }
  }
}

function spawnSnowflakeBurst(scene: IGameScene, cx: number, cy: number) {
  const radius = 90 * (1 + scene.bonusArea)
  const dmg = Math.max(1, Math.floor(scene.cryoDmg * 0.7))
  const baseAng = Math.random() * Math.PI * 2

  const g = scene.acquireGfx(8)
  g.setAlpha(1)
  const arms = 6
  for (let i = 0; i < arms; i++) {
    const a = baseAng + (i * Math.PI * 2) / arms
    const tx = cx + Math.cos(a) * radius
    const ty = cy + Math.sin(a) * radius
    g.lineStyle(3, 0x67e8f9, 0.95).lineBetween(cx, cy, tx, ty)
    g.lineStyle(1.5, 0xecfeff, 1).lineBetween(cx, cy, tx, ty)
    // Side barbs at ~60% along each arm
    const bx = cx + Math.cos(a) * radius * 0.6
    const by = cy + Math.sin(a) * radius * 0.6
    const barbLen = radius * 0.25
    const ap = a + Math.PI / 3
    const am = a - Math.PI / 3
    g.lineStyle(2, 0xa5f3fc, 0.85)
    g.lineBetween(bx, by, bx + Math.cos(ap) * barbLen, by + Math.sin(ap) * barbLen)
    g.lineBetween(bx, by, bx + Math.cos(am) * barbLen, by + Math.sin(am) * barbLen)
  }
  g.fillStyle(0xecfeff, 0.9).fillCircle(cx, cy, 6)
  g.lineStyle(2, 0x67e8f9, 0.9).strokeCircle(cx, cy, radius)
  scene.tweens.add({
    targets: g,
    alpha: 0,
    duration: 380,
    onComplete: () => scene.releaseGfx(g),
  })

  const r2 = radius * radius
  for (const enemyObj of scene.enemies.getChildren() as any[]) {
    if (!enemyObj.active || enemyObj === undefined) continue
    const dx = enemyObj.x - cx, dy = enemyObj.y - cy
    if (dx * dx + dy * dy > r2) continue
    enemyObj.setData('_cryoCascadeChild', true)
    if ((enemyObj.getData('slowed') ?? 0) <= 0) {
      enemyObj.setData('slowed', scene.cryoSlowDuration)
    }
    scene.damageEnemy(enemyObj, dmg, false)
  }
}

// ── Railgun ───────────────────────────────────────────────────────────────

export function fireRailgun(scene: IGameScene, angle: number) {
  const chargeTime = scene.railgunChargeTime
  const gfx = scene.add.graphics().setDepth(5)
  const sweep = !!scene.weaponEvolutions['railgun']
  scene.railgunCharges.push({
    angle,
    startAngle: angle,
    followPlayer: true,
    timer: chargeTime,
    totalTimer: chargeTime,
    gfx,
    sweep,
    sweepDir: sweep ? (Math.random() < 0.5 ? 1 : -1) : 1,
    focusing: false,
    focusTimer: 0,
  })
}

// ── Swarm Drones ──────────────────────────────────────────────────────────

export function fireDrones(scene: IGameScene) {
  const evolved = !!scene.weaponEvolutions['drones']
  const target = scene.droneCount + (evolved ? 2 : 0) + scene.bonusProjectiles
  let active = 0
  for (const d of scene.drones) if (d.sprite?.active) active++
  for (let i = active; i < target; i++) {
    const ang = Math.random() * Math.PI * 2
    const speed = 230
    const s = scene.add.sprite(
      playerEmitX(scene) + Math.cos(ang) * 80,
      playerEmitY(scene) + Math.sin(ang) * 80,
      'drone',
    ).setDepth(4)
    scene.drones.push({
      sprite: s,
      gfx: scene.add.graphics().setDepth(5),
      target: null,
      targetTimer: 0,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      speed,
      turnRate: 5.2,
      orbitAngle: ang,
      returning: false,
      recentHits: [] as { e: any; expiry: number }[],
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
  updateTeslaStorms(scene, delta)
  updateCleaveShockwaves(scene, delta)
  updateCleavePending(scene, delta)
}

function updateCleaveShockwaves(scene: IGameScene, delta: number) {
  const BAND = 18
  for (let i = scene.cleaveShockwaves.length - 1; i >= 0; i--) {
    const s = scene.cleaveShockwaves[i]
    if (!s.gfx?.active) { scene.cleaveShockwaves.splice(i, 1); continue }
    s.age += delta
    if (s.age >= s.duration) {
      s.gfx.destroy()
      scene.cleaveShockwaves.splice(i, 1)
      continue
    }
    const t = s.age / s.duration
    const r = s.startR + (s.endR - s.startR) * t
    const rIn = r - BAND, rOut = r + BAND
    const rIn2 = rIn * rIn, rOut2 = rOut * rOut

    for (const e of scene.enemies.getChildren() as any[]) {
      if (!e.active || s.hitSet.has(e)) continue
      const dx = e.x - s.x, dy = e.y - s.y
      const d2 = dx * dx + dy * dy
      if (d2 < rIn2 || d2 > rOut2) continue
      let diff = Math.atan2(dy, dx) - s.centerAngle
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      if (Math.abs(diff) > s.halfArc) continue
      scene.damageEnemy(e, s.damage, true)
      s.hitSet.add(e)
    }

    const alpha = 1 - t
    const steps = 22
    const startA = s.centerAngle - s.halfArc
    const endA = s.centerAngle + s.halfArc
    s.gfx.clear()
    s.gfx.lineStyle(4, 0xfca5a5, alpha * 0.55)
    s.gfx.beginPath()
    for (let k = 0; k <= steps; k++) {
      const a = startA + (endA - startA) * (k / steps)
      const x = s.x + Math.cos(a) * r
      const y = s.y + Math.sin(a) * r
      if (k === 0) s.gfx.moveTo(x, y)
      else s.gfx.lineTo(x, y)
    }
    s.gfx.strokePath()
    s.gfx.lineStyle(1.5, 0xffffff, Math.min(1, alpha + 0.05))
    s.gfx.beginPath()
    for (let k = 0; k <= steps; k++) {
      const a = startA + (endA - startA) * (k / steps)
      const x = s.x + Math.cos(a) * r
      const y = s.y + Math.sin(a) * r
      if (k === 0) s.gfx.moveTo(x, y)
      else s.gfx.lineTo(x, y)
    }
    s.gfx.strokePath()
  }
}

function updateTeslaStorms(scene: IGameScene, delta: number) {
  const STORM_JUMP_MS = 90
  const STORM_HOP_RANGE = 160
  const STORM_HOP_RANGE2 = STORM_HOP_RANGE * STORM_HOP_RANGE
  const STORM_FALLBACK_RANGE = 320
  const STORM_FALLBACK_RANGE2 = STORM_FALLBACK_RANGE * STORM_FALLBACK_RANGE
  const SEGMENT_FADE_MS = 220
  const STORM_SPLASH_R = 40
  const STORM_SPLASH_R2 = STORM_SPLASH_R * STORM_SPLASH_R

  for (let i = scene.teslaStorms.length - 1; i >= 0; i--) {
    const s = scene.teslaStorms[i]
    if (!s.gfx?.active) { scene.teslaStorms.splice(i, 1); continue }
    s.age += delta
    if (s.age >= s.duration) {
      s.gfx.destroy()
      scene.teslaStorms.splice(i, 1)
      continue
    }

    if (s.current?.active) {
      s.lastX = s.current.x
      s.lastY = s.current.y
    } else {
      s.current = null
    }

    s.jumpTimer -= delta
    if (s.jumpTimer <= 0) {
      s.jumpTimer += STORM_JUMP_MS
      const enemies = scene.enemies.getChildren() as any[]
      const ax = s.lastX, ay = s.lastY
      let next: any = null
      let bestD2 = STORM_HOP_RANGE2
      for (const e of enemies) {
        if (!e.active || e === s.current) continue
        const d2 = (e.x - ax) ** 2 + (e.y - ay) ** 2
        if (d2 < bestD2) { bestD2 = d2; next = e }
      }
      if (!next) {
        bestD2 = STORM_FALLBACK_RANGE2
        for (const e of enemies) {
          if (!e.active || e === s.current) continue
          const d2 = (e.x - ax) ** 2 + (e.y - ay) ** 2
          if (d2 < bestD2) { bestD2 = d2; next = e }
        }
      }
      if (next) {
        scene.damageEnemy(next, s.damage, true)
        spawnShockIcon(scene, next.x, next.y)
        if (scene.teslaStun) next.setData('stunned', 500)
        const splashDmg = Math.max(1, Math.floor(s.damage * 0.5))
        for (const e2 of enemies) {
          if (!e2.active || e2 === next) continue
          const dx = e2.x - next.x, dy = e2.y - next.y
          if (dx * dx + dy * dy <= STORM_SPLASH_R2) {
            scene.damageEnemy(e2, splashDmg, false)
          }
        }
        s.segments.push({ x1: ax, y1: ay, x2: next.x, y2: next.y, age: 0 })
        s.current = next
        s.lastX = next.x
        s.lastY = next.y
      }
    }

    s.gfx.clear()
    for (let j = s.segments.length - 1; j >= 0; j--) {
      const seg = s.segments[j]
      seg.age += delta
      if (seg.age >= SEGMENT_FADE_MS) { s.segments.splice(j, 1); continue }
      const t = seg.age / SEGMENT_FADE_MS
      const flicker = 0.8 + Math.random() * 0.3
      const alpha = 1 - t
      s.gfx.lineStyle(8 * flicker, 0xbfdbfe, alpha * 0.55).lineBetween(seg.x1, seg.y1, seg.x2, seg.y2)
      s.gfx.lineStyle(2.5 * flicker, 0xffffff, Math.min(1, alpha + 0.1)).lineBetween(seg.x1, seg.y1, seg.x2, seg.y2)
    }
  }
}

function updateTurrets(scene: IGameScene, delta: number) {
  const evolved = !!scene.weaponEvolutions['turret']
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

  if (!evolved || scene.turrets.length < 2) {
    if (scene.turretTetherGfx?.active) scene.turretTetherGfx.clear()
    return
  }
  if (!scene.turretTetherGfx) {
    scene.turretTetherGfx = scene.add.graphics().setDepth(4)
  }
  const g = scene.turretTetherGfx
  g.clear()
  scene.turretTetherTickTimer -= delta
  const doTick = scene.turretTetherTickTimer <= 0
  if (doTick) scene.turretTetherTickTimer += 200
  const tickDmg = Math.max(1, Math.floor(scene.turretDmg * 0.6))
  const enemies = scene.enemies.getChildren() as any[]
  const wob = Math.sin(scene.gameTime * 0.018)
  for (let i = 0; i < scene.turrets.length; i++) {
    for (let j = i + 1; j < scene.turrets.length; j++) {
      const a = scene.turrets[i].sprite, b = scene.turrets[j].sprite
      if (!a?.active || !b?.active) continue
      const x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
      const dx = x2 - x1, dy = y2 - y1
      const len = Math.hypot(dx, dy) || 1
      const px = -dy / len, py = dx / len
      const off = wob * 3
      g.lineStyle(4, 0xc4b5fd, 0.8)
      g.beginPath()
      g.moveTo(x1, y1)
      g.lineTo(mx + px * off, my + py * off)
      g.lineTo(x2, y2)
      g.strokePath()
      g.lineStyle(1.5, 0xffffff, 1)
      g.beginPath()
      g.moveTo(x1, y1)
      g.lineTo(mx + px * off, my + py * off)
      g.lineTo(x2, y2)
      g.strokePath()
      if (doTick) {
        const tol = 14
        const tol2 = tol * tol
        const segLen2 = dx * dx + dy * dy
        for (const e of enemies) {
          if (!e.active) continue
          const t = Math.max(0, Math.min(1, ((e.x - x1) * dx + (e.y - y1) * dy) / segLen2))
          const ex = x1 + dx * t, ey = y1 + dy * t
          if ((e.x - ex) ** 2 + (e.y - ey) ** 2 <= tol2) {
            scene.damageEnemy(e, tickDmg, false)
          }
        }
      }
    }
  }
}

function destroyBlackholeVisuals(bh: any) {
  if (bh.halo)  { bh.halo.destroy();  bh.halo = null }
  if (bh.rings) { bh.rings.destroy(); bh.rings = null }
  if (bh.arms)  { bh.arms.destroy();  bh.arms = null }
  if (bh.streaks) {
    for (const st of bh.streaks) if (st?.gfx?.active) st.gfx.destroy()
    bh.streaks.length = 0
  }
  if (bh.binaryFilament?.active) { bh.binaryFilament.destroy(); bh.binaryFilament = null }
  if (bh.binaryPair && bh.binaryPair.binaryPair === bh) bh.binaryPair.binaryPair = null
  bh.binaryPair = null
}

function drawBlackholeArms(scene: IGameScene, bh: any) {
  const g = bh.arms
  if (!g) return
  const cx = bh.sprite.x, cy = bh.sprite.y
  const inner = bh.coreRadius * 0.6
  const outer = bh.midRadius
  const phase = bh.pulse * 0.012
  const armColor = bh.evolved ? 0xfde68a : 0xc4b5fd
  const armAlpha = bh.evolved ? 0.7 : 0.55
  g.clear()
  g.lineStyle(2, armColor, armAlpha)
  const armCount = bh.evolved ? 4 : 3
  for (let a = 0; a < armCount; a++) {
    const baseAngle = phase + (a * Math.PI * 2) / armCount
    const steps = 14
    g.beginPath()
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const r = inner + (outer - inner) * t
      const ang = baseAngle + t * 1.6
      const x = cx + Math.cos(ang) * r
      const y = cy + Math.sin(ang) * r
      if (s === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.strokePath()
  }
}

function drawBlackholeRings(scene: IGameScene, bh: any) {
  const g = bh.rings
  if (!g) return
  const cx = bh.sprite.x, cy = bh.sprite.y
  const t = bh.pulse / 1000
  const pulse = (off: number) => 0.85 + 0.15 * Math.sin(t * 2 + off)
  g.clear()
  g.lineStyle(1.5, 0xc4b5fd, 0.22 * pulse(0))
  g.strokeCircle(cx, cy, bh.coreRadius)
  g.lineStyle(1, 0xa78bfa, 0.16 * pulse(1.3))
  g.strokeCircle(cx, cy, bh.midRadius)
  g.lineStyle(1, 0x8b5cf6, 0.11 * pulse(2.6))
  g.strokeCircle(cx, cy, bh.outerRadius)
}

function drawBlackholeHalo(scene: IGameScene, bh: any) {
  const g = bh.halo
  if (!g) return
  const cx = bh.sprite.x, cy = bh.sprite.y
  const t = bh.pulse / 1000
  const wobble = 1 + 0.04 * Math.sin(t * 1.7)
  const color = bh.evolved ? 0xfde68a : 0xfb923c
  const alpha = bh.evolved ? 0.13 : 0.10
  g.clear()
  g.fillStyle(color, alpha * 0.5)
  g.fillCircle(cx, cy, bh.outerRadius * wobble)
  g.fillStyle(color, alpha)
  g.fillCircle(cx, cy, bh.midRadius * wobble)
}

function spawnBlackholeStreak(scene: IGameScene, bh: any) {
  const ang = Math.random() * Math.PI * 2
  const startR = bh.outerRadius * (0.85 + Math.random() * 0.15)
  const sx = bh.sprite.x + Math.cos(ang) * startR
  const sy = bh.sprite.y + Math.sin(ang) * startR
  const ex = bh.sprite.x + Math.cos(ang) * (bh.coreRadius * 0.4)
  const ey = bh.sprite.y + Math.sin(ang) * (bh.coreRadius * 0.4)
  const len = 6 + Math.random() * 8
  const color = bh.evolved ? 0xfde68a : 0xc4b5fd
  const gfx = scene.add.graphics().setDepth(3)
  const draw = (x: number, y: number, dx: number, dy: number) => {
    const m = Math.hypot(dx, dy) || 1
    const ux = dx / m, uy = dy / m
    gfx.clear()
    gfx.lineStyle(1.5, color, 0.85)
    gfx.beginPath()
    gfx.moveTo(x - ux * len * 0.5, y - uy * len * 0.5)
    gfx.lineTo(x + ux * len * 0.5, y + uy * len * 0.5)
    gfx.strokePath()
  }
  const state: any = { x: sx, y: sy, dx: ex - sx, dy: ey - sy, alpha: 1, gfx, alive: true }
  draw(state.x, state.y, state.dx, state.dy)
  state.tween = scene.tweens.add({
    targets: state,
    x: ex,
    y: ey,
    alpha: 0,
    duration: 600 + Math.random() * 300,
    ease: 'Cubic.easeIn',
    onUpdate: () => {
      if (!state.alive || !gfx.active) return
      gfx.alpha = state.alpha
      draw(state.x, state.y, state.dx, state.dy)
    },
    onComplete: () => {
      state.alive = false
      if (gfx.active) gfx.destroy()
      const idx = bh.streaks.indexOf(state)
      if (idx >= 0) bh.streaks.splice(idx, 1)
    },
  })
  bh.streaks.push(state)
}

function updateBlackholes(scene: IGameScene, delta: number) {
  for (let i = scene.blackholes.length - 1; i >= 0; i--) {
    const bh = scene.blackholes[i]
    if (!bh.sprite?.active) {
      destroyBlackholeVisuals(bh)
      scene.blackholes.splice(i, 1)
      continue
    }
    bh.pulse += delta
    bh.sprite.setRotation(bh.pulse * 0.005)

    const partner = bh.binaryPair
    if (partner && (!partner.sprite?.active)) bh.binaryPair = null
    if (bh.binaryPair && bh.phase === 'landed' && bh.binaryPair.phase === 'landed') {
      const px = bh.binaryPair.sprite.x - bh.sprite.x
      const py = bh.binaryPair.sprite.y - bh.sprite.y
      const d = Math.hypot(px, py) || 1
      const driftSpd = 30
      bh.sprite.x += (px / d) * driftSpd * delta / 1000
      bh.sprite.y += (py / d) * driftSpd * delta / 1000
      const mergeDist = bh.coreRadius + bh.binaryPair.coreRadius
      if (d <= mergeDist && bh.binaryPair) {
        const other = bh.binaryPair
        const mx = (bh.sprite.x + other.sprite.x) / 2
        const my = (bh.sprite.y + other.sprite.y) / 2
        const remainDur = Math.max(bh.duration, other.duration) + 1500
        const merged = spawnBlackhole(scene, mx, my, 0, 0, true, {
          phase: 'landed',
          flightLeft: 0,
          coreRadius: bh.coreRadius + other.coreRadius,
          midRadius: Math.max(bh.midRadius, other.midRadius) * 1.2,
          outerRadius: Math.max(bh.outerRadius, other.outerRadius) * 1.2,
          corePull: bh.corePull + other.corePull,
          midPull: bh.midPull + other.midPull,
          outerPull: bh.outerPull + other.outerPull,
          duration: remainDur,
          dmg: bh.dmg + other.dmg,
        })
        merged.halo  = scene.add.graphics().setDepth(2)
        merged.rings = scene.add.graphics().setDepth(3)
        merged.arms  = scene.add.graphics().setDepth(3)
        const ring = scene.acquireGfx(4)
        ring.lineStyle(4, 0xfde68a, 0.95).strokeCircle(mx, my, merged.outerRadius)
        scene.tweens.add({ targets: ring, alpha: 0, duration: 500, onComplete: () => scene.releaseGfx(ring) })
        scene.cameras.main.shake(140, 0.005)
        destroyBlackholeVisuals(bh)
        destroyBlackholeVisuals(other)
        bh.sprite.destroy()
        other.sprite.destroy()
        const otherIdx = scene.blackholes.indexOf(other)
        if (otherIdx >= 0) scene.blackholes.splice(otherIdx, 1)
        const bhIdxNow = scene.blackholes.indexOf(bh)
        if (bhIdxNow >= 0) scene.blackholes.splice(bhIdxNow, 1)
        i = scene.blackholes.length
        continue
      }
    }

    if (bh.binaryPair && bh.binaryPair.sprite?.active) {
      if (!bh.binaryFilament || !bh.binaryFilament.active) {
        bh.binaryFilament = scene.add.graphics().setDepth(3)
      }
      const fg = bh.binaryFilament
      fg.clear()
      const ox = bh.binaryPair.sprite.x, oy = bh.binaryPair.sprite.y
      const dx = ox - bh.sprite.x, dy = oy - bh.sprite.y
      const d = Math.hypot(dx, dy) || 1
      const closeness = Math.max(0, Math.min(1, 1 - d / 600))
      fg.lineStyle(2, 0xfde68a, 0.4 + closeness * 0.5)
      fg.lineBetween(bh.sprite.x, bh.sprite.y, ox, oy)
    } else if (bh.binaryFilament?.active) {
      bh.binaryFilament.clear()
    }

    if (bh.phase === 'flying') {
      bh.sprite.x += bh.vx * delta / 1000
      bh.sprite.y += bh.vy * delta / 1000
      bh.flightLeft -= delta
      if (bh.flightLeft <= 0) {
        bh.phase = 'landed'
        bh.halo  = scene.add.graphics().setDepth(2)
        bh.rings = scene.add.graphics().setDepth(3)
        bh.arms  = scene.add.graphics().setDepth(3)
        const ring = scene.acquireGfx(4)
        ring.lineStyle(3, 0xa78bfa, 0.9).strokeCircle(bh.sprite.x, bh.sprite.y, bh.outerRadius)
        scene.tweens.add({ targets: ring, alpha: 0, duration: 400, onComplete: () => scene.releaseGfx(ring) })
        scene.cameras.main.shake(100, 0.003)
      }
    } else {
      bh.duration -= delta
      bh.tickTimer += delta
      bh.streakSpawnTimer += delta

      const cr = bh.coreRadius,  cr2 = cr * cr
      const mr = bh.midRadius,   mr2 = mr * mr
      const orR = bh.outerRadius, or2 = orR * orR
      const doTick = bh.tickTimer >= 250
      if (doTick) bh.tickTimer = 0

      for (const e of scene.enemies.getChildren() as any[]) {
        if (!e.active) continue
        const dx = bh.sprite.x - e.x, dy = bh.sprite.y - e.y
        const d2 = dx * dx + dy * dy
        if (d2 > or2) continue
        const d = Math.sqrt(d2) || 1
        let pullBase: number
        let zoneR: number
        if (d2 <= cr2)      { pullBase = bh.corePull;  zoneR = cr }
        else if (d2 <= mr2) { pullBase = bh.midPull;   zoneR = mr }
        else                { pullBase = bh.outerPull; zoneR = orR }
        // proximity: 0 at zone edge, 1 at center → pull accelerates inward
        const proximity = 1 - Math.min(1, d / zoneR)
        const enemySpeed = e.getData('speed') ?? 0
        const pullSpd = Math.max(pullBase * (1 + proximity * 0.9), enemySpeed * 1.05)
        e.setVelocity((dx / d) * pullSpd, (dy / d) * pullSpd)
        if (doTick && d2 <= cr2) scene.damageEnemy(e, bh.dmg, false)
      }

      drawBlackholeHalo(scene, bh)
      drawBlackholeRings(scene, bh)
      drawBlackholeArms(scene, bh)

      while (bh.streakSpawnTimer >= 80) {
        bh.streakSpawnTimer -= 80
        const burst = 1 + (Math.random() < 0.4 ? 1 : 0) + (bh.evolved && Math.random() < 0.5 ? 1 : 0)
        for (let k = 0; k < burst; k++) spawnBlackholeStreak(scene, bh)
      }

      if (bh.duration <= 0) {
        const finalExp = scene.acquireGfx(5)
        finalExp.fillStyle(0xa78bfa, 0.6).fillCircle(bh.sprite.x, bh.sprite.y, cr * 1.15)
        scene.tweens.add({ targets: finalExp, alpha: 0, duration: 300, onComplete: () => scene.releaseGfx(finalExp) })
        scene.cameras.main.shake(110, 0.0035)
        for (const e of scene.enemies.getChildren() as any[]) {
          if (!e.active) continue
          if ((bh.sprite.x - e.x) ** 2 + (bh.sprite.y - e.y) ** 2 < cr2) {
            scene.damageEnemy(e, bh.dmg * 4)
          }
        }
        destroyBlackholeVisuals(bh)
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
const RAILGUN_FOCUS_MS = 500
const RAILGUN_SWEEP_DURATION = 1800
const RAILGUN_TICK_INTERVAL = 150
const RAILGUN_FOCUS_TICK_INTERVAL = 80

function updateRailgunCharges(scene: IGameScene, delta: number) {
  for (let i = scene.railgunCharges.length - 1; i >= 0; i--) {
    const c = scene.railgunCharges[i]
    const sx = playerEmitX(scene), sy = playerEmitY(scene)
    const range = 1600
    if (c.firing && c.sweep && !c.focusing) {
      const t = 1 - c.firingTimer / RAILGUN_SWEEP_DURATION
      c.angle = c.startAngle + c.sweepDir * t * Math.PI * 2
    }
    const ex = sx + Math.cos(c.angle) * range
    const ey = sy + Math.sin(c.angle) * range
    c.gfx.clear()

    if (c.firing) {
      c.firingTimer -= delta
      c.tickTimer -= delta
      const inFocus = c.focusing
      const totalDur = inFocus ? RAILGUN_FOCUS_MS : (c.sweep ? RAILGUN_SWEEP_DURATION : RAILGUN_FIRE_DURATION)
      const fade = 1 - c.firingTimer / totalDur
      const alpha = Math.max(0, (inFocus ? 1.0 : 0.9) - fade * 0.3)
      const bw = scene.railgunWidth * 2.4 * (1 + scene.bonusArea * 0.5) * (inFocus ? 1.15 : 1)
      const flicker = 0.92 + Math.random() * 0.16
      c.gfx.lineStyle(bw * flicker, inFocus ? 0xfde68a : 0x93c5fd, alpha).lineBetween(sx, sy, ex, ey)
      c.gfx.lineStyle(Math.max(2, bw * 0.35) * flicker, 0xffffff, Math.min(1, alpha + 0.15)).lineBetween(sx, sy, ex, ey)

      if (c.tickTimer <= 0) {
        c.tickTimer += inFocus ? RAILGUN_FOCUS_TICK_INTERVAL : RAILGUN_TICK_INTERVAL
        const dx = ex - sx, dy = ey - sy
        const len2 = dx * dx + dy * dy
        const tol = bw * 0.55 + 24
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
        if (c.focusing) {
          c.focusing = false
          c.firingTimer = RAILGUN_SWEEP_DURATION
          c.tickTimer = 0
        } else {
          c.gfx.destroy()
          scene.railgunCharges.splice(i, 1)
        }
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
      if (c.sweep) {
        c.focusing = true
        c.firingTimer = RAILGUN_FOCUS_MS
      } else {
        c.firingTimer = RAILGUN_FIRE_DURATION
      }
      c.tickTimer = 0
    }
  }
}

const DRONE_TARGET_LOCK_MS = 8000
const DRONE_HIT_RANGE = 18
const DRONE_REHIT_MS = 300
const DRONE_IDLE_RADIUS = 110
const DRONE_RETURN_SPEED_MULT = 1.5
const DRONE_RETURN_ARRIVE_RADIUS2 = DRONE_IDLE_RADIUS * DRONE_IDLE_RADIUS
const DRONE_OPERATING_RANGE = 700
const DRONE_OPERATING_RANGE2 = DRONE_OPERATING_RANGE * DRONE_OPERATING_RANGE
const DRONE_TARGET_RANGE2 = DRONE_OPERATING_RANGE * DRONE_OPERATING_RANGE

function updateDrones(scene: IGameScene, delta: number) {
  const dtSec = delta / 1000
  const recallDist2 = DRONE_OPERATING_RANGE2
  const hitRange2 = DRONE_HIT_RANGE * DRONE_HIT_RANGE
  const now = scene.gameTime

  for (let i = scene.drones.length - 1; i >= 0; i--) {
    const d = scene.drones[i]
    if (!d.sprite?.active) { d.gfx?.destroy(); scene.drones.splice(i, 1); continue }
    d.targetTimer = Math.max(0, d.targetTimer - delta)
    d.gfx.clear()

    const px = playerEmitX(scene), py = playerEmitY(scene)
    const pdx = d.sprite.x - px, pdy = d.sprite.y - py
    if (!d.returning && pdx * pdx + pdy * pdy > recallDist2) {
      d.returning = true
      d.target = null
      d.targetTimer = 0
    }

    if (d.returning) {
      const dist2 = pdx * pdx + pdy * pdy
      const returnSpeed = d.speed * DRONE_RETURN_SPEED_MULT
      const desired = Math.atan2(py - d.sprite.y, px - d.sprite.x)
      const current = Math.atan2(d.vy, d.vx)
      let diff = desired - current
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      const maxStep = d.turnRate * dtSec
      const step = diff > maxStep ? maxStep : diff < -maxStep ? -maxStep : diff
      const heading = current + step
      d.vx = Math.cos(heading) * returnSpeed
      d.vy = Math.sin(heading) * returnSpeed
      d.sprite.x += d.vx * dtSec
      d.sprite.y += d.vy * dtSec
      d.sprite.setRotation(heading)
      if (dist2 <= DRONE_RETURN_ARRIVE_RADIUS2) {
        d.returning = false
        d.orbitAngle = Math.atan2(d.sprite.y - py, d.sprite.x - px)
      }
      continue
    }

    if (!d.target?.active || d.targetTimer <= 0) {
      const claimed = new Set<any>()
      for (const other of scene.drones) {
        if (other !== d && other.target?.active) claimed.add(other.target)
      }
      const enemies = scene.enemies.getChildren() as any[]
      let best: any = null, bestD2 = Infinity
      for (const e of enemies) {
        if (!e.active || claimed.has(e)) continue
        const playerD2 = (e.x - px) ** 2 + (e.y - py) ** 2
        if (playerD2 > DRONE_TARGET_RANGE2) continue
        const d2 = (e.x - d.sprite.x) ** 2 + (e.y - d.sprite.y) ** 2
        if (d2 < bestD2) { bestD2 = d2; best = e }
      }
      d.target = best
      d.targetTimer = best ? DRONE_TARGET_LOCK_MS : 0
    }

    if (d.target?.active) {
      const desired = Math.atan2(d.target.y - d.sprite.y, d.target.x - d.sprite.x)
      const current = Math.atan2(d.vy, d.vx)
      let diff = desired - current
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      const maxStep = d.turnRate * dtSec
      const step = diff > maxStep ? maxStep : diff < -maxStep ? -maxStep : diff
      const heading = current + step
      d.vx = Math.cos(heading) * d.speed
      d.vy = Math.sin(heading) * d.speed
      d.sprite.x += d.vx * dtSec
      d.sprite.y += d.vy * dtSec
      d.sprite.setRotation(heading)

      if (d.recentHits.length) {
        d.recentHits = d.recentHits.filter((h: { e: any; expiry: number }) => h.expiry > now && h.e?.active)
      }
      for (const e of scene.enemies.getChildren() as any[]) {
        if (!e.active) continue
        const dx = e.x - d.sprite.x, dy = e.y - d.sprite.y
        if (dx * dx + dy * dy > hitRange2) continue
        if (d.recentHits.some((h: { e: any; expiry: number }) => h.e === e)) continue
        scene.damageEnemy(e, scene.droneDmg, true)
        spawnDroneHitIcon(scene, e.x, e.y)
        d.recentHits.push({ e, expiry: now + DRONE_REHIT_MS })
        if (e === d.target) {
          scene.tweens.add({ targets: d.sprite, scale: { from: 1.5, to: 1 }, duration: 180 })
        }
      }
    } else {
      d.orbitAngle += dtSec * 1.1
      const tx = px + Math.cos(d.orbitAngle) * DRONE_IDLE_RADIUS
      const ty = py + Math.sin(d.orbitAngle) * DRONE_IDLE_RADIUS
      const dx = tx - d.sprite.x, dy = ty - d.sprite.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const move = Math.min(d.speed * dtSec, dist)
      d.sprite.x += (dx / dist) * move
      d.sprite.y += (dy / dist) * move
      const heading = Math.atan2(dy, dx)
      d.vx = Math.cos(heading) * d.speed
      d.vy = Math.sin(heading) * d.speed
      d.sprite.setRotation(heading)
    }
  }

  const dronesEvolved = !!scene.weaponEvolutions['drones']
  if (!dronesEvolved || scene.drones.length < 2) {
    if (scene.droneBeamGfx?.active) scene.droneBeamGfx.clear()
    return
  }
  if (!scene.droneBeamGfx) {
    scene.droneBeamGfx = scene.add.graphics().setDepth(4)
  }
  const g = scene.droneBeamGfx
  g.clear()
  scene.droneBeamTickTimer -= delta
  const doTick = scene.droneBeamTickTimer <= 0
  if (doTick) scene.droneBeamTickTimer += 150
  const tickDmg = Math.max(1, Math.floor(scene.droneDmg * 0.4))
  const enemies = scene.enemies.getChildren() as any[]
  const beamPulse = 0.85 + 0.15 * Math.sin(scene.gameTime * 0.012)
  const activeDrones = scene.drones.filter((d) => d.sprite?.active)
  for (let i = 0; i + 1 < activeDrones.length; i += 2) {
    const a = activeDrones[i].sprite
    const b = activeDrones[i + 1].sprite
    const x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y
    g.lineStyle(3, 0x60a5fa, 0.7 * beamPulse).lineBetween(x1, y1, x2, y2)
    g.lineStyle(1, 0xffffff, 0.95).lineBetween(x1, y1, x2, y2)
    if (doTick) {
      const dx = x2 - x1, dy = y2 - y1
      const segLen2 = dx * dx + dy * dy || 1
      const tol = 16
      const tol2 = tol * tol
      for (const e of enemies) {
        if (!e.active) continue
        const t = Math.max(0, Math.min(1, ((e.x - x1) * dx + (e.y - y1) * dy) / segLen2))
        const ex = x1 + dx * t, ey = y1 + dy * t
        if ((e.x - ex) ** 2 + (e.y - ey) ** 2 <= tol2) {
          scene.damageEnemy(e, tickDmg, false)
        }
      }
    }
  }
}

// ── Crescent Cleave ───────────────────────────────────────────────────────

const CLEAVE_ARC_CAP = (105 * Math.PI) / 180
const CLEAVE_DELAY_MS = 150

export function fireCleave(scene: IGameScene, angle: number) {
  const count = scene.cleaveCount + scene.bonusProjectiles
  if (count <= 0) return

  performCleaveSlash(scene, angle)

  // Slot 1 = behind, slot 2 = front, slot 3 = behind, ... — each slightly delayed.
  // Delayed slashes recompute aim at fire time so they track the player's current target.
  for (let i = 1; i < count; i++) {
    scene.cleavePending.push({ delay: CLEAVE_DELAY_MS * i, front: i % 2 === 0 })
  }
}

function performCleaveSlash(scene: IGameScene, centerAngle: number) {
  const areaMul = 1 + scene.bonusArea
  const outerR = scene.cleaveRadius * areaMul
  const innerR = outerR * 0.35
  const arc = Math.min(CLEAVE_ARC_CAP, scene.cleaveArc * areaMul)
  const halfArc = arc / 2
  const dmg = scene.cleaveDmg
  const px = playerEmitX(scene), py = playerEmitY(scene)
  const outerR2 = outerR * outerR
  const innerR2 = innerR * innerR
  const evolved = !!scene.weaponEvolutions['cleave']

  for (const e of scene.enemies.getChildren() as any[]) {
    if (!e.active) continue
    const dx = e.x - px, dy = e.y - py
    const d2 = dx * dx + dy * dy
    if (d2 > outerR2 || d2 < innerR2) continue
    let diff = Math.atan2(dy, dx) - centerAngle
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    if (Math.abs(diff) > halfArc) continue
    scene.damageEnemy(e, dmg, true)
  }
  spawnCleaveVisual(scene, px, py, centerAngle, innerR, outerR, halfArc)

  if (evolved) {
    scene.cleaveShockwaves.push({
      x: px,
      y: py,
      centerAngle,
      halfArc,
      startR: outerR,
      endR: outerR * 2.2,
      age: 0,
      duration: 350,
      damage: Math.max(1, Math.floor(dmg * 0.6)),
      hitSet: new Set<any>(),
      gfx: scene.add.graphics().setDepth(6),
    })
  }
}

function updateCleavePending(scene: IGameScene, delta: number) {
  if (scene.cleavePending.length === 0) return
  for (let i = scene.cleavePending.length - 1; i >= 0; i--) {
    const p = scene.cleavePending[i]
    p.delay -= delta
    if (p.delay > 0) continue
    scene.cleavePending.splice(i, 1)

    const targets = scene.enemies.getChildren() as any[]
    if (targets.length === 0) continue
    const px = playerEmitX(scene), py = playerEmitY(scene)
    const nearest = targets.reduce((a, b) => {
      const dax = px - a.x, day = py - a.y
      const dbx = px - b.x, dby = py - b.y
      return dax * dax + day * day <= dbx * dbx + dby * dby ? a : b
    })
    const aim = Math.atan2(nearest.y - py, nearest.x - px)
    performCleaveSlash(scene, p.front ? aim : aim + Math.PI)
  }
}

function spawnCleaveVisual(scene: IGameScene, px: number, py: number, centerAngle: number, innerR: number, outerR: number, halfArc: number) {
  const gfx = scene.acquireGfx(6)
  const steps = 22
  const startA = centerAngle - halfArc
  const endA = centerAngle + halfArc

  gfx.fillStyle(0xfca5a5, 0.28)
  gfx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const a = startA + (endA - startA) * (i / steps)
    const x = px + Math.cos(a) * outerR
    const y = py + Math.sin(a) * outerR
    if (i === 0) gfx.moveTo(x, y)
    else gfx.lineTo(x, y)
  }
  for (let i = steps; i >= 0; i--) {
    const a = startA + (endA - startA) * (i / steps)
    gfx.lineTo(px + Math.cos(a) * innerR, py + Math.sin(a) * innerR)
  }
  gfx.closePath()
  gfx.fillPath()

  gfx.lineStyle(3, 0xffffff, 0.95)
  gfx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const a = startA + (endA - startA) * (i / steps)
    const x = px + Math.cos(a) * outerR
    const y = py + Math.sin(a) * outerR
    if (i === 0) gfx.moveTo(x, y)
    else gfx.lineTo(x, y)
  }
  gfx.strokePath()

  gfx.lineStyle(1.5, 0xef4444, 0.8)
  gfx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const a = startA + (endA - startA) * (i / steps)
    const x = px + Math.cos(a) * (outerR * 0.78)
    const y = py + Math.sin(a) * (outerR * 0.78)
    if (i === 0) gfx.moveTo(x, y)
    else gfx.lineTo(x, y)
  }
  gfx.strokePath()

  scene.tweens.add({ targets: gfx, alpha: 0, duration: 260, onComplete: () => scene.releaseGfx(gfx) })
}
