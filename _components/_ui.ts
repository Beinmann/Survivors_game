import { IGameScene } from './_sceneInterface'
import { WeaponType, PassiveType, WEAPON_BASE, WEAPON_NAMES, PASSIVE_DATA } from './_types'

export function drawUI(scene: IGameScene) {
  const barW = 160
  scene.hpBar.clear()
  scene.hpBar.fillStyle(0x1a1a1a).fillRect(10, 50, barW, 10)
  scene.hpBar.fillStyle(0xef4444).fillRect(10, 50, barW * (scene.hp / scene.maxHp), 10)
  scene.xpBar.clear()
  scene.xpBar.fillStyle(0x1a1a1a).fillRect(10, 64, barW, 6)
  scene.xpBar.fillStyle(0xa78bfa).fillRect(10, 64, barW * (scene.xp / scene.xpNeeded), 6)
  scene.drawWeaponHUD()
  const effects: string[] = []
  if (scene.frenzyTimer > 0) effects.push(`⚡ FRENZY ${(scene.frenzyTimer / 1000).toFixed(1)}s`)
  if (scene.freezeTimer > 0) effects.push(`❄ FREEZE ${(scene.freezeTimer / 1000).toFixed(1)}s`)
  scene.effectText.setText(effects.join('   '))
}

export function drawWeaponHUD(scene: IGameScene) {
  const slotW = 44, slotH = 44, gap = 4, sx = 10, sy = 74
  scene.weaponHUDGfx.clear()
  for (let i = 0; i < 3; i++) {
    const x = sx + i * (slotW + gap)
    const wt = scene.weapons[i] as WeaponType | undefined
    scene.weaponHUDGfx.fillStyle(wt ? 0x161624 : 0x0d0d14)
    scene.weaponHUDGfx.fillRoundedRect(x, sy, slotW, slotH, 5)
    scene.weaponHUDGfx.lineStyle(1, wt ? 0x4a4a8a : 0x222236)
    scene.weaponHUDGfx.strokeRoundedRect(x, sy, slotW, slotH, 5)
    if (wt) {
      scene.drawWeaponIcon(x + slotW / 2, sy + slotH / 2 - 5, wt)
    }
  }
  scene.weapons.forEach((wt, i) => {
    if (scene.weaponHUDLvlTexts[i]) {
      scene.weaponHUDLvlTexts[i].setText(`Lv${scene.weaponLevels[wt] ?? 1}`)
    }
  })

  const psy = sy + slotH + 18
  for (let i = 0; i < 3; i++) {
    const x = sx + i * (slotW + gap)
    const pt = scene.passives[i]
    scene.weaponHUDGfx.fillStyle(pt ? 0x162416 : 0x0d0d0d)
    scene.weaponHUDGfx.fillRoundedRect(x, psy, slotW, slotH, 5)
    scene.weaponHUDGfx.lineStyle(1, pt ? 0x4a8a4a : 0x223622)
    scene.weaponHUDGfx.strokeRoundedRect(x, psy, slotW, slotH, 5)
  }
  scene.passives.forEach((pt, i) => {
    if (scene.passiveHUDLvlTexts[i]) {
      scene.passiveHUDLvlTexts[i].setText(`Lv${scene.passiveLevels[pt] ?? 1}`)
    }
  })
}

export function drawWeaponIcon(scene: IGameScene, cx: number, cy: number, wt: WeaponType) {
  const g = scene.weaponHUDGfx
  if (wt === 'shotgun') {
    g.lineStyle(1.5, 0xf97316)
    const spread = Math.PI / 3
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 - spread / 2 + (i / 4) * spread
      g.lineBetween(cx, cy + 6, cx + Math.cos(a) * 14, cy + Math.sin(a) * 14 + 6)
    }
    g.fillStyle(0xf97316).fillRect(cx - 2, cy + 1, 4, 6)
  } else if (wt === 'sniper') {
    g.lineStyle(1.5, 0x60a5fa)
    g.strokeCircle(cx, cy, 10)
    g.lineBetween(cx - 15, cy, cx - 12, cy)
    g.lineBetween(cx + 12, cy, cx + 15, cy)
    g.lineBetween(cx, cy - 15, cx, cy - 12)
    g.lineBetween(cx, cy + 12, cx, cy + 15)
    g.fillStyle(0x60a5fa).fillCircle(cx, cy, 2)
  } else if (wt === 'aura') {
    g.lineStyle(1.5, 0xa78bfa)
    g.strokeCircle(cx, cy, 9)
    g.lineStyle(1, 0xa78bfa, 0.45)
    g.strokeCircle(cx, cy, 15)
    g.fillStyle(0xa78bfa).fillCircle(cx, cy, 2)
  } else if (wt === 'machinegun') {
    g.fillStyle(0x4ade80).fillRect(cx - 3, cy - 10, 6, 18)
    g.fillStyle(0x1e5c30).fillRect(cx - 5, cy - 1, 10, 4)
    g.lineStyle(1, 0x4ade80)
    for (let i = 0; i < 3; i++) g.lineBetween(cx - 8, cy - 8 + i * 5, cx - 5, cy - 8 + i * 5)
  }
}

