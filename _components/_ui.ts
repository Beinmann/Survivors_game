import { IGameScene } from './_sceneInterface'
import { WeaponType, PassiveType, WEAPON_BASE, WEAPON_NAMES, PASSIVE_DATA } from './_types'

export function drawUI(scene: IGameScene) {
  const barW = 160
  if (scene.hp !== scene._lastHp || scene.maxHp !== scene._lastMaxHp) {
    scene.hpBar.clear()
    scene.hpBar.fillStyle(0x1a1a1a).fillRect(10, 50, barW, 10)
    scene.hpBar.fillStyle(0xef4444).fillRect(10, 50, barW * (scene.hp / scene.maxHp), 10)
    scene._lastHp = scene.hp
    scene._lastMaxHp = scene.maxHp
  }
  if (scene.xp !== scene._lastXp || scene.xpNeeded !== scene._lastXpNeeded) {
    scene.xpBar.clear()
    scene.xpBar.fillStyle(0x1a1a1a).fillRect(10, 64, barW, 6)
    scene.xpBar.fillStyle(0xa78bfa).fillRect(10, 64, barW * (scene.xp / scene.xpNeeded), 6)
    scene._lastXp = scene.xp
    scene._lastXpNeeded = scene.xpNeeded
  }
  if (scene.hudDirty) scene.drawWeaponHUD()
  const effects: string[] = []
  if (scene.frenzyTimer > 0) effects.push(`⚡ FRENZY ${(scene.frenzyTimer / 1000).toFixed(1)}s`)
  if (scene.freezeTimer > 0) effects.push(`❄ FREEZE ${(scene.freezeTimer / 1000).toFixed(1)}s`)
  const effectStr = effects.join('   ')
  if (effectStr !== scene._lastEffectStr) {
    scene.effectText.setText(effectStr)
    scene._lastEffectStr = effectStr
  }
}

