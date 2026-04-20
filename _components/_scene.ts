import { WORLD, SPAWN_INTERVAL_MS, MAX_ORBS, DESPAWN_DIST, CONSOLIDATE_NEARBY_RADIUS, CONSOLIDATE_THRESHOLD, CONSOLIDATE_EDGE_MIN, CONSOLIDATE_EDGE_MAX } from './_constants'
import { WeaponType, PassiveType, ALL_WEAPON_TYPES, WEAPON_NAMES, WEAPON_BASE, PASSIVE_DATA } from './_types'
import { ENEMY_TYPES } from './_enemyTypes'
import { ICON_DEFS } from './iconDefs'
import { IGameScene } from './_sceneInterface'
import { buildTextures } from './_textures'
import { showTitleScreen, showWeaponSelection, showGameOver } from './_screens'
import { drawUI, drawWeaponHUD, drawWeaponIcon, buildStatLines, addStatsPanel, rebuildWeaponHUDTexts } from './_ui'
import { PU_TYPES, spawnPowerUp, onCollectPowerUp, applyPowerUp } from './_powerups'
import { spawnWave, spawnBossWave, spawnObstacles, moveEnemies } from './_spawning'
import { onBulletHitEnemy, onPlayerHitEnemy, damageEnemy, killEnemy, tintConsolidatedOrb, autoShoot, fireShotgun, fireSniper, fireMachineGun, fireAura, showAuraPulse } from './_combat'
import { onCollectOrb, getWeaponUpgrades, getUpgrades, showUpgradeMenu, pullOrbs, unlockWeapon } from './_progression'

