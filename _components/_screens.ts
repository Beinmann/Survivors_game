import { IGameScene } from './_sceneInterface'
import { WeaponType } from './_types'
import { MAPS } from './_maps'
import {
  getCoins, awardCoins, spendCoins,
  isWeaponUnlocked, unlockWeaponMeta,
  isModeUnlocked, unlockMode,
  getWeaponCost, getModeCost,
} from './_persistence'

interface WeaponMeta {
  type: WeaponType
  name: string
  desc: string
  stats: string
  accent: number
}

const ALL_WEAPONS: WeaponMeta[] = [
  { type: 'shotgun',    name: 'Shotgun',
    desc: 'Fires a cone of pellets.\nDeadly up close, useless at range.',
    stats: '6 pellets · 550ms cooldown', accent: 0xf97316 },
  { type: 'sniper',     name: 'Sniper Rifle',
    desc: 'Single piercing shot.\nSlower but punches through enemies.',
    stats: 'Pierces 2 enemies · 1400ms cooldown', accent: 0x60a5fa },
  { type: 'aura',       name: 'Shock Aura',
    desc: 'Electric pulse in all directions.\nSlow to kill but fully omnidirectional.',
    stats: '110px radius · 500ms pulse', accent: 0xa78bfa },
  { type: 'machinegun', name: 'Machine Gun',
    desc: 'Rapid single shots.\nBuilds into a multi-barrel onslaught.',
    stats: '200ms cooldown · High fire rate', accent: 0x4ade80 },
  { type: 'scythes',    name: 'Spectral Scythes',
    desc: 'Spectral blades orbit you.\nContinuous protection from nearby foes.',
    stats: 'Melee range · Always active', accent: 0x94a3b8 },
  { type: 'tesla',      name: 'Tesla Chain',
    desc: 'Chain lightning strikes.\nJumps between multiple enemies.',
    stats: 'Jumps 2 targets · 800ms cooldown', accent: 0xbfdbfe },
  { type: 'boomerang',  name: 'Ricochet Boomerang',
    desc: 'Returning projectile.\nHits enemies on its way back.',
    stats: 'Piercing · 1000ms cooldown', accent: 0xf87171 },
  { type: 'rocket',     name: 'Homing Rockets',
    desc: 'Homing missiles.\nExplodes on impact for area damage.',
    stats: 'Homing · 1500ms cooldown', accent: 0x64748b },
  { type: 'trail',      name: 'Incendiary Trail',
    desc: 'Leaves a burning path.\nDamages enemies who walk into it.',
    stats: 'Lasts 2s · 400ms tick', accent: 0xfb923c },
  { type: 'laser',      name: 'Laser Beam',
    desc: 'Rapid pulses of light.\nPierces several enemies.',
    stats: 'Pierces 3 · 250ms pulse', accent: 0xfde047 },
  { type: 'turret',     name: 'Sentry Turret',
    desc: 'Drops a stationary sentry.\nFires for 8 seconds, then expires.',
    stats: '8s duration · 6s cooldown', accent: 0xfbbf24 },
  { type: 'orbital',    name: 'Orbital Strike',
    desc: 'Marks a target, strikes from above.\nHuge area damage with brief telegraph.',
    stats: '110px radius · 3.5s cooldown', accent: 0xef4444 },
  { type: 'blackhole',  name: 'Black Hole',
    desc: 'Pulls enemies together.\nCrushes grouped foes.',
    stats: '150px radius · 2.5s duration', accent: 0xa78bfa },
  { type: 'cryo',       name: 'Cryo Shards',
    desc: 'Spray of icy shards.\nSlows enemies on impact.',
    stats: '3 shards · 1.5s slow', accent: 0x22d3ee },
  { type: 'railgun',    name: 'Plasma Lance',
    desc: 'Charges then sustains a piercing beam.\nTicks damage across the screen.',
    stats: '35 dmg / tick · 1.5s charge · 900ms beam', accent: 0x60a5fa },
  { type: 'drones',     name: 'Swarm Drones',
    desc: 'Homing drones that chase a target.\nDeal contact damage to anything they pass.',
    stats: '1 drone · 8s target lock', accent: 0xd1d5db },
  { type: 'cleave',     name: 'Crescent Cleave',
    desc: 'Heavy melee sweep in a wide arc.\nLong cooldown, big burst.',
    stats: '80 dmg · 140° arc · 1800ms cooldown', accent: 0xfca5a5 },
]

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

  const btn = scene.add.text(w / 2, h / 2 + 10, '[ START ]', {
    fontSize: '24px', color: '#4ade80', stroke: '#000000', strokeThickness: 3,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true })
  ui.push(btn)

  ui.push(scene.add.text(w / 2, h / 2 + 38, 'or press Space', {
    fontSize: '12px', color: '#4b5563',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

  const shopBtn = scene.add.text(w / 2, h / 2 + 70, '[ SHOP ]', {
    fontSize: '20px', color: '#fde047', stroke: '#000000', strokeThickness: 3,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true })
  ui.push(shopBtn)

  ui.push(scene.add.text(w / 2, h / 2 + 94, `Coins: ${getCoins()}`, {
    fontSize: '12px', color: '#ca8a04',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

  ui.push(scene.add.text(w / 2, h / 2 + 130, '⚠ Photosensitivity warning', {
    fontSize: '13px', color: '#f59e0b', fontStyle: 'bold',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

  ui.push(scene.add.text(w / 2, h / 2 + 149, 'Contains flashing lights and rapidly changing visuals.', {
    fontSize: '11px', color: '#d1d5db',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

  ui.push(scene.add.text(w / 2, h / 2 + 165, 'Play with caution if photosensitive.', {
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

  shopBtn.on('pointerover', () => shopBtn.setColor('#fef08a'))
  shopBtn.on('pointerout', () => shopBtn.setColor('#fde047'))
  shopBtn.on('pointerdown', () => {
    scene.input.keyboard?.off('keydown-SPACE', dismiss)
    ui.forEach(o => o.destroy())
    scene.showShop()
  })
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
    const locked = opt.mode && !isModeUnlocked('oneWeapon')

    const bg = scene.add.graphics().setScrollFactor(0).setDepth(51)
    const draw = (hover: boolean) => {
      bg.clear()
      bg.fillStyle(hover && !locked ? 0x1e1e30 : 0x111118)
      bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12)
      const borderColor = locked ? 0x2a2a3a : (hover ? opt.accent : 0x2a2a3a)
      bg.lineStyle(hover && !locked ? 3 : 2, borderColor)
      bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12)
    }
    draw(false)

    const nameColor = locked ? '#6b7280' : `#${opt.accent.toString(16).padStart(6, '0')}`
    const nameText = scene.add.text(cx, cy - 40, opt.name, {
      fontSize: '24px', color: nameColor,
      stroke: '#000', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

    const descStr = locked
      ? `🔒 Locked\n${getModeCost('oneWeapon')} coins — visit Shop`
      : opt.desc
    const descText = scene.add.text(cx, cy + 22, descStr, {
      fontSize: '13px', color: locked ? '#9ca3af' : '#ccccdd',
      align: 'center', wordWrap: { width: cardW - 24 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

    const zone = scene.add.zone(cx, cy, cardW, cardH)
      .setScrollFactor(0).setDepth(53).setInteractive({ useHandCursor: true })

    zone.on('pointerover', () => draw(true))
    zone.on('pointerout', () => draw(false))
    zone.on('pointerdown', () => {
      ui.forEach(o => o.destroy())
      if (locked) {
        scene.showShop()
      } else {
        scene.oneWeaponMode = opt.mode
        scene.showMapSelection()
      }
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
  const unlocked = ALL_WEAPONS.filter(w => isWeaponUnlocked(w.type))
  const pool: WeaponMeta[] = unlocked.length > 0 ? unlocked : ALL_WEAPONS

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

    const cols = 4
    const cardW = 140, cardH = 100
    const colGap = 160, rowGap = 110
    const startX = w / 2 - colGap * (cols - 1) / 2
    const viewportTop = 62
    const viewportBottom = h - 8
    const viewportH = viewportBottom - viewportTop
    const startY = viewportTop + cardH / 2 + 6

    const container = (scene.add as any).container(0, 0).setScrollFactor(0).setDepth(51)
    allUI.push(container)

    const zones: any[] = []
    const cardCys: number[] = []

    pool.forEach((weapon, i) => {
      const cx = startX + (i % cols) * colGap
      const cy = startY + Math.floor(i / cols) * rowGap
      cardCys.push(cy)

      const bg = scene.add.graphics()
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
      }).setOrigin(0.5, 0.5)

      const icon = scene.add.image(cx, cy + 18, `wico_${weapon.type}`)
        .setDisplaySize(40, 40)

      const zone = scene.add.zone(cx, cy, cardW, cardH)
        .setInteractive({ useHandCursor: true })

      zone.on('pointerover', () => draw(true))
      zone.on('pointerout', () => draw(false))
      zone.on('pointerdown', () => pick(weapon))

      container.add([bg, nameText, icon, zone])
      zones.push(zone)
    })

    const maskG = scene.make.graphics({ x: 0, y: 0 })
    maskG.fillStyle(0xffffff).fillRect(0, viewportTop, w, viewportH)
    container.setMask(maskG.createGeometryMask())
    allUI.push(maskG)

    const rows = Math.ceil(pool.length / cols)
    const contentBottom = startY + (rows - 1) * rowGap + cardH / 2 + 6
    const maxScroll = Math.max(0, contentBottom - viewportBottom)
    let scrollY = 0

    const refreshZoneVisibility = () => {
      for (let i = 0; i < zones.length; i++) {
        const worldCy = cardCys[i] - scrollY
        const visible = worldCy + cardH / 2 > viewportTop && worldCy - cardH / 2 < viewportBottom
        if (zones[i].input) zones[i].input.enabled = visible
      }
    }

    const setScroll = (v: number) => {
      scrollY = Math.max(0, Math.min(maxScroll, v))
      container.y = -scrollY
      refreshZoneVisibility()
    }

    if (maxScroll > 0) {
      const hint = scene.add.text(w - 12, viewportTop + 4, '▲▼ scroll', {
        fontSize: '11px', color: '#6b7280',
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(52)
      allUI.push(hint)

      const wheelHandler = (_p: any, _objs: any, _dx: number, dy: number) => {
        setScroll(scrollY + dy * 0.5)
      }
      scene.input.on('wheel', wheelHandler)

      const kbd = scene.input.keyboard
      const onUp = () => setScroll(scrollY - rowGap)
      const onDown = () => setScroll(scrollY + rowGap)
      const onPgUp = () => setScroll(scrollY - viewportH)
      const onPgDown = () => setScroll(scrollY + viewportH)
      kbd?.on('keydown-UP', onUp)
      kbd?.on('keydown-DOWN', onDown)
      kbd?.on('keydown-PAGE_UP', onPgUp)
      kbd?.on('keydown-PAGE_DOWN', onPgDown)

      const cleanup = { destroy: () => {
        scene.input.off('wheel', wheelHandler)
        kbd?.off('keydown-UP', onUp)
        kbd?.off('keydown-DOWN', onDown)
        kbd?.off('keydown-PAGE_UP', onPgUp)
        kbd?.off('keydown-PAGE_DOWN', onPgDown)
      } }
      allUI.push(cleanup)
    }

    refreshZoneVisibility()
  } else {
    const shuffled = [...pool].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, Math.min(3, shuffled.length))

    allUI.push(scene.add.text(w / 2, h / 2 - 175, 'Choose your starting weapon', {
      fontSize: '28px', color: '#ffffff', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

    const cardW = 180, cardH = 240, gap = 200
    const n = selected.length
    const startX = w / 2 - gap * (n - 1) / 2

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

  const earned = scene.runCoins
  scene.runCoins = 0
  awardCoins(earned)
  const balance = getCoins()

  const { width: w, height: h } = scene.cameras.main
  scene.add.graphics().setScrollFactor(0).setDepth(30)
    .fillStyle(0x000000, 0.65).fillRect(0, 0, w, h)

  scene.add.text(w / 2, h / 2 - 70, 'GAME OVER', {
    fontSize: '36px', color: '#ef4444', stroke: '#000', strokeThickness: 5,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(31)

  const t = Math.floor(scene.gameTime / 1000)
  const timeStr = `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`
  scene.add.text(w / 2, h / 2 - 20, `Score: ${scene.score}  ·  Time: ${timeStr}`, {
    fontSize: '18px', color: '#ffffff', stroke: '#000', strokeThickness: 3,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(31)

  scene.add.text(w / 2, h / 2 + 8, `+ ${earned} coins (balance: ${balance})`, {
    fontSize: '16px', color: '#fde047', stroke: '#000', strokeThickness: 3,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(31)

  const btn = scene.add.text(w / 2, h / 2 + 54, '[ Restart ]', {
    fontSize: '22px', color: '#4ade80', stroke: '#000', strokeThickness: 3,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(31).setInteractive({ useHandCursor: true })

  btn.on('pointerover', () => btn.setColor('#86efac'))
  btn.on('pointerout', () => btn.setColor('#4ade80'))
  btn.on('pointerdown', () => scene.scene.restart())
}

export function showShop(scene: IGameScene) {
  const { width: w, height: h } = scene.cameras.main
  const ui: any[] = []

  const overlay = scene.add.graphics().setScrollFactor(0).setDepth(50)
  overlay.fillStyle(0x000000, 0.92).fillRect(0, 0, w, h)
  ui.push(overlay)

  ui.push(scene.add.text(w / 2, 28, 'SHOP', {
    fontSize: '30px', color: '#fde047', stroke: '#000', strokeThickness: 4,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

  const coinsText = scene.add.text(w - 20, 28, `Coins: ${getCoins()}`, {
    fontSize: '18px', color: '#fde047', stroke: '#000', strokeThickness: 3,
  }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(51)
  ui.push(coinsText)

  const backBtn = scene.add.text(20, 28, '[ BACK ]', {
    fontSize: '18px', color: '#4ade80', stroke: '#000', strokeThickness: 3,
  }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true })
  ui.push(backBtn)
  backBtn.on('pointerover', () => backBtn.setColor('#86efac'))
  backBtn.on('pointerout', () => backBtn.setColor('#4ade80'))
  backBtn.on('pointerdown', () => {
    ui.forEach(o => o.destroy())
    scene.showTitleScreen()
  })

  const redraw = () => {
    ui.forEach(o => o.destroy())
    scene.showShop()
  }

  interface ShopEntry {
    name: string
    iconKey: string | null
    accent: number
    isUnlocked: () => boolean
    cost: number
    buy: () => void
  }

  const entries: ShopEntry[] = ALL_WEAPONS.map(w => ({
    name: w.name,
    iconKey: `wico_${w.type}`,
    accent: w.accent,
    isUnlocked: () => isWeaponUnlocked(w.type),
    cost: getWeaponCost(w.type),
    buy: () => unlockWeaponMeta(w.type),
  }))
  entries.push({
    name: 'One Weapon Mode',
    iconKey: null,
    accent: 0xf97316,
    isUnlocked: () => isModeUnlocked('oneWeapon'),
    cost: getModeCost('oneWeapon'),
    buy: () => unlockMode('oneWeapon'),
  })

  const cols = 5
  const cardW = 128, cardH = 112
  const colGap = 140, rowGap = 124
  const totalW = colGap * (cols - 1)
  const startX = w / 2 - totalW / 2
  const startY = 76 + cardH / 2
  const balance = getCoins()

  entries.forEach((entry, i) => {
    const cx = startX + (i % cols) * colGap
    const cy = startY + Math.floor(i / cols) * rowGap
    const owned = entry.isUnlocked()
    const affordable = !owned && balance >= entry.cost

    const bg = scene.add.graphics().setScrollFactor(0).setDepth(51)
    const draw = (hover: boolean) => {
      bg.clear()
      const fill = owned ? 0x0f1a12 : (affordable && hover ? 0x1e1e30 : 0x111118)
      bg.fillStyle(fill)
      bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10)
      let stroke: number
      if (owned) stroke = entry.accent
      else if (affordable && hover) stroke = entry.accent
      else stroke = 0x2a2a3a
      bg.lineStyle(owned || (affordable && hover) ? 3 : 2, stroke)
      bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10)
    }
    draw(false)
    ui.push(bg)

    const nameColor = owned ? '#ffffff' : (affordable ? '#e5e7eb' : '#6b7280')
    ui.push(scene.add.text(cx, cy - 38, entry.name, {
      fontSize: '12px', color: nameColor, stroke: '#000', strokeThickness: 2,
      fontStyle: 'bold', align: 'center', wordWrap: { width: cardW - 12 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52))

    if (entry.iconKey) {
      const icon = scene.add.image(cx, cy - 2, entry.iconKey)
        .setScrollFactor(0).setDepth(52).setDisplaySize(36, 36)
      if (!owned && !affordable) icon.setAlpha(0.45)
      ui.push(icon)
    } else {
      ui.push(scene.add.text(cx, cy - 2, '1W', {
        fontSize: '22px', color: owned ? '#f97316' : (affordable ? '#fb923c' : '#78350f'),
        stroke: '#000', strokeThickness: 3, fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52))
    }

    let footerText: string
    let footerColor: string
    if (owned) { footerText = '✓ OWNED'; footerColor = '#4ade80' }
    else if (affordable) { footerText = `${entry.cost} coins`; footerColor = '#fde047' }
    else { footerText = `${entry.cost} coins`; footerColor = '#ef4444' }
    const footer = scene.add.text(cx, cy + 38, footerText, {
      fontSize: '12px', color: footerColor, stroke: '#000', strokeThickness: 2,
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)
    ui.push(footer)

    if (!owned) {
      const zone = scene.add.zone(cx, cy, cardW, cardH)
        .setScrollFactor(0).setDepth(53).setInteractive({ useHandCursor: affordable })
      zone.on('pointerover', () => {
        draw(true)
        if (affordable) footer.setText('[ BUY ]')
      })
      zone.on('pointerout', () => {
        draw(false)
        footer.setText(footerText)
      })
      zone.on('pointerdown', () => {
        if (!affordable) return
        if (spendCoins(entry.cost)) {
          entry.buy()
          redraw()
        }
      })
      ui.push(zone)
    }
  })
}
