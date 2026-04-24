import { IGameScene } from './_sceneInterface'
import { ALL_WEAPON_TYPES, WEAPON_NAMES, WeaponType } from './_types'
import { PU_TYPES } from './_powerups'
import { ENEMY_TYPES } from './_enemyTypes'

const MAX_HP_BY_KEY: Record<string, number> = (() => {
  const m: Record<string, number> = { enemy_boss: 1500 }
  for (const t of ENEMY_TYPES) m[t.key] = t.hp
  return m
})()

const RADIUS_RINGS = [20, 50, 100, 200, 400, 800]
const RING_COLOR = 0x22ff88
const HITBOX_COLOR = 0xff00ff
const HP_BAR_BG = 0x000000
const HP_BAR_FG = 0xf87171

type MenuMode = 'main' | 'powerup'

type DebugEntry = {
  label: (s: IGameScene) => string
  run: (s: IGameScene) => void
}

const mainEntries: DebugEntry[] = [
  {
    label: (s) => s.weapons.length > 0 ? `Evolve first weapon (${WEAPON_NAMES[s.weapons[0]]} → Lv 9)` : 'Evolve first weapon',
    run: evolveFirstWeapon,
  },
  {
    label: (s) => `Radius overlay: ${s.debugRadiusOverlay ? 'ON' : 'OFF'}`,
    run: (s) => { s.debugRadiusOverlay = !s.debugRadiusOverlay; if (!s.debugRadiusOverlay) clearRadiusLabels(s) },
  },
  {
    label: (s) => `Invulnerability: ${s.debugInvuln ? 'ON' : 'OFF'}`,
    run: (s) => { s.debugInvuln = !s.debugInvuln },
  },
  {
    label: () => 'Full heal',
    run: (s) => { s.hp = s.maxHp; s.hudDirty = true },
  },
  {
    label: () => 'Queue +10 level-ups',
    run: (s) => {
      s.debugLevelQueue = (s.debugLevelQueue ?? 0) + 10
      s.level++
      s.showUpgradeMenu()
    },
  },
  {
    label: () => '+1000 XP',
    run: (s) => { s.xp += 1000; s.hudDirty = true },
  },
  {
    label: () => 'Unlock ALL weapons (bypass 3-cap)',
    run: (s) => {
      for (const wt of ALL_WEAPON_TYPES) {
        if (!s.weapons.includes(wt)) s.unlockWeapon(wt)
      }
      s.recalculateStats()
      s.hudDirty = true
    },
  },
  {
    label: () => 'Spawn power-up…',
    run: (s) => openDebugMenu(s, 'powerup'),
  },
  {
    label: (s) => `Enemy HP bars: ${s.debugHpBars ? 'ON' : 'OFF'}`,
    run: (s) => { s.debugHpBars = !s.debugHpBars },
  },
  {
    label: (s) => `Hitbox overlay: ${s.debugHitboxes ? 'ON' : 'OFF'}`,
    run: (s) => { s.debugHitboxes = !s.debugHitboxes },
  },
]

const powerupEntries: DebugEntry[] = [
  ...PU_TYPES.map(pu => ({
    label: () => `Spawn: ${pu.label}`,
    run: (s: IGameScene) => { s.applyPowerUp(pu.key) },
  })),
  {
    label: () => '← Back',
    run: (s: IGameScene) => openDebugMenu(s, 'main'),
  },
]

function entriesFor(mode: MenuMode): DebugEntry[] {
  return mode === 'powerup' ? powerupEntries : mainEntries
}

