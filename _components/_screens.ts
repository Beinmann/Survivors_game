import { IGameScene } from './_sceneInterface'
import { WeaponType } from './_types'

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
    scene.input.keyboard!.off('keydown-SPACE', dismiss)
    ui.forEach(o => o.destroy())
    scene.showWeaponSelection()
  }

  btn.on('pointerover', () => btn.setColor('#86efac'))
  btn.on('pointerout', () => btn.setColor('#4ade80'))
  btn.on('pointerdown', dismiss)
  scene.input.keyboard!.on('keydown-SPACE', dismiss)
}

export function showWeaponSelection(scene: IGameScene) {
  const { width: w, height: h } = scene.cameras.main
  const WEAPONS: { type: WeaponType; name: string; desc: string; stats: string; accent: number }[] = [
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
      stats: '100ms cooldown · scales to 7-way spread',
      accent: 0x4ade80,
    },
  ]

  const overlay = scene.add.graphics().setScrollFactor(0).setDepth(50)
  overlay.fillStyle(0x000000, 0.88).fillRect(0, 0, w, h)

  const cardW = Math.min(170, (w - 60) / 4 - 10)
  const cardH = 160
  const gap = cardW + 14
  const startX = w / 2 - gap * 1.5

  const titleText = scene.add.text(w / 2, h / 2 - 160, 'Choose your weapon', {
    fontSize: '26px', color: '#ffffff', stroke: '#000', strokeThickness: 4,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(51)

  const allUI: any[] = [overlay, titleText]

  WEAPONS.forEach((weapon, i) => {
    const cx = startX + i * gap
    const cy = h / 2

    const bg = scene.add.graphics().setScrollFactor(0).setDepth(51)
    const draw = (hover: boolean) => {
      bg.clear()
      bg.fillStyle(hover ? 0x1e1e30 : 0x111118)
      bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12)
      bg.lineStyle(hover ? 3 : 2, hover ? weapon.accent : 0x2a2a3a)
      bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12)
    }
    draw(false)

    const nameText = scene.add.text(cx, cy - 52, weapon.name, {
      fontSize: '16px', color: '#ffffff', stroke: '#000', strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

    const descText = scene.add.text(cx, cy - 4, weapon.desc, {
      fontSize: '12px', color: '#ccccdd',
      align: 'center', wordWrap: { width: cardW - 16 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

    const statsText = scene.add.text(cx, cy + 56, weapon.stats, {
      fontSize: '11px', color: `#${weapon.accent.toString(16).padStart(6, '0')}`,
      align: 'center', wordWrap: { width: cardW - 16 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

    const zone = scene.add.zone(cx, cy, cardW, cardH)
      .setScrollFactor(0).setDepth(53).setInteractive({ useHandCursor: true })

    zone.on('pointerover', () => draw(true))
    zone.on('pointerout', () => draw(false))
    zone.on('pointerdown', () => {
      scene.unlockWeapon(weapon.type)
      allUI.forEach(o => o.destroy())
      ;[bg, nameText, descText, statsText, zone].forEach(o => o.destroy())
      scene.spawnWave()
    })

    allUI.push(bg, nameText, descText, statsText, zone)
  })
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
