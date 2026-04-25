import { WORLD, SPAWN_INTERVAL_MS, MAX_ORBS, DESPAWN_DIST } from './_constants'
import { MapKey, getMapDef, drawBackground } from './_maps'
import { WeaponType, PassiveType, ALL_WEAPON_TYPES, WEAPON_NAMES, WEAPON_BASE, PASSIVE_DATA } from './_types'
import { ENEMY_TYPES } from './_enemyTypes'
import { ICON_DEFS } from './iconDefs'
import { IGameScene } from './_sceneInterface'
import { buildTextures } from './_textures'
import { showTitleScreen, showModeSelection, showMapSelection, showWeaponSelection, showGameOver, showShop } from './_screens'
import { drawUI, drawWeaponHUD, drawWeaponIcon, buildStatLines, addStatsPanel, rebuildWeaponHUDTexts } from './_ui'
import { PU_TYPES, spawnPowerUp, onCollectPowerUp, applyPowerUp } from './_powerups'
import { spawnWave, spawnBossWave, spawnObstacles, moveEnemies, getActiveWave, showWaveBanner } from './_spawning'
import { onBulletHitEnemy, onPlayerHitEnemy, damageEnemy, killEnemy, tintConsolidatedOrb, autoShoot, fireShotgun, fireSniper, fireMachineGun, fireAura, fireTesla, fireBoomerang, fireRocket, fireLaser, fireTurret, fireOrbital, fireBlackhole, fireCryo, fireRailgun, fireDrones, fireCleave, updateSpecials, playerEmitX, playerEmitY } from './_combat'
import { onCollectOrb, getWeaponUpgrades, getUpgrades, showUpgradeMenu, pullOrbs, unlockWeapon } from './_progression'
import { openDebugMenu, closeDebugMenu, drawDebugOverlays } from './_debug'

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
    public passives: PassiveType[] = []
    public passiveLevels: Partial<Record<PassiveType, number>> = {}
    public hp = 0
    public maxHp = 0
    public hpRegen = 0
    public _hpRegenAccum = 0
    public xp = 0
    public xpNeeded = 0
    public level = 0
    public score = 0
    public runCoins = 0
    public spawnTimer = 0
    public spawnRate = 0
    public iframes = 0
    public dead = false
    public levelUpPending = false
    public maxLevelShown = false

    // --- upgradeable stats ---
    public moveSpeed = 0
    public extraBullets = 0
    public pierceCount = 0
    public magnetRadius = 20
    public orbMultiplier = 0
    public auraRadius = 0
    public shotgunRange = 0
    public shotgunDmg = 0
    public sniperDmg = 0
    public auraDmg = 0
    public machineGunDmg = 0
    public machineGunBurst = 0
    public machineGunPierce = false
    public scythesDmg = 0
    public scythesCount = 0
    public scythesRadius = 0
    public scythesLifeSteal = false
    public teslaDmg = 0
    public teslaJumps = 0
    public teslaStun = false
    public teslaArcBack = false
    public boomerangDmg = 0
    public boomerangCount = 0
    public boomerangDist = 0
    public boomerangPierce = false
    public rocketDmg = 0
    public rocketRadius = 0
    public rocketBurst = 0
    public rocketSplit = false
    public laserDmg = 0
    public laserRange = 0
    public laserWidth = 0
    public laserPierce = 0
    public turretDmg = 0
    public turretDuration = 0
    public turretFireRate = 0
    public turretMax = 0
    public orbitalDmg = 0
    public orbitalRadius = 0
    public orbitalCount = 0
    public blackholeDmg = 0
    public blackholeRadius = 0
    public blackholeDuration = 0
    public blackholePull = 0
    public cryoDmg = 0
    public cryoShardCount = 0
    public cryoSlowDuration = 0
    public railgunDmg = 0
    public railgunChargeTime = 0
    public railgunWidth = 0
    public droneDmg = 0
    public droneCount = 0
    public cleaveDmg = 0
    public cleaveCount = 0
    public cleaveRadius = 0
    public cleaveArc = 0
    public bonusProjectiles = 0

    // --- specials (long-lived, manually updated) ---
    public turrets: any[] = []
    public blackholes: any[] = []
    public orbitalStrikes: any[] = []
    public railgunCharges: any[] = []
    public drones: any[] = []
    public plaguePools: any[] = []
    public lockdownSlow = 0

    // --- power-up state ---
    public powerUpSpawnTimer = 0
    public frenzyTimer = 0
    public freezeTimer = 0

    // --- timer ---
    public gameTime = 0
    public globalSpeedMult = 0
    public currentWaveIndex = 0
    public currentWaveEndSec = 0
    public _lastWaveIndexApplied = 0

    // --- bonus tracking ---
    public bonusMoveSpeed = 0
    public bonusDamage = 0
    public bonusCooldown = 0
    public bonusArea = 0
    public bonusWeaponDmg: Partial<Record<WeaponType, number>> = {}
    public bonusWeaponBulletSpd: Partial<Record<WeaponType, number>> = {}
    public flatWeaponShootRateReductions: Partial<Record<WeaponType, number>> = {}

    // --- persisted across restarts ---
    public playerSkin = 'player_b'
    public oneWeaponMode = false
    public selectedMap: MapKey = 'ruins'

    // --- gfx pool ---
    public gfxPoolFree: any[] = []
    public _lastTimerSecs = -1
    public _lastEffectStr = ''
    public _lastAuraRadius = 0
    public hudDirty = false
    public _lastHp = 0
    public _lastMaxHp = 0
    public _lastXp = 0
    public _lastXpNeeded = 0

    // --- ui ---
    public hpBar!: any
    public xpBar!: any
    public weaponHUDGfx!: any
    public auraGfx!: any
    public weaponHUDLvlTexts: any[] = []
    public weaponHUDIcons: any[] = []
    public passiveHUDLvlTexts: any[] = []
    public passiveHUDIcons: any[] = []
    public levelText!: any
    public scoreText!: any
    public timerText!: any
    public effectText!: any
    public paused = false
    public showBaseStats = false
    public pauseUI: { destroy(): void }[] = []

    // --- debug ---
    public debugInvuln = false
    public debugRadiusOverlay = false
    public debugHpBars = false
    public debugHitboxes = false
    public debugMenuOpen = false
    public debugLevelQueue = 0
    public debugRadiusGfx!: any
    public debugHpBarGfx!: any
    public debugHitboxGfx!: any
    public debugRadiusLabels: any[] = []
    public debugMenuUI: any[] = []

    constructor() {
      super('GameScene')
    }

    // ─── lifecycle ──────────────────────────────────────────────────────

    create() {
      this.resetState()
      this.buildTextures()

      for (let i = 0; i < 16; i++) {
        this.gfxPoolFree.push(this.add.graphics().setVisible(false))
      }

      this.physics.world.setBounds(0, 0, WORLD, WORLD)
      this.cameras.main.setBounds(0, 0, WORLD, WORLD)

      const bg = this.add.graphics().setDepth(0)
      drawBackground(bg, getMapDef(this.selectedMap))

      this.player = this.physics.add.image(WORLD / 2, WORLD / 2, this.playerSkin)
      this.player.setCollideWorldBounds(true).setDepth(5)

      this.enemies = this.physics.add.group()
      this.bullets = this.physics.add.group()
      this.xpOrbs = this.physics.add.group()
      this.obstacles = this.physics.add.staticGroup()
      this.spawnObstacles()
      this.powerUps = this.physics.add.group()
      this.scythes = this.physics.add.group()

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
      this.input.keyboard?.on('keydown-O', () => {
        if (!this.dead && !this.levelUpPending && !this.paused && this.weapons.length > 0) {
          this.gameTime += 10000
        }
      })
      this.input.keyboard?.on('keydown-U', () => {
        if (this.debugMenuOpen) return
        if (!this.dead && !this.levelUpPending && !this.paused && this.weapons.length > 0) {
          this.openDebugMenu()
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
        (bullet: any) => { bullet.destroy() },
        undefined,
        this
      )
      this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy as any, undefined, this)
      this.physics.add.overlap(this.scythes, this.enemies, (scythe: any, enemy: any) => {
        if (!enemy.active) return
        this.damageEnemy(enemy, this.scythesDmg, false)
        if (this.scythesLifeSteal && Math.random() < 0.05) {
          this.hp = Math.min(this.maxHp, this.hp + 1)
        }
      }, undefined, this)
      this.physics.add.overlap(this.player, this.enemies, this.onPlayerHitEnemy as any, undefined, this)
      this.physics.add.overlap(this.player, this.xpOrbs, this.onCollectOrb as any, undefined, this)
      this.physics.add.overlap(this.player, this.powerUps, this.onCollectPowerUp as any, undefined, this)

      this.hpBar = this.add.graphics().setScrollFactor(0).setDepth(20)
      this.xpBar = this.add.graphics().setScrollFactor(0).setDepth(20)
      this.weaponHUDGfx = this.add.graphics().setScrollFactor(0).setDepth(20)
      this.auraGfx = this.add.graphics().setDepth(4)
      this.debugRadiusGfx = this.add.graphics().setDepth(4)
      this.debugHpBarGfx = this.add.graphics().setDepth(19)
      this.debugHitboxGfx = this.add.graphics().setDepth(19)
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

      this.scale.on('resize', () => {
        const cw = this.cameras.main.width
        this.timerText.x = cw / 2
        this.effectText.x = cw / 2
      })

      this._runJITWarmup()
      this.showTitleScreen()
    }

    public resetState() {
      this.weapons = []; this.weaponLevels = {}; this.weaponCooldowns = {}
      this.weaponShootRates = {}; this.weaponBulletSpd = {}
      this.passives = []; this.passiveLevels = {}
      this.bonusMoveSpeed = 0; this.bonusDamage = 0; this.bonusCooldown = 0; this.bonusArea = 0
      this.bonusWeaponDmg = {}; this.bonusWeaponBulletSpd = {}; this.flatWeaponShootRateReductions = {}
      this.recalculateStats()

      this.hp = 100; this.maxHp = 100; this.hpRegen = 0; this._hpRegenAccum = 0
      this.xp = 0; this.xpNeeded = 10
      this.level = 1; this.score = 0; this.runCoins = 0
      this.spawnTimer = 0; this.spawnRate = SPAWN_INTERVAL_MS
      this.iframes = 0; this.dead = false; this.levelUpPending = false; this.maxLevelShown = false
      this.paused = false; this.showBaseStats = false; this.pauseUI = []
      this.extraBullets = 0; this.pierceCount = 2; this.bonusProjectiles = 0
      this.magnetRadius = 145; this.orbMultiplier = 1.0
      this.auraRadius = 110; this.shotgunRange = 220
      this.machineGunBurst = 1; this.machineGunPierce = false
      this.scythesCount = 0; this.scythesRadius = 100; this.scythesLifeSteal = false
      this.teslaJumps = 2; this.teslaStun = false; this.teslaArcBack = false
      this.boomerangCount = 1; this.boomerangDist = 250; this.boomerangPierce = false
      this.rocketRadius = 40; this.rocketBurst = 1; this.rocketSplit = false
      this.laserRange = 340; this.laserWidth = 10; this.laserPierce = 3
      this.turretDuration = 8000; this.turretFireRate = 400; this.turretMax = 2
      this.orbitalRadius = 110; this.orbitalCount = 1
      this.blackholeRadius = 150; this.blackholeDuration = 2500; this.blackholePull = 160
      this.cryoShardCount = 3; this.cryoSlowDuration = 1500
      this.railgunChargeTime = 1500; this.railgunWidth = 6
      this.droneCount = 1
      this.cleaveCount = 1; this.cleaveRadius = 150; this.cleaveArc = (140 * Math.PI) / 180
      this.clearSpecials()
      this.frenzyTimer = 0; this.freezeTimer = 0; this.powerUpSpawnTimer = 15000 + Math.random() * 30000
      this.gameTime = 0; this.globalSpeedMult = 1.0
      this.currentWaveIndex = 0; this.currentWaveEndSec = 0; this._lastWaveIndexApplied = -1
      this.hudDirty = true
      this._lastHp = -1; this._lastMaxHp = -1; this._lastXp = -1; this._lastXpNeeded = -1
      this.gfxPoolFree = []; this._lastTimerSecs = -1; this._lastEffectStr = ''
      this._lastAuraRadius = -1
      if (this.auraGfx) { this.auraGfx.clear(); this.auraGfx.setVisible(false) }

      this.debugInvuln = false
      this.debugRadiusOverlay = false
      this.debugHpBars = false
      this.debugHitboxes = false
      this.debugMenuOpen = false
      this.debugLevelQueue = 0
      if (this.debugRadiusLabels) { this.debugRadiusLabels.forEach((l: any) => { try { l.destroy() } catch { /* noop */ } }) }
      this.debugRadiusLabels = []
      if (this.debugMenuUI) { this.debugMenuUI.forEach((o: any) => { try { o.destroy() } catch { /* noop */ } }) }
      this.debugMenuUI = []
      if (this.debugRadiusGfx) this.debugRadiusGfx.clear()
      if (this.debugHpBarGfx) this.debugHpBarGfx.clear()
      if (this.debugHitboxGfx) this.debugHitboxGfx.clear()
    }

    public clearSpecials() {
      const destroyAll = (arr: any[]) => arr.forEach(o => {
        if (!o) return
        if (o.sprite?.active) o.sprite.destroy()
        if (o.ring?.active) o.ring.destroy()
        if (o.line?.active) o.line.destroy()
        if (o.reticle?.active) o.reticle.destroy()
        if (o.gfx?.active) o.gfx.destroy()
        if (o.label?.active) o.label.destroy()
      })
      destroyAll(this.turrets); this.turrets = []
      destroyAll(this.blackholes); this.blackholes = []
      destroyAll(this.orbitalStrikes); this.orbitalStrikes = []
      destroyAll(this.railgunCharges); this.railgunCharges = []
      destroyAll(this.drones); this.drones = []
      destroyAll(this.plaguePools); this.plaguePools = []
      this.lockdownSlow = 0
    }

    public togglePause() {
      if (this.dead || this.levelUpPending || this.weapons.length === 0 || this.debugMenuOpen) return
      this.paused = !this.paused
      if (this.paused) {
        this.physics.world.pause()
        this.tweens.pauseAll()
        this.time.paused = true
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
        this.tweens.resumeAll()
        this.time.paused = false
        ;(this as any).game.loop.resetDelta()
      }
    }

    update(time: number, delta: number) {
      if (this.dead || this.levelUpPending || this.weapons.length === 0 || this.paused || this.debugMenuOpen) return

      this.gameTime += delta
      const totalSecs = Math.floor(this.gameTime / 1000)
      if (totalSecs !== this._lastTimerSecs) {
        this.timerText.setText(`${Math.floor(totalSecs / 60)}:${(totalSecs % 60).toString().padStart(2, '0')}`)
        this._lastTimerSecs = totalSecs
      }
      this.globalSpeedMult = 1.0

      const waves = getMapDef(this.selectedMap).waves
      const active = getActiveWave(waves, totalSecs)
      const idx = active ? active.index : waves.length
      if (idx !== this._lastWaveIndexApplied) {
        this._lastWaveIndexApplied = idx
        this.currentWaveIndex = idx
        this.currentWaveEndSec = active ? active.endSec : -1
        if (active) {
          const w = active.wave.weights
          const keys = Object.keys(w).filter(k => (w[k] ?? 0) > 0)
          showWaveBanner(this, `Wave ${idx + 1}: ${active.wave.name}`, keys)
          if (active.wave.isBoss) this.spawnBossWave()
        } else {
          const keys = ENEMY_TYPES.filter(t => t.weight > 0).map(t => t.key)
          showWaveBanner(this, 'ENDLESS — all enemies unleashed', keys)
        }
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

      const bulletList = this.bullets.getChildren() as any[]
      const enemyList = this.enemies.getChildren() as any[]
      const plx = this.player.x, ply = this.player.y
      for (let bi = bulletList.length - 1; bi >= 0; bi--) {
        const img = bulletList[bi]
        if (!img.active) continue
        if (img.x < -100 || img.x > WORLD + 100 || img.y < -100 || img.y > WORLD + 100) {
          img.destroy(); continue
        }
        const sx = img.getData('sx'), sy = img.getData('sy')
        if (sx !== undefined) {
          const dist = Phaser.Math.Distance.Between(sx, sy, img.x, img.y)
          if (img.getData('wt') === 'boomerang') {
            if (!img.getData('returning')) {
              if (dist > img.getData('dist')) {
                img.setData('returning', true)
                img.setData('hitEnemies', new Set())
              }
            } else {
              const bdx = plx - img.x, bdy = ply - img.y
              const bdist = Math.sqrt(bdx*bdx + bdy*bdy)
              const angle = Math.atan2(bdy, bdx)
              const spd = WEAPON_BASE['boomerang'].bulletSpd * 1.5
              img.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd)
              if (bdist < 20) { img.destroy(); continue }
            }
          } else if (dist > (img.getData('maxRange') ?? this.shotgunRange)) {
            img.destroy(); continue
          }
        }

        if (img.getData('homing') && enemyList.length > 0) {
          const nearest = this.physics.closest(img, enemyList) as any
          if (nearest) {
            const angle = Phaser.Math.Angle.Between(img.x, img.y, nearest.x, nearest.y)
            const curAngle = img.rotation
            const newAngle = Phaser.Math.Angle.RotateTo(curAngle, angle, 0.1)
            img.setRotation(newAngle)
            const spd = Phaser.Math.Distance.Between(0, 0, img.body.velocity.x, img.body.velocity.y)
            img.setVelocity(Math.cos(newAngle) * spd, Math.sin(newAngle) * spd)
          }
        }
      }

      if (this.hpRegen > 0 && this.hp < this.maxHp) {
        this._hpRegenAccum += this.hpRegen * delta / 1000
        if (this._hpRegenAccum >= 1) {
          const gain = Math.floor(this._hpRegenAccum)
          this._hpRegenAccum -= gain
          this.hp = Math.min(this.maxHp, this.hp + gain)
        }
      }

      this.drawUI()
      this.updateAura()
      this.updateScythes(delta)
      this.updateSpecials(delta)
      this.updatePlaguePools(delta)
      this.updateLockdownAura()
      this.drawDebugOverlays()
    }

    public updatePlaguePools(delta: number) {
      if (this.plaguePools.length === 0) return
      const px = this.player.x, py = this.player.y
      for (let i = this.plaguePools.length - 1; i >= 0; i--) {
        const p = this.plaguePools[i]
        p.age += delta
        if (p.age >= p.duration) {
          if (p.gfx?.active) p.gfx.destroy()
          this.plaguePools.splice(i, 1)
          continue
        }
        const lifeT = 1 - p.age / p.duration
        p.gfx.clear()
        p.gfx.fillStyle(0x65a30d, 0.35 * lifeT + 0.15).fillCircle(p.x, p.y, p.radius)
        p.gfx.lineStyle(2, 0xa3e635, 0.6 * lifeT).strokeCircle(p.x, p.y, p.radius)

        const dx = px - p.x, dy = py - p.y
        if (dx*dx + dy*dy <= p.radius * p.radius && this.iframes <= 0 && !this.debugInvuln) {
          p.tickAccum = (p.tickAccum ?? 0) + delta
          if (p.tickAccum >= 500) {
            p.tickAccum -= 500
            this.hp = Math.max(0, this.hp - 4)
            if (this.hp <= 0) this.showGameOver()
          }
        } else {
          p.tickAccum = 0
        }
      }
    }

    public updateLockdownAura() {
      let slow = 0
      const px = this.player.x, py = this.player.y
      const r = 200
      const r2 = r * r
      for (const e of this.enemies.getChildren() as any[]) {
        if (!e.active || !e.getData('lockdown')) continue
        const dx = px - e.x, dy = py - e.y
        if (dx*dx + dy*dy <= r2) { slow = 0.4; break }
      }
      this.lockdownSlow = slow
    }

    public updateScythes(delta: number) {
      if (!this.weapons.includes('scythes')) {
        this.scythes.clear(true, true)
        return
      }
      const count = this.scythesCount + this.bonusProjectiles
      const children = this.scythes.getChildren()
      const cx = playerEmitX(this), cy = playerEmitY(this)
      if (children.length !== count) {
        this.scythes.clear(true, true)
        for (let i = 0; i < count; i++) {
          const s = this.scythes.create(cx, cy, 'scythe')
          s.setDepth(6)
        }
      }

      const rotSpeed = 0.004
      const angleBase = this.gameTime * rotSpeed
      const areaMul = 1 + this.bonusArea
      const effectiveScythesRadius = this.scythesRadius * (1 + this.bonusArea / 3)
      children.forEach((s: any, i: number) => {
        const angle = angleBase + (i / count) * Math.PI * 2
        const x = cx + Math.cos(angle) * effectiveScythesRadius
        const y = cy + Math.sin(angle) * effectiveScythesRadius
        s.setPosition(x, y)
        s.setRotation(angle + Math.PI / 2)
        if (s.scaleX !== areaMul) { s.setScale(areaMul); s.refreshBody?.() }
      })
    }

    public updateAura() {
      if (!this.weapons.includes('aura')) {
        this.auraGfx.setVisible(false)
        return
      }

      this.auraGfx.setVisible(true)
      this.auraGfx.x = playerEmitX(this)
      this.auraGfx.y = playerEmitY(this)
      this.auraGfx.setRotation(this.gameTime * 0.0006)

      const effectiveAuraRadius = this.auraRadius * (1 + this.bonusArea)
      if (effectiveAuraRadius === this._lastAuraRadius) return
      this._lastAuraRadius = effectiveAuraRadius

      this.auraGfx.clear()
      const ptsCount = 32
      const baseR = effectiveAuraRadius

      this.auraGfx.lineStyle(2, 0xc4b5fd, 0.35)
      this.auraGfx.fillStyle(0xa78bfa, 0.15)

      this.auraGfx.beginPath()
      for (let i = 0; i <= ptsCount; i++) {
        const angle = (i / ptsCount) * Math.PI * 2
        const jagged = Math.sin(i * (Math.PI * 2 / ptsCount) * 8) * (baseR * 0.05)
        const r = baseR + jagged
        const x = Math.cos(angle) * r
        const y = Math.sin(angle) * r
        if (i === 0) this.auraGfx.moveTo(x, y)
        else this.auraGfx.lineTo(x, y)
      }
      this.auraGfx.closePath()
      this.auraGfx.fillPath()
      this.auraGfx.strokePath()
    }

    private _runJITWarmup() {
      const temps: any[] = []
      for (let i = 0; i < 15; i++) {
        const e = this.enemies.create(WORLD / 2 + i * 30, WORLD / 2 + 300, 'enemy_grunt')
        e.setData('hp', 100).setData('speed', 70)
        temps.push(e)
      }
      for (let i = 0; i < 25; i++) {
        const o = this.xpOrbs.create(WORLD / 2 + i * 20, WORLD / 2 + 400, 'orb')
        o.setData('xpValue', 1).setVelocity(0, 0)
        temps.push(o)
      }
      for (let i = 0; i < 8; i++) {
        const b = this.bullets.create(WORLD / 2 + i * 15, WORLD / 2 + 200, 'bullet')
        b.setData('sx', WORLD / 2).setData('sy', WORLD / 2).setData('dmg', 10).setVelocity(100, 0)
        temps.push(b)
      }
      for (let i = 0; i < 100; i++) {
        this.moveEnemies(16)
        this.pullOrbs()
        this.autoShoot(i * 100)
      }
      this.drawUI()
      temps.forEach(t => { if (t.active) t.destroy() })
    }

    // ─── weapons ────────────────────────────────────────────────────────

    public move() {
      if (!this.player || !this.cursors) return
      let vx = 0, vy = 0
      const left  = this.cursors.left?.isDown || this.wasd.left?.isDown
      const right = this.cursors.right?.isDown || this.wasd.right?.isDown
      const up    = this.cursors.up?.isDown || this.wasd.up?.isDown
      const down  = this.cursors.down?.isDown || this.wasd.down?.isDown

      const effSpeed = this.moveSpeed * (1 - this.lockdownSlow)
      if (left) vx -= effSpeed
      if (right) vx += effSpeed
      if (up) vy -= effSpeed
      if (down) vy += effSpeed
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

    public fireScythes() {
      // Logic handled in updateScythes for movement, 
      // but we need to check for hits.
      // We'll reuse fireAura-like logic or use physics overlap.
      // For simplicity, scythes damage is handled via physics overlap in create()
    }

    public fireTesla(angle: number, wt: WeaponType) {
      fireTesla(this, angle, wt)
    }

    public fireBoomerang(angle: number, wt: WeaponType) {
      fireBoomerang(this, angle, wt)
    }

    public fireRocket(angle: number, wt: WeaponType) {
      fireRocket(this, angle, wt)
    }

    public fireLaser(angle: number) {
      fireLaser(this, angle)
    }

    public fireTurret() {
      fireTurret(this)
    }

    public fireOrbital() {
      fireOrbital(this)
    }

    public fireBlackhole(angle: number, wt: WeaponType) {
      fireBlackhole(this, angle, wt)
    }

    public fireCryo(angle: number, wt: WeaponType) {
      fireCryo(this, angle, wt)
    }

    public fireRailgun(angle: number) {
      fireRailgun(this, angle)
    }

    public fireDrones() {
      fireDrones(this)
    }

    public fireCleave(angle: number) {
      fireCleave(this, angle)
    }

    public updateSpecials(delta: number) {
      updateSpecials(this, delta)
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

    public openDebugMenu() {
      openDebugMenu(this)
    }

    public closeDebugMenu() {
      closeDebugMenu(this)
    }

    public drawDebugOverlays() {
      drawDebugOverlays(this)
    }

    public recalculateStats() {
      this.moveSpeed = Math.round(200 * (1 + this.bonusMoveSpeed))
      this.shotgunDmg = Math.round(WEAPON_BASE['shotgun'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['shotgun'] ?? 0)))
      this.sniperDmg = Math.round(WEAPON_BASE['sniper'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['sniper'] ?? 0)))
      this.auraDmg = Math.round(WEAPON_BASE['aura'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['aura'] ?? 0)))
      this.machineGunDmg = Math.round(WEAPON_BASE['machinegun'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['machinegun'] ?? 0)))
      this.scythesDmg = Math.round(WEAPON_BASE['scythes'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['scythes'] ?? 0)))
      this.teslaDmg = Math.round(WEAPON_BASE['tesla'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['tesla'] ?? 0)))
      this.boomerangDmg = Math.round(WEAPON_BASE['boomerang'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['boomerang'] ?? 0)))
      this.rocketDmg = Math.round(WEAPON_BASE['rocket'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['rocket'] ?? 0)))
      this.laserDmg = Math.round(WEAPON_BASE['laser'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['laser'] ?? 0)))
      this.turretDmg = Math.round(WEAPON_BASE['turret'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['turret'] ?? 0)))
      this.orbitalDmg = Math.round(WEAPON_BASE['orbital'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['orbital'] ?? 0)))
      this.blackholeDmg = Math.round(WEAPON_BASE['blackhole'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['blackhole'] ?? 0)))
      this.cryoDmg = Math.round(WEAPON_BASE['cryo'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['cryo'] ?? 0)))
      this.railgunDmg = Math.round(WEAPON_BASE['railgun'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['railgun'] ?? 0)))
      this.droneDmg = Math.round(WEAPON_BASE['drones'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['drones'] ?? 0)))
      this.cleaveDmg = Math.round(WEAPON_BASE['cleave'].damage * (1 + this.bonusDamage + (this.bonusWeaponDmg['cleave'] ?? 0)))

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
      if (pt === 'movespeed')   this.bonusMoveSpeed += 0.20
      if (pt === 'bounty')      { this.magnetRadius += 35; this.orbMultiplier += 0.15 }
      if (pt === 'hp')          { this.maxHp += 25; this.hp += 25; this.hpRegen += 0.5 }
      if (pt === 'damage')      this.bonusDamage += 0.15
      if (pt === 'cooldown')    this.bonusCooldown += 0.08
      if (pt === 'area')        { this.bonusArea += 0.15; this._lastAuraRadius = -1 }
      if (pt === 'projectiles') this.bonusProjectiles += 1

      this.recalculateStats()
    }

    // ─── ui ─────────────────────────────────────────────────────────────

    public acquireGfx(depth = 15): any {
      if (this.gfxPoolFree.length > 0) {
        const g = this.gfxPoolFree.pop()
        g.setDepth(depth).setAlpha(1).setVisible(true)
        return g
      }
      return this.add.graphics().setDepth(depth)
    }

    public releaseGfx(gfx: any): void {
      gfx.clear().setVisible(false)
      this.gfxPoolFree.push(gfx)
    }

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

    public showModeSelection() {
      showModeSelection(this)
    }

    public showMapSelection() {
      showMapSelection(this)
    }

    public showWeaponSelection() {
      showWeaponSelection(this)
    }

    public showGameOver() {
      showGameOver(this)
    }

    public showShop() {
      showShop(this)
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