export function openDebugMenu(scene: IGameScene, mode: MenuMode = 'main') {
  if (scene.dead || scene.levelUpPending || scene.weapons.length === 0) return

  destroyMenu(scene)

  if (!scene.debugMenuOpen) {
    scene.physics.world.pause()
    scene.tweens.pauseAll()
    scene.time.paused = true
    scene.debugMenuOpen = true
  }

  const { width: w, height: h } = scene.cameras.main
  const entries = entriesFor(mode)
  const rowH = 28
  const panelW = 420
  const panelH = rowH * entries.length + 60
  const panelX = w / 2 - panelW / 2
  const panelY = h / 2 - panelH / 2

  const overlay = scene.add.graphics().setScrollFactor(0).setDepth(45)
  overlay.fillStyle(0x000000, 0.65).fillRect(0, 0, w, h)
  overlay.fillStyle(0x1f2937, 0.95).fillRect(panelX, panelY, panelW, panelH)
  overlay.lineStyle(2, 0x22ff88, 0.8).strokeRect(panelX, panelY, panelW, panelH)

  const title = scene.add.text(w / 2, panelY + 14, mode === 'powerup' ? 'DEBUG — Spawn power-up' : 'DEBUG MENU (U or ESC to close)', {
    fontSize: '14px', color: '#22ff88', stroke: '#000', strokeThickness: 3,
  }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(46)

  scene.debugMenuUI = [overlay, title]

  let selected = 0
  const rowTexts: any[] = []

  const redraw = () => {
    entries.forEach((e, i) => {
      const txt = rowTexts[i]
      const isSel = i === selected
      txt.setText((isSel ? '▶ ' : '  ') + e.label(scene))
      txt.setColor(isSel ? '#fbbf24' : '#ffffff')
    })
  }

  entries.forEach((e, i) => {
    const y = panelY + 44 + i * rowH
    const t = scene.add.text(panelX + 20, y, '', {
      fontSize: '14px', color: '#ffffff', stroke: '#000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(46).setInteractive({ useHandCursor: true })
    t.on('pointerover', () => { selected = i; redraw() })
    t.on('pointerdown', () => run(i))
    rowTexts.push(t)
    scene.debugMenuUI.push(t)
  })
  redraw()

  const run = (i: number) => {
    teardown()
    entries[i].run(scene)
    if (scene.debugMenuOpen && scene.debugMenuUI.length === 0) {
      closeDebugMenu(scene)
    }
  }

  const moveUp = () => { selected = (selected - 1 + entries.length) % entries.length; redraw() }
  const moveDown = () => { selected = (selected + 1) % entries.length; redraw() }
  const confirmKey = () => run(selected)
  const cancelKey = () => { teardown(); closeDebugMenu(scene) }

  const teardown = () => {
    scene.input.keyboard?.off('keydown-UP', moveUp)
    scene.input.keyboard?.off('keydown-W', moveUp)
    scene.input.keyboard?.off('keydown-DOWN', moveDown)
    scene.input.keyboard?.off('keydown-S', moveDown)
    scene.input.keyboard?.off('keydown-ENTER', confirmKey)
    scene.input.keyboard?.off('keydown-SPACE', confirmKey)
    scene.input.keyboard?.off('keydown-ESC', cancelKey)
    scene.input.keyboard?.off('keydown-U', cancelKey)
    destroyMenu(scene)
  }

  scene.input.keyboard?.on('keydown-UP', moveUp)
  scene.input.keyboard?.on('keydown-W', moveUp)
  scene.input.keyboard?.on('keydown-DOWN', moveDown)
  scene.input.keyboard?.on('keydown-S', moveDown)
  scene.input.keyboard?.on('keydown-ENTER', confirmKey)
  scene.input.keyboard?.on('keydown-SPACE', confirmKey)
  scene.input.keyboard?.on('keydown-ESC', cancelKey)
  scene.input.keyboard?.on('keydown-U', cancelKey)
}

function destroyMenu(scene: IGameScene) {
  if (scene.debugMenuUI && scene.debugMenuUI.length > 0) {
    for (const o of scene.debugMenuUI) { try { o.destroy() } catch { /* noop */ } }
  }
  scene.debugMenuUI = []
}

export function closeDebugMenu(scene: IGameScene) {
  destroyMenu(scene)
  if (scene.debugMenuOpen) {
    scene.debugMenuOpen = false
    if (!scene.levelUpPending) {
      scene.tweens.resumeAll()
      scene.time.paused = false
      scene.physics.world.resume()
    }
  }
}

function evolveFirstWeapon(scene: IGameScene) {
  if (scene.weapons.length === 0) return
  const wt: WeaponType = scene.weapons[0]
  const targetName = WEAPON_NAMES[wt]
  let guard = 16
  while (((scene.weaponLevels[wt] ?? 1) < 9) && guard-- > 0) {
    const list = scene.getWeaponUpgrades()
    const entry = list.find((u: any) => typeof u.name === 'string' && u.name.startsWith(targetName + ' '))
    if (!entry) break
    entry.apply()
  }
  scene.recalculateStats()
  scene.hudDirty = true
}

function clearRadiusLabels(scene: IGameScene) {
  if (scene.debugRadiusLabels) {
    for (const l of scene.debugRadiusLabels) { try { l.destroy() } catch { /* noop */ } }
  }
  scene.debugRadiusLabels = []
  if (scene.debugRadiusGfx) scene.debugRadiusGfx.clear()
}

function ensureRadiusLabels(scene: IGameScene) {
  if (scene.debugRadiusLabels && scene.debugRadiusLabels.length === RADIUS_RINGS.length) return
  clearRadiusLabels(scene)
  scene.debugRadiusLabels = RADIUS_RINGS.map(r =>
    scene.add.text(0, 0, `${r}px`, {
      fontSize: '11px', color: '#22ff88', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0.5).setDepth(4)
  )
}

export function drawDebugOverlays(scene: IGameScene) {
  if (scene.debugRadiusOverlay) {
    ensureRadiusLabels(scene)
    const g = scene.debugRadiusGfx
    g.clear()
    for (const r of RADIUS_RINGS) {
      g.lineStyle(1, RING_COLOR, 0.55).strokeCircle(scene.player.x, scene.player.y, r)
    }
    scene.debugRadiusLabels.forEach((t: any, i: number) => {
      t.setPosition(scene.player.x, scene.player.y - RADIUS_RINGS[i])
      t.setVisible(true)
    })
  } else if (scene.debugRadiusLabels && scene.debugRadiusLabels.length > 0) {
    clearRadiusLabels(scene)
  }

  if (scene.debugHpBars) {
    const g = scene.debugHpBarGfx
    g.clear()
    const enemies = scene.enemies.getChildren() as any[]
    for (const e of enemies) {
      if (!e.active) continue
      const hp = e.getData('hp')
      const key = e.texture?.key as string | undefined
      const maxHp = (key && MAX_HP_BY_KEY[key]) ?? hp
      if (!hp || !maxHp) continue
      const w = 30
      const h = 4
      const x = e.x - w / 2
      const y = e.y - (e.displayHeight / 2) - 8
      g.fillStyle(HP_BAR_BG, 0.7).fillRect(x, y, w, h)
      g.fillStyle(HP_BAR_FG, 0.95).fillRect(x, y, w * Math.max(0, Math.min(1, hp / maxHp)), h)
    }
  } else if (scene.debugHpBarGfx) {
    scene.debugHpBarGfx.clear()
  }

  if (scene.debugHitboxes) {
    const g = scene.debugHitboxGfx
    g.clear()
    g.lineStyle(1, HITBOX_COLOR, 0.8)
    const drawBody = (o: any) => {
      if (!o?.active || !o.body) return
      if (o.body.isCircle && o.body.radius) {
        g.strokeCircle(o.body.center?.x ?? o.x, o.body.center?.y ?? o.y, o.body.radius)
      } else {
        const bw = o.body.width ?? o.displayWidth
        const bh = o.body.height ?? o.displayHeight
        g.strokeRect(o.x - bw / 2, o.y - bh / 2, bw, bh)
      }
    }
    drawBody(scene.player)
    for (const e of scene.enemies.getChildren() as any[]) drawBody(e)
    for (const b of scene.bullets.getChildren() as any[]) drawBody(b)
  } else if (scene.debugHitboxGfx) {
    scene.debugHitboxGfx.clear()
  }
}