export function createGameScene(Phaser: any) {
  return class GameScene extends Phaser.Scene implements IGameScene {
    // --- objects ---
    public player!: any
    public enemies!: any
    public bullets!: any
    public xpOrbs!: any
    public obstacles!: any
    public powerUps!: any
    public cursors!: any
    public wasd!: Record<'up' | 'down' | 'left' | 'right', any>

    // --- Phaser Scene properties (explicitly declared for IGameScene) ---
    public time!: any
    public tweens!: any
    public physics!: any
    public add!: any
    public cameras!: any
    public input!: any
    public textures!: any
    public make!: any
    public scene!: any
    public children!: any

    // --- base state ---
    public weapons: WeaponType[] = []
    public weaponLevels: Partial<Record<WeaponType, number>> = {}
    public weaponCooldowns: Partial<Record<WeaponType, number>> = {}
    public weaponShootRates: Partial<Record<WeaponType, number>> = {}
    public weaponBulletSpd: Partial<Record<WeaponType, number>> = {}
    public weaponRearShot: Partial<Record<WeaponType, boolean>> = {}
    public passives: PassiveType[] = []
    public passiveLevels: Partial<Record<PassiveType, number>> = {}
    public hp = 0
    public maxHp = 0
    public xp = 0
    public xpNeeded = 0
    public level = 0
    public score = 0
    public spawnTimer = 0
    public spawnRate = 0
    public iframes = 0
    public dead = false
    public levelUpPending = false

    // --- upgradeable stats ---
    public moveSpeed = 0
    public extraBullets = 0
    public pierceCount = 0
    public magnetRadius = 0
    public orbMultiplier = 0
    public auraRadius = 0
    public shotgunRange = 0
    public shotgunDmg = 0
    public sniperDmg = 0
    public auraDmg = 0
    public machineGunDmg = 0
    public machineGunBurst = 0
    public machineGunPierce = false

    // --- power-up state ---
    public powerUpSpawnTimer = 0
    public frenzyTimer = 0
    public freezeTimer = 0

    // --- timer ---
    public gameTime = 0
    public globalSpeedMult = 0
    public nextBossWave = 0

    // --- bonus tracking ---
    public bonusMoveSpeed = 0
    public bonusDamage = 0
    public bonusCooldown = 0
    public bonusWeaponDmg: Partial<Record<WeaponType, number>> = {}
    public bonusWeaponBulletSpd: Partial<Record<WeaponType, number>> = {}
    public flatWeaponShootRateReductions: Partial<Record<WeaponType, number>> = {}

    // --- ui ---
    public hpBar!: any
    public xpBar!: any
    public weaponHUDGfx!: any
    public auraGfx!: any
    public weaponHUDLvlTexts: any[] = []
    public passiveHUDLvlTexts: any[] = []
    public passiveHUDIcons: any[] = []
    public levelText!: any
    public scoreText!: any
    public timerText!: any
    public effectText!: any
    public paused = false
    public pauseUI: { destroy(): void }[] = []

    constructor() {
      super('GameScene')
    }

    // ─── lifecycle ──────────────────────────────────────────────────────

    create() {
      this.resetState()
      this.buildTextures()

      this.physics.world.setBounds(0, 0, WORLD, WORLD)
      this.cameras.main.setBounds(0, 0, WORLD, WORLD)

      const bg = this.add.graphics()
      bg.lineStyle(1, 0x1e1e1e, 1)
      for (let x = 0; x <= WORLD; x += 64) bg.lineBetween(x, 0, x, WORLD)
      for (let y = 0; y <= WORLD; y += 64) bg.lineBetween(0, y, WORLD, y)

      this.player = this.physics.add.image(WORLD / 2, WORLD / 2, 'player')
      this.player.setCollideWorldBounds(true).setDepth(5)

      this.enemies = this.physics.add.group()
      this.bullets = this.physics.add.group()
      this.xpOrbs = this.physics.add.group()
      this.obstacles = this.physics.add.staticGroup()
      this.spawnObstacles()
      this.powerUps = this.physics.add.group()

      this.cameras.main.startFollow(this.player, true, 0.08, 0.08)

      this.cursors = this.input.keyboard?.createCursorKeys() ?? {}
      this.wasd = {
        up: this.input.keyboard?.addKey('W'),
        down: this.input.keyboard?.addKey('S'),
        left: this.input.keyboard?.addKey('A'),
        right: this.input.keyboard?.addKey('D'),
      }

      this.input.keyboard?.on('keydown-ESC', () => this.togglePause())
      this.input.keyboard?.on('keydown-L', () => {
        if (!this.dead && !this.levelUpPending && this.weapons.length > 0) {
          this.level++
          this.levelText.setText(`Level ${this.level}`)
          this.showUpgradeMenu()
        }
      })

      this.physics.add.collider(this.enemies, this.enemies)
      this.physics.add.collider(this.player, this.obstacles)
      this.physics.add.collider(
        this.enemies,
        this.obstacles,
        undefined,
        (enemy: any) => !enemy.getData('isGhost'),
        this
      )
      this.physics.add.collider(
        this.bullets,
        this.obstacles,
        (bullet: any) => {
          bullet.destroy()
        },
        undefined,
        this
      )
      this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy as any, undefined, this)
      this.physics.add.overlap(this.player, this.enemies, this.onPlayerHitEnemy as any, undefined, this)
      this.physics.add.overlap(this.player, this.xpOrbs, this.onCollectOrb as any, undefined, this)
      this.physics.add.overlap(this.player, this.powerUps, this.onCollectPowerUp as any, undefined, this)

      this.hpBar = this.add.graphics().setScrollFactor(0).setDepth(20)
      this.xpBar = this.add.graphics().setScrollFactor(0).setDepth(20)
      this.weaponHUDGfx = this.add.graphics().setScrollFactor(0).setDepth(20)
      this.auraGfx = this.add.graphics().setDepth(4)
      this.levelText = this.add.text(12, 12, 'Level 1', {
        fontSize: '14px', color: '#ffffff', stroke: '#000000', strokeThickness: 3,
      }).setScrollFactor(0).setDepth(20)
      this.scoreText = this.add.text(12, 32, 'Score: 0', {
        fontSize: '13px', color: '#dddddd', stroke: '#000000', strokeThickness: 3,
      }).setScrollFactor(0).setDepth(20)
      this.timerText = this.add.text(this.cameras.main.width / 2, 12, '0:00', {
        fontSize: '15px', color: '#facc15', stroke: '#000000', strokeThickness: 3,
      }).setScrollFactor(0).setDepth(20).setOrigin(0.5, 0)
      this.effectText = this.add.text(this.cameras.main.width / 2, 34, '', {
        fontSize: '13px', color: '#fb923c', stroke: '#000000', strokeThickness: 3,
      }).setScrollFactor(0).setDepth(20).setOrigin(0.5, 0)

      this.showTitleScreen()
    }

    public resetState() {
      this.weapons = []; this.weaponLevels = {}; this.weaponCooldowns = {}
      this.weaponShootRates = {}; this.weaponBulletSpd = {}; this.weaponRearShot = {}
      this.passives = []; this.passiveLevels = {}
      this.bonusMoveSpeed = 0; this.bonusDamage = 0; this.bonusCooldown = 0
      this.bonusWeaponDmg = {}; this.bonusWeaponBulletSpd = {}; this.flatWeaponShootRateReductions = {}
      this.recalculateStats()

      this.hp = 100; this.maxHp = 100; this.xp = 0; this.xpNeeded = 10
      this.level = 1; this.score = 0
      this.spawnTimer = 0; this.spawnRate = SPAWN_INTERVAL_MS
      this.iframes = 0; this.dead = false; this.levelUpPending = false
      this.paused = false; this.pauseUI = []
      this.extraBullets = 0; this.pierceCount = 2
      this.magnetRadius = 70; this.orbMultiplier = 1.0
      this.auraRadius = 110; this.shotgunRange = 220
      this.machineGunBurst = 1; this.machineGunPierce = false
      this.frenzyTimer = 0; this.freezeTimer = 0; this.powerUpSpawnTimer = 15000 + Math.random() * 30000
      this.gameTime = 0; this.globalSpeedMult = 1.0; this.nextBossWave = 180
      if (this.auraGfx) { this.auraGfx.clear(); this.auraGfx.setVisible(false) }
    }

    public togglePause() {
      if (this.dead || this.levelUpPending || this.weapons.length === 0) return
      this.paused = !this.paused
      if (this.paused) {
        this.physics.world.pause()
        const { width: w, height: h } = this.cameras.main
        const overlay = this.add.graphics().setScrollFactor(0).setDepth(35)
        overlay.fillStyle(0x000000, 0.55).fillRect(0, 0, w, h)
        const txt = this.add.text(w / 2, h / 2 - 20, 'PAUSED', {
          fontSize: '36px', color: '#ffffff', stroke: '#000', strokeThickness: 5,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(36)
        const sub = this.add.text(w / 2, h / 2 + 28, 'Press ESC to resume', {
          fontSize: '15px', color: '#aaaaaa', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(36)
        this.pauseUI = [overlay, txt, sub]
        this.addStatsPanel(o => this.pauseUI.push(o))
      } else {
        this.pauseUI.forEach(o => o.destroy())
        this.pauseUI = []
        this.physics.world.resume()
      }
    }

    update(time: number, delta: number) {
      if (this.dead || this.levelUpPending || this.weapons.length === 0 || this.paused) return

      this.gameTime += delta
      const totalSecs = Math.floor(this.gameTime / 1000)
      this.timerText.setText(`${Math.floor(totalSecs / 60)}:${(totalSecs % 60).toString().padStart(2, '0')}`)
      this.globalSpeedMult = 1.0 + (this.gameTime / 1000) / 300
      if (totalSecs >= this.nextBossWave) {
        this.spawnBossWave()
        this.nextBossWave += 180
      }

      this.move()
      this.autoShoot(time)
      this.moveEnemies(delta)
      this.pullOrbs()

      this.powerUpSpawnTimer -= delta
      if (this.powerUpSpawnTimer <= 0) {
        this.spawnPowerUp()
        this.powerUpSpawnTimer = 10000 + Math.random() * 40000
      }
      if (this.frenzyTimer > 0) this.frenzyTimer = Math.max(0, this.frenzyTimer - delta)
      if (this.freezeTimer > 0) this.freezeTimer = Math.max(0, this.freezeTimer - delta)
      for (const p of this.powerUps.getChildren() as any[]) {
        const lbl = p.getData('label')
        if (lbl) lbl.setPosition(p.x, p.y - 26)
      }

      if (this.iframes > 0) {
        this.iframes -= delta
        this.player.setAlpha(Math.sin(this.iframes / 80) > 0 ? 1 : 0.3)
      } else {
        this.player.setAlpha(1)
      }

      this.spawnTimer -= delta
      if (this.spawnTimer <= 0) {
        this.spawnWave()
        this.spawnRate = Math.max(600, this.spawnRate - 30)
      }

      for (const b of [...this.bullets.getChildren()]) {
        const img = b as any
        if (!img.active) continue
        if (img.x < -100 || img.x > WORLD + 100 || img.y < -100 || img.y > WORLD + 100) {
          img.destroy(); continue
        }
        // shotgun range check
        const sx = img.getData('sx')
        if (sx !== undefined) {
          const dist = Phaser.Math.Distance.Between(sx, img.getData('sy'), img.x, img.y)
          if (dist > this.shotgunRange) img.destroy()
        }
      }

      this.drawUI()
      this.updateAura()
    }

    public updateAura() {
      if (this.weapons.includes('aura')) {
        this.auraGfx.setVisible(true)
        this.auraGfx.clear()
        this.auraGfx.x = this.player.x
        this.auraGfx.y = this.player.y
        this.auraGfx.fillStyle(0xa78bfa, 0.06)
        this.auraGfx.fillCircle(0, 0, this.auraRadius)
        this.auraGfx.lineStyle(1, 0xc4b5fd, 0.15)
        this.auraGfx.strokeCircle(0, 0, this.auraRadius)
      } else {
        this.auraGfx.setVisible(false)
      }
    }

    // ─── weapons ────────────────────────────────────────────────────────

    public move() {
      if (!this.player || !this.cursors) return
      let vx = 0, vy = 0
      const left  = this.cursors.left?.isDown || this.wasd.left?.isDown
      const right = this.cursors.right?.isDown || this.wasd.right?.isDown
      const up    = this.cursors.up?.isDown || this.wasd.up?.isDown
      const down  = this.cursors.down?.isDown || this.wasd.down?.isDown

      if (left) vx -= this.moveSpeed
      if (right) vx += this.moveSpeed
      if (up) vy -= this.moveSpeed
      if (down) vy += this.moveSpeed
      if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707 }
      this.player.setVelocity(vx, vy)
    }

    public autoShoot(time: number) {
      autoShoot(this, time)
    }

    public fireShotgun(angle: number, wt: WeaponType) {
      fireShotgun(this, angle, wt)
    }

    public fireSniper(angle: number, wt: WeaponType) {
      fireSniper(this, angle, wt)
    }

    public fireMachineGun(angle: number, wt: WeaponType) {
      fireMachineGun(this, angle, wt)
    }

    public fireAura() {
      fireAura(this)
    }

    public showAuraPulse() {
      showAuraPulse(this)
    }

    // ─── movement / orbs ────────────────────────────────────────────────

    public moveEnemies(delta: number) {
      moveEnemies(this, delta)
    }

    public pullOrbs() {
      pullOrbs(this)
    }

    // ─── combat ─────────────────────────────────────────────────────────

    public onBulletHitEnemy(bullet: any, enemy: any) {
      onBulletHitEnemy(this, bullet, enemy)
    }

    public onPlayerHitEnemy(_p: any, _e: any) {
      onPlayerHitEnemy(this, _p, _e)
    }

    public damageEnemy(e: any, dmg: number, flash = true) {
      damageEnemy(this, e, dmg, flash)
    }

    public killEnemy(e: any) {
      killEnemy(this, e)
    }

    public tintConsolidatedOrb(orb: any, value: number) {
      tintConsolidatedOrb(this, orb, value)
    }

    // ─── progression ────────────────────────────────────────────────────

    public onCollectOrb(_p: any, orb: any) {
      onCollectOrb(this, _p, orb)
    }

    public getWeaponUpgrades(): any[] {
      return getWeaponUpgrades(this)
    }

    public getUpgrades() {
      return getUpgrades(this)
    }

    public showUpgradeMenu() {
      showUpgradeMenu(this)
    }

    public recalculateStats() {
      const BASE_MOVE_SPEED = 200
      const BASE_SHOTGUN_DMG = 30
      const BASE_SNIPER_DMG = 150
      const BASE_AURA_DMG = 10
      const BASE_MACHINEGUN_DMG = 4

      this.moveSpeed = Math.round(BASE_MOVE_SPEED * (1 + this.bonusMoveSpeed))
      this.shotgunDmg = Math.round(BASE_SHOTGUN_DMG * (1 + this.bonusDamage + (this.bonusWeaponDmg['shotgun'] ?? 0)))
      this.sniperDmg = Math.round(BASE_SNIPER_DMG * (1 + this.bonusDamage + (this.bonusWeaponDmg['sniper'] ?? 0)))
      this.auraDmg = Math.round(BASE_AURA_DMG * (1 + this.bonusDamage + (this.bonusWeaponDmg['aura'] ?? 0)))
      this.machineGunDmg = Math.round(BASE_MACHINEGUN_DMG * (1 + this.bonusDamage + (this.bonusWeaponDmg['machinegun'] ?? 0)))

      for (const wt of ALL_WEAPON_TYPES) {
        const baseSpd = WEAPON_BASE[wt].bulletSpd
        this.weaponBulletSpd[wt] = Math.round(baseSpd * (1 + (this.bonusWeaponBulletSpd[wt] ?? 0)))

        const baseRate = WEAPON_BASE[wt].shootRate
        const flatRed = this.flatWeaponShootRateReductions[wt] ?? 0
        const minRate = wt === 'machinegun' ? 50 : (wt === 'sniper' ? 300 : 100)
        this.weaponShootRates[wt] = Math.max(minRate, Math.round(baseRate * (1 - this.bonusCooldown)) - flatRed)
      }
    }


    // ─── spawning ───────────────────────────────────────────────────────

    public spawnWave() {
      spawnWave(this)
    }

    public spawnBossWave() {
      spawnBossWave(this)
    }

    public unlockWeapon(wt: WeaponType) {
      unlockWeapon(this, wt)
    }

    public rebuildWeaponHUDTexts() {
      rebuildWeaponHUDTexts(this)
    }

    public unlockPassive(pt: PassiveType) {
      this.passives.push(pt)
      this.passiveLevels[pt] = 1
      this.applyPassiveBoost(pt)
      this.rebuildWeaponHUDTexts()
    }

    public applyPassiveBoost(pt: PassiveType) {
      if (pt === 'movespeed') this.bonusMoveSpeed += 0.20
      if (pt === 'magnet')    this.magnetRadius += 50
      if (pt === 'orbmult')   this.orbMultiplier += 0.25
      if (pt === 'hp')        { this.maxHp += 20; this.hp = Math.min(this.maxHp, this.hp + 40) }
      if (pt === 'damage')    this.bonusDamage += 0.15
      if (pt === 'cooldown')  this.bonusCooldown += 0.12
      
      this.recalculateStats()
    }

    // ─── ui ─────────────────────────────────────────────────────────────

    public effectiveShootRate(wt: WeaponType) {
      const base = this.weaponShootRates[wt] ?? WEAPON_BASE[wt].shootRate
      return this.frenzyTimer > 0 ? base / 2 : base
    }

    public drawUI() {
      drawUI(this)
    }

    public drawWeaponHUD() {
      drawWeaponHUD(this)
    }

    public drawWeaponIcon(cx: number, cy: number, wt: WeaponType) {
      drawWeaponIcon(this, cx, cy, wt)
    }

    public buildStatLines() {
      return buildStatLines(this)
    }

    public addStatsPanel(collect: (o: any) => void) {
      addStatsPanel(this, collect)
    }

    public showTitleScreen() {
      showTitleScreen(this)
    }

    public showWeaponSelection() {
      showWeaponSelection(this)
    }

    public showGameOver() {
      showGameOver(this)
    }

    // ─── power-ups ──────────────────────────────────────────────────────

    public spawnPowerUp() {
      spawnPowerUp(this)
    }

    public onCollectPowerUp(_p: any, powerUp: any) {
      onCollectPowerUp(this, _p, powerUp)
    }

    public applyPowerUp(type: string) {
      applyPowerUp(this, type)
    }

    public spawnObstacles() {
      spawnObstacles(this)
    }

    public buildTextures() {
      buildTextures(this)
    }
  }
}
