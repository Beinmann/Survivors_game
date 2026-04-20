import { IGameScene } from './_sceneInterface'
import { WeaponType } from './_types'
import { MAPS } from './_maps'

export function showTitleScreen(scene: IGameScene) {
  const { width: w, height: h } = scene.cameras.main
  const ui: any[] = []

  const overlay = scene.add.graphics().setScrollFactor(0).setDepth(50)
  overlay.fillStyle(0x000000, 0.96).fillRect(0, 0, w, h)
  ui.push(overlay)

  const title = scene.add.text(w / 2, h / 2 - 110, 'SURVIVORS', {
    fontSize: '52px', color: '#4ade80', stroke: '#000000', strokeThickness: 6,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51)
  ui.push(title)
  scene.tweens.add({
    targets: title, scaleX: 1.04, scaleY: 1.04,
    duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  })

  ui.push(scene.add.text(w / 2, h / 2 - 58, 'a browser game', {
    fontSize: '14px', color: '#6b7280',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

  const btn = scene.add.text(w / 2, h / 2 + 20, '[ START ]', {
    fontSize: '24px', color: '#4ade80', stroke: '#000000', strokeThickness: 3,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true })
  ui.push(btn)

  ui.push(scene.add.text(w / 2, h / 2 + 50, 'or press Space', {
    fontSize: '12px', color: '#4b5563',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

  ui.push(scene.add.text(w / 2, h / 2 + 95, '⚠ Photosensitivity warning', {
    fontSize: '13px', color: '#f59e0b', fontStyle: 'bold',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

  ui.push(scene.add.text(w / 2, h / 2 + 114, 'Contains flashing lights and rapidly changing visuals.', {
    fontSize: '11px', color: '#d1d5db',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

  ui.push(scene.add.text(w / 2, h / 2 + 130, 'Play with caution if photosensitive.', {
    fontSize: '11px', color: '#d1d5db',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

  const dismiss = () => {
    scene.input.keyboard?.off('keydown-SPACE', dismiss)
    ui.forEach(o => o.destroy())
    scene.showModeSelection()
  }

  btn.on('pointerover', () => btn.setColor('#86efac'))
  btn.on('pointerout', () => btn.setColor('#4ade80'))
  btn.on('pointerdown', dismiss)
  scene.input.keyboard?.on('keydown-SPACE', dismiss)
}

export function showModeSelection(scene: IGameScene) {
  const { width: w, height: h } = scene.cameras.main
  const ui: any[] = []

  const overlay = scene.add.graphics().setScrollFactor(0).setDepth(50)
  overlay.fillStyle(0x000000, 0.92).fillRect(0, 0, w, h)
  ui.push(overlay)

  ui.push(scene.add.text(w / 2, h / 2 - 145, 'Choose your mode', {
    fontSize: '28px', color: '#ffffff', stroke: '#000', strokeThickness: 4,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

  const OPTIONS = [
    {
      mode: false,
      name: 'Normal',
      desc: 'Collect up to 3 weapons\nas you level up.',
      accent: 0x4ade80,
    },
    {
      mode: true,
      name: 'One Weapon',
      desc: 'Pick any weapon to master.\nNo new weapons — only upgrades.',
      accent: 0xf97316,
    },
  ]

  const cardW = 200, cardH = 180
  const gap = 230
  const startX = w / 2 - gap / 2

  OPTIONS.forEach((opt, i) => {
    const cx = startX + i * gap
    const cy = h / 2 + 20

    const bg = scene.add.graphics().setScrollFactor(0).setDepth(51)
    const draw = (hover: boolean) => {
      bg.clear()
      bg.fillStyle(hover ? 0x1e1e30 : 0x111118)
      bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12)
      bg.lineStyle(hover ? 3 : 2, hover ? opt.accent : 0x2a2a3a)
      bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12)
    }
    draw(false)

    const nameText = scene.add.text(cx, cy - 40, opt.name, {
      fontSize: '24px', color: `#${opt.accent.toString(16).padStart(6, '0')}`,
      stroke: '#000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

    const descText = scene.add.text(cx, cy + 22, opt.desc, {
      fontSize: '13px', color: '#ccccdd',
      align: 'center', wordWrap: { width: cardW - 24 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

    const zone = scene.add.zone(cx, cy, cardW, cardH)
      .setScrollFactor(0).setDepth(53).setInteractive({ useHandCursor: true })

    zone.on('pointerover', () => draw(true))
    zone.on('pointerout', () => draw(false))
    zone.on('pointerdown', () => {
      scene.oneWeaponMode = opt.mode
      ui.forEach(o => o.destroy())
      scene.showMapSelection()
    })

    ui.push(bg, nameText, descText, zone)
  })
}

export function showMapSelection(scene: IGameScene) {
  const { width: w, height: h } = scene.cameras.main
  const ui: any[] = []

  const overlay = scene.add.graphics().setScrollFactor(0).setDepth(50)
  overlay.fillStyle(0x000000, 0.92).fillRect(0, 0, w, h)
  ui.push(overlay)

  ui.push(scene.add.text(w / 2, 38, 'Choose your map', {
    fontSize: '28px', color: '#ffffff', stroke: '#000', strokeThickness: 4,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

  const cardW = 200, cardH = 156
  const hGap = 220, vGap = 176
  const startX = w / 2 - hGap / 2
  const startY = h / 2 - vGap / 2 + 20

  MAPS.forEach((map, i) => {
    const cx = startX + (i % 2) * hGap
    const cy = startY + Math.floor(i / 2) * vGap

    const bg = scene.add.graphics().setScrollFactor(0).setDepth(51)
    const draw = (hover: boolean) => {
      bg.clear()
      bg.fillStyle(hover ? 0x1e1e30 : 0x111118)
      bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12)
      bg.lineStyle(hover ? 3 : 2, hover ? map.accent : 0x2a2a3a)
      bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12)
    }
    draw(false)

    const nameText = scene.add.text(cx, cy - 44, map.name, {
      fontSize: '18px', color: `#${map.accent.toString(16).padStart(6, '0')}`,
      stroke: '#000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

    const descText = scene.add.text(cx, cy + 4, map.desc, {
      fontSize: '12px', color: '#ccccdd',
      align: 'center', wordWrap: { width: cardW - 24 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

    const flavorText = scene.add.text(cx, cy + 54, map.flavor, {
      fontSize: '11px', color: '#6b7280',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

    const zone = scene.add.zone(cx, cy, cardW, cardH)
      .setScrollFactor(0).setDepth(53).setInteractive({ useHandCursor: true })

    zone.on('pointerover', () => draw(true))
    zone.on('pointerout', () => draw(false))
    zone.on('pointerdown', () => {
      scene.selectedMap = map.key
      ui.forEach(o => o.destroy())
      scene.showWeaponSelection()
    })

    ui.push(bg, nameText, descText, flavorText, zone)
  })
}

export function showWeaponSelection(scene: IGameScene) {
  const { width: w, height: h } = scene.cameras.main
  const ALL_WEAPONS: { type: WeaponType; name: string; desc: string; stats: string; accent: number }[] = [
    {
      type: 'shotgun', name: 'Shotgun',
      desc: 'Fires a cone of pellets.\nDeadly up close, useless at range.',
      stats: '6 pellets · 550ms cooldown',
      accent: 0xf97316,
    },
    {
      type: 'sniper', name: 'Sniper Rifle',
      desc: 'Single piercing shot.\nSlower but punches through enemies.',
      stats: 'Pierces 2 enemies · 1400ms cooldown',
      accent: 0x60a5fa,
    },
    {
      type: 'aura', name: 'Shock Aura',
      desc: 'Electric pulse in all directions.\nSlow to kill but fully omnidirectional.',
      stats: '110px radius · 500ms pulse',
      accent: 0xa78bfa,
    },
    {
      type: 'machinegun', name: 'Machine Gun',
      desc: 'Rapid single shots.\nBuilds into a multi-barrel onslaught.',
      stats: '200ms cooldown · High fire rate',
      accent: 0x4ade80,
    },
    {
      type: 'scythes', name: 'Spectral Scythes',
      desc: 'Spectral blades orbit you.\nContinuous protection from nearby foes.',
      stats: 'Melee range · Always active',
      accent: 0x94a3b8,
    },
    {
      type: 'tesla', name: 'Tesla Chain',
      desc: 'Chain lightning strikes.\nJumps between multiple enemies.',
      stats: 'Jumps 2 targets · 800ms cooldown',
      accent: 0xbfdbfe,
    },
    {
      type: 'boomerang', name: 'Ricochet Boomerang',
      desc: 'Returning projectile.\nHits enemies on its way back.',
      stats: 'Piercing · 1000ms cooldown',
      accent: 0xf87171,
    },
    {
      type: 'rocket', name: 'Homing Rockets',
      desc: 'Homing missiles.\nExplodes on impact for area damage.',
      stats: 'Homing · 1500ms cooldown',
      accent: 0x64748b,
    },
    {
      type: 'trail', name: 'Incendiary Trail',
      desc: 'Leaves a burning path.\nDamages enemies who walk into it.',
      stats: 'Lasts 2s · 400ms tick',
      accent: 0xfb923c,
    },
  ]

  const overlay = scene.add.graphics().setScrollFactor(0).setDepth(50)
  overlay.fillStyle(0x000000, 0.9).fillRect(0, 0, w, h)

  const allUI: any[] = [overlay]

  const pick = (weapon: typeof ALL_WEAPONS[0]) => {
    scene.unlockWeapon(weapon.type)
    allUI.forEach(o => o.destroy())
    scene.spawnWave()
  }

  if (scene.oneWeaponMode) {
    allUI.push(scene.add.text(w / 2, 32, 'One Weapon Mode — Choose your weapon', {
      fontSize: '22px', color: '#f97316', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

    const cardW = 178, cardH = 126
    const colGap = 200, rowGap = 140
    const startX = w / 2 - colGap
    const startY = 112

    ALL_WEAPONS.forEach((weapon, i) => {
      const cx = startX + (i % 3) * colGap
      const cy = startY + Math.floor(i / 3) * rowGap

      const bg = scene.add.graphics().setScrollFactor(0).setDepth(51)
      const draw = (hover: boolean) => {
        bg.clear()
        bg.fillStyle(hover ? 0x1e1e30 : 0x111118)
        bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10)
        bg.lineStyle(hover ? 3 : 2, hover ? weapon.accent : 0x2a2a3a)
        bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10)
      }
      draw(false)

      const nameText = scene.add.text(cx, cy - 28, weapon.name, {
        fontSize: '14px', color: '#ffffff', stroke: '#000', strokeThickness: 2,
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(52)

      const icon = scene.add.image(cx, cy + 18, `wico_${weapon.type}`)
        .setScrollFactor(0).setDepth(52).setDisplaySize(40, 40)

      const zone = scene.add.zone(cx, cy, cardW, cardH)
        .setScrollFactor(0).setDepth(53).setInteractive({ useHandCursor: true })

      zone.on('pointerover', () => draw(true))
      zone.on('pointerout', () => draw(false))
      zone.on('pointerdown', () => pick(weapon))

      allUI.push(bg, nameText, icon, zone)
    })
  } else {
    const selected = ALL_WEAPONS.sort(() => 0.5 - Math.random()).slice(0, 3)

    allUI.push(scene.add.text(w / 2, h / 2 - 175, 'Choose your starting weapon', {
      fontSize: '28px', color: '#ffffff', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

    const cardW = 180, cardH = 240, gap = 200
    const startX = w / 2 - gap

    selected.forEach((weapon, i) => {
      const cx = startX + i * gap
      const cy = h / 2 + 25

      const bg = scene.add.graphics().setScrollFactor(0).setDepth(51)
      const draw = (hover: boolean) => {
        bg.clear()
        bg.fillStyle(hover ? 0x1e1e30 : 0x111118)
        bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12)
        bg.lineStyle(hover ? 3 : 2, hover ? weapon.accent : 0x2a2a3a)
        bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12)
      }
      draw(false)

      const icon = scene.add.image(cx, cy - 70, `wico_${weapon.type}`)
        .setScrollFactor(0).setDepth(52).setDisplaySize(48, 48)

      const nameText = scene.add.text(cx, cy - 25, weapon.name, {
        fontSize: '18px', color: '#ffffff', stroke: '#000', strokeThickness: 2,
        align: 'center', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

      const descText = scene.add.text(cx, cy + 30, weapon.desc, {
        fontSize: '13px', color: '#ccccdd',
        align: 'center', wordWrap: { width: cardW - 20 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

      const statsText = scene.add.text(cx, cy + 95, weapon.stats, {
        fontSize: '11px', color: `#${weapon.accent.toString(16).padStart(6, '0')}`,
        align: 'center', wordWrap: { width: cardW - 20 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

      const zone = scene.add.zone(cx, cy, cardW, cardH)
        .setScrollFactor(0).setDepth(53).setInteractive({ useHandCursor: true })

      zone.on('pointerover', () => draw(true))
      zone.on('pointerout', () => draw(false))
      zone.on('pointerdown', () => pick(weapon))

      allUI.push(bg, icon, nameText, descText, statsText, zone)
    })
  }
}

export function showGameOver(scene: IGameScene) {
  scene.dead = true
  scene.player.setVelocity(0, 0)
  for (const e of scene.enemies.getChildren())
    (e as any).setVelocity(0, 0)

  const { width: w, height: h } = scene.cameras.main
  scene.add.graphics().setScrollFactor(0).setDepth(30)
    .fillStyle(0x000000, 0.65).fillRect(0, 0, w, h)

  scene.add.text(w / 2, h / 2 - 60, 'GAME OVER', {
    fontSize: '36px', color: '#ef4444', stroke: '#000', strokeThickness: 5,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(31)

  const t = Math.floor(scene.gameTime / 1000)
  const timeStr = `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`
  scene.add.text(w / 2, h / 2 - 10, `Score: ${scene.score}  ·  Time: ${timeStr}`, {
    fontSize: '18px', color: '#ffffff', stroke: '#000', strokeThickness: 3,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(31)

  const btn = scene.add.text(w / 2, h / 2 + 50, '[ Restart ]', {
    fontSize: '22px', color: '#4ade80', stroke: '#000', strokeThickness: 3,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(31).setInteractive({ useHandCursor: true })

  btn.on('pointerover', () => btn.setColor('#86efac'))
  btn.on('pointerout', () => btn.setColor('#4ade80'))
  btn.on('pointerdown', () => scene.scene.restart())
}