export function buildStatLines(scene: IGameScene) {
  const lines: { label: string; value: string; icon?: string }[] = []
  for (const wt of scene.weapons) {
    const rate = (1000 / (scene.weaponShootRates[wt] ?? WEAPON_BASE[wt].shootRate)).toFixed(1)
    const lvl  = scene.weaponLevels[wt] ?? 1
    const rear = scene.weaponRearShot[wt] ?? false
    lines.push({ label: `── ${WEAPON_NAMES[wt]}`, value: `Lv${lvl}`, icon: 'ico_level' })
    lines.push({ label: 'Fire Rate', value: `${rate}/s`, icon: 'ico_cooldown' })
    if (wt === 'shotgun') {
      lines.push(
        { label: 'Pellets', value: String(6 + scene.extraBullets), icon: 'ico_pellets' },
        { label: 'Range',   value: String(scene.shotgunRange),      icon: 'ico_range' },
        { label: 'Damage',  value: String(scene.shotgunDmg),        icon: 'ico_damage' },
        { label: 'Rear',    value: rear ? 'Yes' : 'No',            icon: 'ico_rearshot' },
      )
    } else if (wt === 'sniper') {
      lines.push(
        { label: 'Pierce',    value: String(scene.pierceCount),                      icon: 'ico_pierce' },
        { label: 'Blt Speed', value: String(scene.weaponBulletSpd['sniper'] ?? 680), icon: 'ico_bulletspeed' },
        { label: 'Damage',    value: String(scene.sniperDmg),                        icon: 'ico_damage' },
        { label: 'Rear',      value: rear ? 'Yes' : 'No',                           icon: 'ico_rearshot' },
      )
    } else if (wt === 'aura') {
      lines.push(
        { label: 'Radius', value: String(scene.auraRadius), icon: 'ico_radius' },
        { label: 'Damage', value: String(scene.auraDmg),    icon: 'ico_damage' },
      )
    } else if (wt === 'machinegun') {
      lines.push(
        { label: 'Burst',  value: String(scene.machineGunBurst) + (rear ? '+rear' : ''), icon: 'ico_burst' },
        { label: 'Pierce', value: scene.machineGunPierce ? 'Yes' : 'No',                 icon: 'ico_pierce' },
        { label: 'Damage', value: String(scene.machineGunDmg),                           icon: 'ico_damage' },
      )
    }
  }
  lines.push({ label: '── Passive', value: '' })
  for (const pt of scene.passives) {
    const data = PASSIVE_DATA[pt]
    lines.push({ label: data.name, value: `Lv${scene.passiveLevels[pt]}`, icon: data.icon })
  }
  lines.push(
    { label: 'HP',         value: `${scene.hp} / ${scene.maxHp}`, icon: 'ico_hp' },
    { label: 'Move Speed', value: String(scene.moveSpeed),        icon: 'ico_movespeed' },
    { label: 'Magnet',     value: String(scene.magnetRadius),     icon: 'ico_magnet' },
    { label: 'Orb ×',      value: scene.orbMultiplier.toFixed(2), icon: 'ico_orbmult' },
  )
  return lines
}

export function addStatsPanel(scene: IGameScene, collect: (o: any) => void) {
  const { width: w, height: h } = scene.cameras.main
  const lines = scene.buildStatLines()
  const panelW = 175
  const rowH = 17
  const panelH = 26 + lines.length * rowH + 8
  const px = w - panelW - 14
  const py = h - panelH - 14

  const bg = scene.add.graphics().setScrollFactor(0).setDepth(46)
  bg.fillStyle(0x080810, 0.88)
  bg.fillRoundedRect(px, py, panelW, panelH, 6)
  bg.lineStyle(1, 0x3a3a5a, 1)
  bg.strokeRoundedRect(px, py, panelW, panelH, 6)
  collect(bg)

  const title = scene.add.text(px + panelW / 2, py + 8, 'STATS', {
    fontSize: '11px', color: '#fbbf24',
  }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(47)
  collect(title)

  lines.forEach(({ label, value, icon }, i) => {
    const y = py + 24 + i * rowH
    if (icon) {
      collect(scene.add.image(px + 16, y + 6, icon)
        .setDisplaySize(12, 12).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(47))
    }
    collect(scene.add.text(px + 26, y, label, {
      fontSize: '11px', color: '#9ca3af',
    }).setScrollFactor(0).setDepth(47))
    collect(scene.add.text(px + panelW - 10, y, value, {
      fontSize: '11px', color: '#e5e7eb',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(47))
  })
}

export function rebuildWeaponHUDTexts(scene: IGameScene) {
  scene.weaponHUDLvlTexts.forEach(t => t.destroy())
  scene.passiveHUDLvlTexts.forEach(t => t.destroy())
  scene.passiveHUDIcons.forEach(i => i.destroy())
  const slotW = 44, gap = 4
  scene.weaponHUDLvlTexts = scene.weapons.map((_, i) =>
    scene.add.text(10 + i * (slotW + gap) + slotW / 2, 118 + 2, '', {
      fontSize: '9px', color: '#a0a0c0',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(21)
  )
  scene.passiveHUDLvlTexts = scene.passives.map((_, i) =>
    scene.add.text(10 + i * (slotW + gap) + slotW / 2, 118 + 18 + 44 + 2, '', {
      fontSize: '9px', color: '#a0c0a0',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(21)
  )
  scene.passiveHUDIcons = scene.passives.map((pt, i) =>
    scene.add.image(10 + i * (slotW + gap) + slotW / 2, 118 + 18 + 44 / 2, PASSIVE_DATA[pt].icon)
      .setDisplaySize(20, 20).setScrollFactor(0).setDepth(21)
  )
}
