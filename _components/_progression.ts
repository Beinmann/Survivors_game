import { IGameScene } from './_sceneInterface'
import { WeaponType, WEAPON_NAMES, ALL_WEAPON_TYPES, WEAPON_BASE } from './_types'

export function onCollectOrb(scene: IGameScene, _p: any, orb: any) {
  const o = orb as any
  const xpValue = o.getData('xpValue') ?? 1
  o.destroy()
  scene.xp += xpValue * scene.orbMultiplier
  if (scene.xp >= scene.xpNeeded) {
    scene.xp = 0
    scene.xpNeeded = Math.floor(scene.xpNeeded * 1.25)
    scene.level++
    scene.levelText.setText(`Level ${scene.level}`)
    scene.showUpgradeMenu()
  }
}

export function getWeaponUpgrades(scene: IGameScene): any[] {
  type Step = { desc: string; apply: () => void }
  const paths: Record<WeaponType, Step[]> = {
    shotgun: [
      { desc: '+2 pellets  ·  −50ms cooldown',             apply: () => { scene.extraBullets += 2; scene.weaponShootRates['shotgun'] = Math.max(100, (scene.weaponShootRates['shotgun'] ?? 550) - 50) } },
      { desc: '+30% damage  ·  +50px range',               apply: () => { scene.shotgunDmg = Math.round(scene.shotgunDmg * 1.3); scene.shotgunRange += 50 } },
      { desc: 'Unlock rear shot',                          apply: () => { scene.weaponRearShot['shotgun'] = true } },
      { desc: '+2 pellets  ·  +30% damage',                apply: () => { scene.extraBullets += 2; scene.shotgunDmg = Math.round(scene.shotgunDmg * 1.3) } },
      { desc: '−80ms cooldown  ·  +60px range',            apply: () => { scene.weaponShootRates['shotgun'] = Math.max(100, (scene.weaponShootRates['shotgun'] ?? 550) - 80); scene.shotgunRange += 60 } },
      { desc: '+40% damage  ·  +2 pellets',                apply: () => { scene.shotgunDmg = Math.round(scene.shotgunDmg * 1.4); scene.extraBullets += 2 } },
      { desc: '−80ms cooldown  ·  +60px range',            apply: () => { scene.weaponShootRates['shotgun'] = Math.max(100, (scene.weaponShootRates['shotgun'] ?? 550) - 80); scene.shotgunRange += 60 } },
      { desc: '+60% damage  ·  +4 pellets  ·  −100ms',     apply: () => { scene.shotgunDmg = Math.round(scene.shotgunDmg * 1.6); scene.extraBullets += 4; scene.weaponShootRates['shotgun'] = Math.max(100, (scene.weaponShootRates['shotgun'] ?? 550) - 100) } },
    ],
    sniper: [
      { desc: '+1 pierce  ·  +50% damage',                 apply: () => { scene.pierceCount++; scene.sniperDmg = Math.round(scene.sniperDmg * 1.5) } },
      { desc: '−250ms cooldown  ·  +30% bullet speed',     apply: () => { scene.weaponShootRates['sniper'] = Math.max(300, (scene.weaponShootRates['sniper'] ?? 1400) - 250); scene.weaponBulletSpd['sniper'] = Math.round((scene.weaponBulletSpd['sniper'] ?? 680) * 1.3) } },
      { desc: 'Rear shot  ·  +50% damage',                 apply: () => { scene.weaponRearShot['sniper'] = true; scene.sniperDmg = Math.round(scene.sniperDmg * 1.5) } },
      { desc: '+2 pierce  ·  −200ms cooldown',             apply: () => { scene.pierceCount += 2; scene.weaponShootRates['sniper'] = Math.max(300, (scene.weaponShootRates['sniper'] ?? 1400) - 200) } },
      { desc: '+70% damage  ·  +30% bullet speed',         apply: () => { scene.sniperDmg = Math.round(scene.sniperDmg * 1.7); scene.weaponBulletSpd['sniper'] = Math.round((scene.weaponBulletSpd['sniper'] ?? 680) * 1.3) } },
      { desc: '+2 pierce  ·  −200ms cooldown',             apply: () => { scene.pierceCount += 2; scene.weaponShootRates['sniper'] = Math.max(300, (scene.weaponShootRates['sniper'] ?? 1400) - 200) } },
      { desc: '+80% damage  ·  +30% bullet speed',         apply: () => { scene.sniperDmg = Math.round(scene.sniperDmg * 1.8); scene.weaponBulletSpd['sniper'] = Math.round((scene.weaponBulletSpd['sniper'] ?? 680) * 1.3) } },
      { desc: '+3 pierce  ·  +100% damage  ·  −200ms',     apply: () => { scene.pierceCount += 3; scene.sniperDmg = Math.round(scene.sniperDmg * 2.0); scene.weaponShootRates['sniper'] = Math.max(300, (scene.weaponShootRates['sniper'] ?? 1400) - 200) } },
    ],
    aura: [
      { desc: '+30% damage',                               apply: () => { scene.auraDmg = Math.round(scene.auraDmg * 1.3) } },
      { desc: '+25px radius  ·  −80ms cooldown',           apply: () => { scene.auraRadius += 25; scene.weaponShootRates['aura'] = Math.max(100, (scene.weaponShootRates['aura'] ?? 500) - 80) } },
      { desc: '+50% damage  ·  +25px radius',              apply: () => { scene.auraDmg = Math.round(scene.auraDmg * 1.5); scene.auraRadius += 25 } },
      { desc: '−100ms cooldown  ·  +30px radius',          apply: () => { scene.weaponShootRates['aura'] = Math.max(100, (scene.weaponShootRates['aura'] ?? 500) - 100); scene.auraRadius += 30 } },
      { desc: '+60% damage  ·  +30px radius',              apply: () => { scene.auraDmg = Math.round(scene.auraDmg * 1.6); scene.auraRadius += 30 } },
      { desc: '−100ms cooldown  ·  +35px radius',          apply: () => { scene.weaponShootRates['aura'] = Math.max(100, (scene.weaponShootRates['aura'] ?? 500) - 100); scene.auraRadius += 35 } },
      { desc: '+80% damage  ·  +35px radius',              apply: () => { scene.auraDmg = Math.round(scene.auraDmg * 1.8); scene.auraRadius += 35 } },
      { desc: '+100% damage  ·  +50px radius  ·  −100ms',  apply: () => { scene.auraDmg = Math.round(scene.auraDmg * 2.0); scene.auraRadius += 50; scene.weaponShootRates['aura'] = Math.max(100, (scene.weaponShootRates['aura'] ?? 500) - 100) } },
    ],
    machinegun: [
      { desc: '+40% damage  ·  −15ms cooldown',            apply: () => { scene.machineGunDmg = Math.round(scene.machineGunDmg * 1.4); scene.weaponShootRates['machinegun'] = Math.max(50, (scene.weaponShootRates['machinegun'] ?? 100) - 15) } },
      { desc: '+40% damage  ·  −15ms cooldown',            apply: () => { scene.machineGunDmg = Math.round(scene.machineGunDmg * 1.4); scene.weaponShootRates['machinegun'] = Math.max(50, (scene.weaponShootRates['machinegun'] ?? 100) - 15) } },
      { desc: 'Piercing rounds — bullets pass through 1 enemy', apply: () => { scene.machineGunPierce = true } },
      { desc: '+40% damage  ·  −15ms cooldown',            apply: () => { scene.machineGunDmg = Math.round(scene.machineGunDmg * 1.4); scene.weaponShootRates['machinegun'] = Math.max(50, (scene.weaponShootRates['machinegun'] ?? 100) - 15) } },
      { desc: 'Burst fire — 2 bullets per shot',           apply: () => { scene.machineGunBurst = 2 } },
      { desc: 'Rear shot  ·  +30% damage',                 apply: () => { scene.weaponRearShot['machinegun'] = true; scene.machineGunDmg = Math.round(scene.machineGunDmg * 1.3) } },
      { desc: '3-round burst  ·  −20ms cooldown',          apply: () => { scene.machineGunBurst = 3; scene.weaponShootRates['machinegun'] = Math.max(50, (scene.weaponShootRates['machinegun'] ?? 100) - 20) } },
      { desc: '+60% damage  ·  −20ms cooldown',            apply: () => { scene.machineGunDmg = Math.round(scene.machineGunDmg * 1.6); scene.weaponShootRates['machinegun'] = Math.max(50, (scene.weaponShootRates['machinegun'] ?? 100) - 20) } },
    ],
  }
  const result: any[] = []
  for (const wt of scene.weapons) {
    const lvl = scene.weaponLevels[wt] ?? 1
    if (lvl >= 9) continue
    const step = paths[wt]?.[lvl - 1]
    if (!step) continue
    result.push({
      name: `${WEAPON_NAMES[wt]} Lv ${lvl + 1}`,
      desc: step.desc,
      icon: `wico_${wt}`,
      apply: () => { step.apply(); scene.weaponLevels[wt] = lvl + 1 },
      isWeaponUpgrade: true,
    })
  }
  return result
}

