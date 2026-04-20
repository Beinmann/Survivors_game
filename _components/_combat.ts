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
    } else {
      if (!nearest) continue
      if (wt === 'shotgun')    scene.fireShotgun(angle, wt)
      else if (wt === 'sniper')     scene.fireSniper(angle, wt)
      else if (wt === 'machinegun') scene.fireMachineGun(angle, wt)
    }
    scene.weaponCooldowns[wt] = time + scene.effectiveShootRate(wt)
  }
}

export function fireShotgun(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const rear = scene.weaponRearShot[wt] ?? false
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
  if (rear) {
    const rp = Math.max(3, Math.floor(pellets / 2))
    const rs = rp > 1 ? cone / (rp - 1) : 0
    for (let i = 0; i < rp; i++) fire(angle + Math.PI + (rp > 1 ? -cone / 2 + rs * i : 0))
  }
}

export function fireSniper(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const rear = scene.weaponRearShot[wt] ?? false
  const fire = (a: number) => {
    const b = scene.bullets.create(scene.player.x, scene.player.y, 'sniperBullet') as any
    b.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd)
    b.setRotation(a)
    b.setData('dmg', scene.sniperDmg)
    b.setData('pierceLeft', scene.pierceCount)
    b.setData('hitEnemies', new Set())
    b.setDepth(4)
  }
  fire(angle)
  if (rear) fire(angle + Math.PI)
}

export function fireMachineGun(scene: IGameScene, angle: number, wt: WeaponType) {
  const spd = scene.weaponBulletSpd[wt] ?? WEAPON_BASE[wt].bulletSpd
  const rear = scene.weaponRearShot[wt] ?? false
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
  if (rear) fire(angle + Math.PI)
}

export function fireAura(scene: IGameScene) {
  let hit = false
  for (const e of [...scene.enemies.getChildren()] as any[]) {
    if (!e.active) continue
    const dist = Math.sqrt((scene.player.x - e.x) ** 2 + (scene.player.y - e.y) ** 2)
    if (dist <= scene.auraRadius) {
      scene.damageEnemy(e, scene.auraDmg, false)
      hit = true
    }
  }
  if (hit) scene.showAuraPulse()
}

export function showAuraPulse(scene: IGameScene) {
  const spikes = 14
  const outerR = scene.auraRadius
  const innerR = scene.auraRadius * 0.68

  const rotation = Math.random() * Math.PI * 2
  const prominentCount = 2 + Math.floor(Math.random() * 2)
  const prominent = new Set<number>()
  while (prominent.size < prominentCount) prominent.add(Math.floor(Math.random() * spikes))

  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2 + rotation
    let r: number
    if (i % 2 === 0) {
      r = prominent.has(i / 2)
        ? outerR * (1.28 + Math.random() * 0.22) + (Math.random() - 0.5) * 8
        : outerR * (0.88 + Math.random() * 0.18)
    } else {
      r = innerR + (Math.random() - 0.5) * 10
    }
    pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r })
  }

  const draw = (g: any) => {
    g.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y)
    g.closePath()
  }

  const ring = scene.add.graphics().setDepth(4)
  ring.x = scene.player.x
  ring.y = scene.player.y
  ring.fillStyle(0xa78bfa, 0.13)
  ring.beginPath(); draw(ring); ring.fillPath()
  ring.lineStyle(2, 0xc4b5fd, 0.9)
  ring.beginPath(); draw(ring); ring.strokePath()

  scene.tweens.add({ 
    targets: ring, 
    alpha: 0, 
    duration: 420, 
    onUpdate: () => {
      if (scene.player) {
        ring.x = scene.player.x
        ring.y = scene.player.y
      }
    },
    onComplete: () => ring.destroy() 
  })
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
    const dmg = b.getData('dmg') ?? scene.sniperDmg
    scene.damageEnemy(e, dmg)
    const remaining = pierceLeft - 1
    if (remaining <= 0) b.destroy()
    else b.setData('pierceLeft', remaining)
  } else {
    const dmg = b.getData('dmg') ?? scene.shotgunDmg
    b.destroy()
    scene.damageEnemy(e, dmg)
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
    orb.setDepth(2).setVelocity(0, 0)
    orb.setData('xpValue', orbCount)
    scene.tintConsolidatedOrb(orb, orbCount)
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
  const t = Math.min(1, (value - 1) / 15)
  const g = Math.round(0x50 * (1 - t))
  orb.setTint((0xff << 16) | (g << 8))
  orb.setScale(1 + Math.min(1.5, (value - 1) * 0.08))
}