export function drawWeaponHUD(scene: IGameScene) {
  const slotW = 44, slotH = 44, gap = 4, sx = 10, sy = 74
  scene.weaponHUDGfx.clear()
  for (let i = 0; i < 3; i++) {
    const x = sx + i * (slotW + gap)
    const wt = scene.weapons[i] as WeaponType | undefined
    const locked = scene.oneWeaponMode && i > 0
    scene.weaponHUDGfx.fillStyle(locked ? 0x0d0808 : wt ? 0x161624 : 0x0d0d14)
    scene.weaponHUDGfx.fillRoundedRect(x, sy, slotW, slotH, 5)
    scene.weaponHUDGfx.lineStyle(1, locked ? 0x3a1a1a : wt ? 0x4a4a8a : 0x222236)
    scene.weaponHUDGfx.strokeRoundedRect(x, sy, slotW, slotH, 5)
    if (locked) {
      scene.weaponHUDGfx.lineStyle(1.5, 0x7f1d1d)
      scene.weaponHUDGfx.lineBetween(x + 7, sy + 7, x + slotW - 7, sy + slotH - 7)
      scene.weaponHUDGfx.lineBetween(x + slotW - 7, sy + 7, x + 7, sy + slotH - 7)
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
  scene.hudDirty = false
}

export function drawWeaponIcon(scene: IGameScene, cx: number, cy: number, wt: WeaponType) {
  // Manual drawing replaced by persistent images in rebuildWeaponHUDTexts
}

export function buildStatLines(scene: IGameScene) {
  const lines: { label: string; value: string; icon?: string }[] = []
  for (const wt of scene.weapons) {
    const rate = (1000 / (scene.weaponShootRates[wt] ?? WEAPON_BASE[wt].shootRate)).toFixed(1)
    const lvl  = scene.weaponLevels[wt] ?? 1
    lines.push({ label: `── ${WEAPON_NAMES[wt]}`, value: `Lv${lvl}`, icon: 'ico_level' })
    lines.push({ label: 'Fire Rate', value: `${rate}/s`, icon: 'ico_cooldown' })

    const baseDmg = WEAPON_BASE[wt].damage
    const wBonus = scene.bonusWeaponDmg[wt] ?? 0
    const dmgValue = scene.showBaseStats
      ? Math.round(baseDmg * (1 + wBonus))
      : Math.round(baseDmg * (1 + scene.bonusDamage + wBonus))

    if (wt === 'shotgun') {
      lines.push(
        { label: 'Pellets', value: String(6 + scene.extraBullets), icon: 'ico_pellets' },
        { label: 'Range',   value: String(scene.shotgunRange),      icon: 'ico_range' },
        { label: 'Damage',  value: String(dmgValue),                icon: 'ico_damage' },
      )
    } else if (wt === 'sniper') {
      lines.push(
        { label: 'Pierce',    value: String(scene.pierceCount),                      icon: 'ico_pierce' },
        { label: 'Blt Speed', value: String(scene.weaponBulletSpd['sniper'] ?? 680), icon: 'ico_bulletspeed' },
        { label: 'Damage',    value: String(dmgValue),                        icon: 'ico_damage' },
      )
    } else if (wt === 'aura') {
      lines.push(
        { label: 'Radius', value: String(Math.round(scene.auraRadius * (1 + scene.bonusArea))), icon: 'ico_radius' },
        { label: 'Damage', value: String(dmgValue),    icon: 'ico_damage' },
      )
    } else if (wt === 'machinegun') {
      lines.push(
        { label: 'Burst',  value: String(scene.machineGunBurst), icon: 'ico_burst' },
        { label: 'Pierce', value: scene.machineGunPierce ? 'Yes' : 'No', icon: 'ico_pierce' },
        { label: 'Damage', value: String(dmgValue),              icon: 'ico_damage' },
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
    { label: 'Dmg Boost',  value: `+${Math.round(scene.bonusDamage * 100)}%`,    icon: 'ico_damage' },
    { label: 'Fire Rate',  value: `+${Math.round(scene.bonusCooldown * 100)}%`, icon: 'ico_cooldown' },
    { label: 'Area Boost', value: `+${Math.round(scene.bonusArea * 100)}%`,     icon: 'ico_area' },
    { label: 'XP Boost',   value: `+${Math.round((scene.orbMultiplier - 1) * 100)}%`, icon: 'ico_orbmult' },
    { label: 'Magnet',     value: String(scene.magnetRadius),     icon: 'ico_magnet' },
    { label: 'Orb ×',      value: scene.orbMultiplier.toFixed(2), icon: 'ico_orbmult' },
  )
  return lines
}

export function addStatsPanel(scene: IGameScene, collect: (o: any) => void) {
  const container: any[] = []

  const draw = () => {
    container.forEach(o => o.destroy())
    container.length = 0

    const { width: w, height: h } = scene.cameras.main
    const lines = scene.buildStatLines()
    const panelW = 175
    const rowH = 17
    const toggleH = 22
    const panelH = 26 + toggleH + lines.length * rowH + 8
    const px = w - panelW - 14
    const py = h - panelH - 14

    const bg = scene.add.graphics().setScrollFactor(0).setDepth(46)
    bg.fillStyle(0x080810, 0.88)
    bg.fillRoundedRect(px, py, panelW, panelH, 6)
    bg.lineStyle(1, 0x3a3a5a, 1)
    bg.strokeRoundedRect(px, py, panelW, panelH, 6)
    container.push(bg); collect(bg)

    const title = scene.add.text(px + panelW / 2, py + 8, 'STATS', {
      fontSize: '11px', color: '#fbbf24',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(47)
    container.push(title); collect(title)

    // Toggle row
    const ty = py + 26
    const toggleLabel = scene.add.text(px + 12, ty, 'Show Base Stats', {
      fontSize: '10px', color: '#9ca3af',
    }).setScrollFactor(0).setDepth(47)
    container.push(toggleLabel); collect(toggleLabel)

    const checkbox = scene.add.graphics().setScrollFactor(0).setDepth(47)
    checkbox.lineStyle(1, 0x4b5563)
    checkbox.strokeRect(px + panelW - 24, ty - 1, 14, 14)
    if (scene.showBaseStats) {
      checkbox.fillStyle(0xfbbf24)
      checkbox.fillRect(px + panelW - 21, ty + 2, 8, 8)
    }
    container.push(checkbox); collect(checkbox)

    const toggleZone = scene.add.zone(px, ty - 4, panelW, 20)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(48).setInteractive({ useHandCursor: true })
    toggleZone.on('pointerdown', () => {
      scene.showBaseStats = !scene.showBaseStats
      draw()
    })
    container.push(toggleZone); collect(toggleZone)

    lines.forEach(({ label, value, icon }, i) => {
      const y = py + 24 + toggleH + i * rowH
      if (icon) {
        const img = scene.add.image(px + 16, y + 6, icon)
          .setDisplaySize(12, 12).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(47)
        container.push(img); collect(img)
      }
      const labelTxt = scene.add.text(px + 26, y, label, {
        fontSize: '11px', color: '#9ca3af',
      }).setScrollFactor(0).setDepth(47)
      container.push(labelTxt); collect(labelTxt)

      const valTxt = scene.add.text(px + panelW - 10, y, value, {
        fontSize: '11px', color: '#e5e7eb',
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(47)
      container.push(valTxt); collect(valTxt)
    })
  }

  draw()
}

export function rebuildWeaponHUDTexts(scene: IGameScene) {
  scene.weaponHUDLvlTexts.forEach(t => t.destroy())
  if (scene.weaponHUDIcons) scene.weaponHUDIcons.forEach(i => i.destroy())
  scene.passiveHUDLvlTexts.forEach(t => t.destroy())
  scene.passiveHUDIcons.forEach(i => i.destroy())
  
  const slotW = 44, slotH = 44, gap = 4, sx = 10, sy = 74
  
  scene.weaponHUDIcons = scene.weapons.map((wt, i) =>
    scene.add.image(sx + i * (slotW + gap) + slotW / 2, sy + slotH / 2 - 5, `wico_${wt}`)
      .setDisplaySize(28, 28).setScrollFactor(0).setDepth(21)
  )

  scene.weaponHUDLvlTexts = scene.weapons.map((_, i) =>
    scene.add.text(sx + i * (slotW + gap) + slotW / 2, sy + slotH, '', {
      fontSize: '9px', color: '#a0a0c0',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(21)
  )

  const psy = sy + slotH + 18
  scene.passiveHUDLvlTexts = scene.passives.map((_, i) =>
    scene.add.text(sx + i * (slotW + gap) + slotW / 2, psy + slotH, '', {
      fontSize: '9px', color: '#a0c0a0',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(21)
  )
  scene.passiveHUDIcons = scene.passives.map((pt, i) =>
    scene.add.image(sx + i * (slotW + gap) + slotW / 2, psy + slotH / 2, PASSIVE_DATA[pt].icon)
      .setDisplaySize(20, 20).setScrollFactor(0).setDepth(21)
  )
  scene.hudDirty = true
}