export function getUpgrades(scene: IGameScene) {
  const passives = [
    { name: 'Swift Feet',    icon: 'ico_movespeed', desc: 'Move 25% faster',                         apply: () => { scene.moveSpeed = Math.round(scene.moveSpeed * 1.25) } },
    { name: 'XP Magnet',     icon: 'ico_magnet',    desc: 'Pull orbs from 80px further away',         apply: () => { scene.magnetRadius += 80 } },
    { name: 'Bounty Hunter', icon: 'ico_orbmult',   desc: 'Gain 35% more XP from every orb',          apply: () => { scene.orbMultiplier += 0.35 } },
    { name: 'Vital Surge',   icon: 'ico_hp',        desc: 'Restore 40 HP and raise max HP by 20',     apply: () => { scene.maxHp += 20; scene.hp = Math.min(scene.maxHp, scene.hp + 40) } },
    { name: 'Power Core',    icon: 'ico_damage',    desc: '+20% damage for all active weapons',        apply: () => { scene.shotgunDmg = Math.round(scene.shotgunDmg * 1.2); scene.sniperDmg = Math.round(scene.sniperDmg * 1.2); scene.auraDmg = Math.round(scene.auraDmg * 1.2); scene.machineGunDmg = Math.round(scene.machineGunDmg * 1.2) } },
    { name: 'Overclock',     icon: 'ico_cooldown',  desc: 'All weapons fire 15% faster',               apply: () => { for (const wt of scene.weapons) { scene.weaponShootRates[wt] = Math.max(50, Math.round((scene.weaponShootRates[wt] ?? WEAPON_BASE[wt].shootRate) * 0.85)) } } },
  ]
  const weaponUpgrades = scene.getWeaponUpgrades()
  const unlockOptions = scene.weapons.length < 3
    ? ALL_WEAPON_TYPES
        .filter(wt => !scene.weapons.includes(wt))
        .map(wt => ({
          name: `Unlock ${WEAPON_NAMES[wt]}`,
          icon: `wico_${wt}`,
          desc: weaponUnlockDesc(wt),
          apply: () => scene.unlockWeapon(wt),
          isNewWeapon: true as const,
        }))
    : []

  const pool = [
    ...passives,
    ...weaponUpgrades.flatMap(u => [u, u, u]),
    ...unlockOptions.flatMap(u => [u, u]),
  ]
  pool.sort(() => Math.random() - 0.5)
  const seen = new Set<string>()
  const result: any[] = []
  for (const u of pool) {
    if (!seen.has(u.name) && result.length < 3) { seen.add(u.name); result.push(u) }
  }
  return result
}

function weaponUnlockDesc(wt: WeaponType): string {
  const descs: Record<WeaponType, string> = {
    shotgun:    'Cone of pellets · deadly up close',
    sniper:     'Piercing shot · slow but powerful',
    aura:       'Electric pulse · hits all nearby enemies',
    machinegun: 'Rapid fire · scales to burst spread',
  }
  return descs[wt]
}

export function showUpgradeMenu(scene: IGameScene) {
  scene.levelUpPending = true
  scene.physics.world.pause()

  const { width: w, height: h } = scene.cameras.main
  const upgrades = scene.getUpgrades()

  const overlay = scene.add.graphics().setScrollFactor(0).setDepth(40)
  overlay.fillStyle(0x000000, 0.75).fillRect(0, 0, w, h)

  const title = scene.add.text(w / 2, h / 2 - 130, `LEVEL ${scene.level} — Choose an upgrade`, {
    fontSize: '22px', color: '#fbbf24', stroke: '#000', strokeThickness: 4,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(41)

  const cardW = Math.min(190, (w - 80) / 3 - 10)
  const cardH = 140
  const gap = cardW + 20
  const startX = w / 2 - gap

  const tag = (o: any) => { o.__menuCard = true }
  tag(overlay); tag(title)

  upgrades.forEach((upgrade: any, i: number) => {
    const cx = startX + i * gap
    const cy = h / 2

    const u = upgrade as any
    const isWeapon    = !!u.isWeaponUpgrade
    const isNewWeapon = !!u.isNewWeapon
    const idleColor   = isNewWeapon ? 0x1f1a0a : isWeapon ? 0x1a1f2e : 0x16161e
    const hoverColor  = isNewWeapon ? 0x2e2210 : isWeapon ? 0x1e2a40 : 0x2a2a3e
    const idleBorder  = isNewWeapon ? 0xd97706 : isWeapon ? 0x3b82f6 : 0x3a3a5a
    const hoverBorder = isNewWeapon ? 0xfbbf24 : isWeapon ? 0x60a5fa : 0xfbbf24

    const bg = scene.add.graphics().setScrollFactor(0).setDepth(41)
    const draw = (hover: boolean) => {
      bg.clear()
      bg.fillStyle(hover ? hoverColor : idleColor)
      bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10)
      bg.lineStyle(hover || isWeapon || isNewWeapon ? 2 : 1, hover ? hoverBorder : idleBorder)
      bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10)
    }
    draw(false)

    const iconKey = (upgrade as any).icon as string | undefined
    const iconImg = scene.add.image(cx, cy - 43, iconKey ?? 'ico_damage')
      .setDisplaySize(24, 24).setScrollFactor(0).setDepth(42)
    tag(iconImg)

    const nameColor = isNewWeapon ? '#fcd34d' : isWeapon ? '#93c5fd' : '#ffffff'
    const nameText = scene.add.text(cx, cy - 20, upgrade.name, {
      fontSize: '15px', color: nameColor, stroke: '#000', strokeThickness: 2,
      align: 'center', wordWrap: { width: cardW - 16 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(42)

    const descColor = isNewWeapon ? '#fde68a' : isWeapon ? '#bfdbfe' : '#aaaacc'
    const descText = scene.add.text(cx, cy + 22, upgrade.desc, {
      fontSize: '12px', color: descColor,
      align: 'center', wordWrap: { width: cardW - 16 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(42)

    const zone = scene.add.zone(cx, cy, cardW, cardH)
      .setScrollFactor(0).setDepth(43).setInteractive({ useHandCursor: true })

    zone.on('pointerover', () => draw(true))
    zone.on('pointerout', () => draw(false))
    zone.on('pointerdown', () => {
      upgrade.apply()
      scene.children.list.filter((o: any) => o.__menuCard).forEach((o: any) => o.destroy())
      scene.levelUpPending = false
      scene.physics.world.resume()
    })

    tag(bg); tag(nameText); tag(descText); tag(zone)
  })

  scene.addStatsPanel((o: any) => tag(o))
}

export function pullOrbs(scene: IGameScene) {
  for (const o of scene.xpOrbs.getChildren() as any[]) {
    const dist = Math.sqrt((scene.player.x - o.x) ** 2 + (scene.player.y - o.y) ** 2)
    const angle = Math.atan2(scene.player.y - o.y, scene.player.x - o.x)
    if (o.getData('vacuumed')) {
      o.setVelocity(Math.cos(angle) * 520, Math.sin(angle) * 520)
    } else if (dist < scene.magnetRadius) {
      o.setVelocity(Math.cos(angle) * (120 + (scene.magnetRadius - dist) * 3),
                    Math.sin(angle) * (120 + (scene.magnetRadius - dist) * 3))
    } else {
      o.setVelocity(0, 0)
    }
  }
}

export function unlockWeapon(scene: IGameScene, wt: WeaponType) {
  scene.weapons.push(wt)
  scene.weaponLevels[wt]     = 1
  scene.weaponShootRates[wt] = WEAPON_BASE[wt].shootRate
  scene.weaponBulletSpd[wt]  = WEAPON_BASE[wt].bulletSpd
  scene.weaponCooldowns[wt]  = 0
  scene.weaponRearShot[wt]   = false
  scene.rebuildWeaponHUDTexts()
}
