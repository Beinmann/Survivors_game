'use client'

import { useEffect, useRef } from 'react'

const WORLD = 12000
const SPAWN_INTERVAL_MS = 2500
const MAX_ORBS = 180
const DESPAWN_DIST = 2000
const CONSOLIDATE_NEARBY_RADIUS = 400  // only orbs within this distance of player are eligible
const CONSOLIDATE_THRESHOLD = 12       // minimum nearby orbs required to trigger consolidation
const CONSOLIDATE_EDGE_MIN = 260       // consolidated orb placed at this distance from player (≈ screen edge)
const CONSOLIDATE_EDGE_MAX = 420
const CONSOLIDATE_INTERVAL_MS = 2500   // how often to check for consolidation

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    let phaserGame: { destroy: (removeCanvas: boolean) => void } | null = null
    let cancelled = false

    async function init() {
      // Phaser ESM build uses named exports only — no default export
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Phaser = (await import('phaser')) as any
      if (cancelled) return

      const ENEMY_TYPES = [
        { key: 'enemy_grunt',   color: 0xef4444, stroke: 0xfca5a5, size: 22, radius: 3,  hp: 30,   speed: 70,  unlockSecs: 0,       weight: 1.0, orbBonus: 0 },
        { key: 'enemy_brute',   color: 0xf97316, stroke: 0xfed7aa, size: 30, radius: 6,  hp: 110,  speed: 52,  unlockSecs: 30,      weight: 0.3, orbBonus: 4 },
        { key: 'enemy_speeder', color: 0x22d3ee, stroke: 0xa5f3fc, size: 16, radius: 1,  hp: 28,   speed: 140, unlockSecs: 60,      weight: 1.0, orbBonus: 0 },
        { key: 'enemy_tank',    color: 0x7c3aed, stroke: 0xc4b5fd, size: 36, radius: 2,  hp: 300,  speed: 36,  unlockSecs: 100,     weight: 0.5, orbBonus: 2 },
        { key: 'enemy_elite',   color: 0xfbbf24, stroke: 0xfde68a, size: 22, radius: 3,  hp: 170,  speed: 108, unlockSecs: 150,     weight: 0.8, orbBonus: 1 },
        { key: 'enemy_charger', color: 0xff4500, stroke: 0xff8c69, size: 24, radius: 4,  hp: 80,   speed: 55,  unlockSecs: 75,      weight: 0.7, orbBonus: 1 },
        { key: 'enemy_ghost',   color: 0xe0e0ff, stroke: 0xffffff, size: 20, radius: 10, hp: 45,   speed: 110, unlockSecs: 90,      weight: 0.9, orbBonus: 0 },
        { key: 'enemy_bomber',  color: 0xcc2200, stroke: 0xff6644, size: 28, radius: 3,  hp: 90,   speed: 38,  unlockSecs: 130,     weight: 0.4, orbBonus: 2 },
        { key: 'enemy_swarm',   color: 0xec4899, stroke: 0xf9a8d4, size: 12, radius: 6,  hp: 15,   speed: 160, unlockSecs: 180,     weight: 0.8, orbBonus: 0 },
        { key: 'enemy_boss',    color: 0xff0000, stroke: 0xff8080, size: 52, radius: 8,  hp: 1500, speed: 47,  unlockSecs: 9999999, weight: 0.0, orbBonus: 18 },
      ]

      type WeaponType = 'shotgun' | 'sniper' | 'aura' | 'machinegun'

      class GameScene extends Phaser.Scene {
        // --- objects ---
        private player!: Phaser.Physics.Arcade.Image
        private enemies!: Phaser.Physics.Arcade.Group
        private bullets!: Phaser.Physics.Arcade.Group
        private xpOrbs!: Phaser.Physics.Arcade.Group
        private obstacles!: Phaser.Physics.Arcade.StaticGroup
        private powerUps!: Phaser.Physics.Arcade.Group
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
        private wasd!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>

        // --- base state (canonical values in resetState()) ---
        private weaponType: WeaponType | null = null
        private hp = 0; private maxHp = 0
        private xp = 0; private xpNeeded = 0
        private level = 0; private score = 0
        private shootCooldown = 0; private spawnTimer = 0
        private spawnRate = 0
        private iframes = 0; private dead = false; private levelUpPending = false

        // --- upgradeable stats ---
        private moveSpeed = 0
        private shootRate = 0
        private extraBullets = 0
        private pierceCount = 0
        private rearShot = false
        private bulletSpd = 0
        private magnetRadius = 0
        private orbMultiplier = 0
        private auraRadius = 0
        private shotgunRange = 0
        private shotgunDmg = 0; private sniperDmg = 0; private auraDmg = 0
        private machineGunDmg = 0; private machineGunBurst = 0; private machineGunPierce = false
        private weaponLevel = 0

        // --- power-up state ---
        private powerUpSpawnTimer = 0
        private frenzyTimer = 0
        private freezeTimer = 0

        // --- timer ---
        private gameTime = 0
        private globalSpeedMult = 0
        private nextBossWave = 0
        private consolidateTimer = 0

        // --- ui ---
        private hpBar!: Phaser.GameObjects.Graphics
        private xpBar!: Phaser.GameObjects.Graphics
        private levelText!: Phaser.GameObjects.Text
        private scoreText!: Phaser.GameObjects.Text
        private timerText!: Phaser.GameObjects.Text
        private effectText!: Phaser.GameObjects.Text
        private paused = false
        private pauseUI: { destroy(): void }[] = []

        constructor() { super('GameScene') }

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

          this.cursors = this.input.keyboard!.createCursorKeys()
          this.wasd = {
            up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
          }

          this.input.keyboard!.on('keydown-ESC', () => this.togglePause())

          this.physics.add.collider(this.enemies, this.enemies)
          this.physics.add.collider(this.player, this.obstacles)
          this.physics.add.collider(this.enemies, this.obstacles, undefined,
            (enemy: Phaser.GameObjects.GameObject) =>
              !(enemy as Phaser.Physics.Arcade.Image).getData('isGhost'), this)
          this.physics.add.collider(this.bullets, this.obstacles,
            (bullet: Phaser.GameObjects.GameObject) => { (bullet as Phaser.Physics.Arcade.Image).destroy() }, undefined, this)
          this.physics.add.overlap(this.bullets, this.enemies,
            this.onBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this)
          this.physics.add.overlap(this.player, this.enemies,
            this.onPlayerHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this)
          this.physics.add.overlap(this.player, this.xpOrbs,
            this.onCollectOrb as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this)
          this.physics.add.overlap(this.player, this.powerUps,
            this.onCollectPowerUp as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this)

          this.hpBar = this.add.graphics().setScrollFactor(0).setDepth(20)
          this.xpBar = this.add.graphics().setScrollFactor(0).setDepth(20)
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

        private resetState() {
          this.weaponType = null
          this.hp = 100; this.maxHp = 100; this.xp = 0; this.xpNeeded = 10
          this.level = 1; this.score = 0; this.shootCooldown = 0
          this.spawnTimer = 0; this.spawnRate = SPAWN_INTERVAL_MS
          this.iframes = 0; this.dead = false; this.levelUpPending = false
          this.paused = false; this.pauseUI = []
          this.moveSpeed = 200; this.shootRate = 750
          this.extraBullets = 0; this.pierceCount = 2; this.rearShot = false
          this.bulletSpd = 480; this.magnetRadius = 70; this.orbMultiplier = 1.0
          this.auraRadius = 110; this.shotgunRange = 220
          this.shotgunDmg = 30; this.sniperDmg = 150; this.auraDmg = 10
          this.machineGunDmg = 2; this.machineGunBurst = 1; this.machineGunPierce = false; this.weaponLevel = 1
          this.frenzyTimer = 0; this.freezeTimer = 0; this.powerUpSpawnTimer = 15000 + Math.random() * 30000
          this.gameTime = 0; this.globalSpeedMult = 1.0; this.nextBossWave = 180; this.consolidateTimer = 0
        }

        private togglePause() {
          if (this.dead || this.levelUpPending || this.weaponType === null) return
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
          if (this.dead || this.levelUpPending || this.weaponType === null || this.paused) return

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
          this.consolidateTimer -= delta
          if (this.consolidateTimer <= 0) {
            this.consolidateOrbs()
            this.consolidateTimer = CONSOLIDATE_INTERVAL_MS
          }

          this.powerUpSpawnTimer -= delta
          if (this.powerUpSpawnTimer <= 0) {
            this.spawnPowerUp()
            this.powerUpSpawnTimer = 10000 + Math.random() * 40000
          }
          if (this.frenzyTimer > 0) this.frenzyTimer = Math.max(0, this.frenzyTimer - delta)
          if (this.freezeTimer > 0) this.freezeTimer = Math.max(0, this.freezeTimer - delta)
          for (const p of this.powerUps.getChildren() as Phaser.Physics.Arcade.Image[]) {
            const lbl = p.getData('label') as Phaser.GameObjects.Text | undefined
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
            const img = b as Phaser.Physics.Arcade.Image
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
        }

        // ─── weapons ────────────────────────────────────────────────────────

        private move() {
          let vx = 0, vy = 0
          if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= this.moveSpeed
          if (this.cursors.right.isDown || this.wasd.right.isDown) vx += this.moveSpeed
          if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= this.moveSpeed
          if (this.cursors.down.isDown || this.wasd.down.isDown) vy += this.moveSpeed
          if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707 }
          this.player.setVelocity(vx, vy)
        }

        private autoShoot(time: number) {
          if (time < this.shootCooldown) return

          if (this.weaponType === 'aura') {
            this.fireAura()
            this.shootCooldown = time + this.effectiveShootRate()
            return
          }

          const targets = this.enemies.getChildren() as Phaser.Physics.Arcade.Image[]
          if (!targets.length) return

          const nearest = targets.reduce((a, b) =>
            Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y) <=
            Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y) ? a : b)

          const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearest.x, nearest.y)

          if (this.weaponType === 'shotgun') this.fireShotgun(angle)
          else if (this.weaponType === 'sniper') this.fireSniper(angle)
          else if (this.weaponType === 'machinegun') this.fireMachineGun(angle)

          this.shootCooldown = time + this.effectiveShootRate()
        }

        private fireShotgun(angle: number) {
          const pellets = 6 + this.extraBullets
          const cone = Math.PI / 5
          const step = pellets > 1 ? cone / (pellets - 1) : 0

          const fire = (a: number) => {
            const b = this.bullets.create(this.player.x, this.player.y, 'bullet') as Phaser.Physics.Arcade.Image
            b.setVelocity(Math.cos(a) * this.bulletSpd, Math.sin(a) * this.bulletSpd)
            b.setRotation(a)
            b.setData('sx', this.player.x).setData('sy', this.player.y).setData('dmg', this.shotgunDmg)
            b.setDepth(4)
          }
          for (let i = 0; i < pellets; i++) fire(angle + (pellets > 1 ? -cone / 2 + step * i : 0))
          if (this.rearShot) {
            const rp = Math.max(3, Math.floor(pellets / 2))
            const rs = rp > 1 ? cone / (rp - 1) : 0
            for (let i = 0; i < rp; i++) fire(angle + Math.PI + (rp > 1 ? -cone / 2 + rs * i : 0))
          }
        }

        private fireSniper(angle: number) {
          const fire = (a: number) => {
            const b = this.bullets.create(this.player.x, this.player.y, 'sniperBullet') as Phaser.Physics.Arcade.Image
            b.setVelocity(Math.cos(a) * this.bulletSpd, Math.sin(a) * this.bulletSpd)
            b.setRotation(a)
            b.setData('dmg', this.sniperDmg)
            b.setData('pierceLeft', this.pierceCount)
            b.setData('hitEnemies', new Set())
            b.setDepth(4)
          }
          fire(angle)
          if (this.rearShot) fire(angle + Math.PI)
        }

        private fireMachineGun(angle: number) {
          const fire = (a: number) => {
            const b = this.bullets.create(this.player.x, this.player.y, 'mgBullet') as Phaser.Physics.Arcade.Image
            b.setVelocity(Math.cos(a) * this.bulletSpd, Math.sin(a) * this.bulletSpd)
            b.setRotation(a)
            b.setData('dmg', this.machineGunDmg)
            if (this.machineGunPierce) {
              b.setData('pierceLeft', 1)
              b.setData('hitEnemies', new Set())
            }
            b.setDepth(4)
          }
          const offset = 0.022
          for (let i = 0; i < this.machineGunBurst; i++) {
            fire(angle + (this.machineGunBurst > 1 ? (i - (this.machineGunBurst - 1) / 2) * offset : 0))
          }
          if (this.rearShot) fire(angle + Math.PI)
        }

        private fireAura() {
          for (const e of [...this.enemies.getChildren()] as Phaser.Physics.Arcade.Image[]) {
            if (!e.active) continue
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y)
            if (dist <= this.auraRadius) this.damageEnemy(e, this.auraDmg, false)
          }
          this.showAuraPulse()
        }

        private showAuraPulse() {
          const cx = this.player.x
          const cy = this.player.y
          const spikes = 14
          const outerR = this.auraRadius
          const innerR = this.auraRadius * 0.68

          // random rotation each pulse
          const rotation = Math.random() * Math.PI * 2

          // pick 2–3 spike indices to be dramatically longer
          const prominentCount = 2 + Math.floor(Math.random() * 2)
          const prominent = new Set<number>()
          while (prominent.size < prominentCount) prominent.add(Math.floor(Math.random() * spikes))

          // generate points once so fill and stroke share the same shape
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
            pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r })
          }

          const draw = (g: Phaser.GameObjects.Graphics) => {
            g.moveTo(pts[0].x, pts[0].y)
            for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y)
            g.closePath()
          }

          const ring = this.add.graphics().setDepth(4)

          ring.fillStyle(0xa78bfa, 0.13)
          ring.beginPath(); draw(ring); ring.fillPath()

          ring.lineStyle(2, 0xc4b5fd, 0.9)
          ring.beginPath(); draw(ring); ring.strokePath()

          this.tweens.add({ targets: ring, alpha: 0, duration: 420, onComplete: () => ring.destroy() })
        }

        // ─── movement / orbs ────────────────────────────────────────────────

        private moveEnemies(delta: number) {
          for (const e of this.enemies.getChildren() as Phaser.Physics.Arcade.Image[]) {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) > DESPAWN_DIST) { e.destroy(); continue }
            if (this.freezeTimer > 0) { e.setVelocity(0, 0); continue }

            const angle = Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y)
            const speed = ((e.getData('speed') as number) ?? 70) * this.globalSpeedMult

            if (e.getData('isCharger')) {
              const chargeState = e.getData('chargeState') as string
              const chargeTimer = (e.getData('chargeTimer') as number) - delta
              e.setData('chargeTimer', chargeTimer)

              if (chargeState === 'idle') {
                e.setVelocity(Math.cos(angle) * speed * 0.45, Math.sin(angle) * speed * 0.45)
                if (chargeTimer <= 0) {
                  e.setData('chargeState', 'telegraph')
                  e.setData('chargeTimer', 600)
                  e.setTint(0xff6600)
                }
              } else if (chargeState === 'telegraph') {
                e.setVelocity(0, 0)
                if (chargeTimer <= 0) {
                  e.setData('chargeAngle', angle)
                  e.setData('chargeState', 'charging')
                  e.setData('chargeTimer', 900)
                  e.clearTint()
                }
              } else {
                const chargeAngle = e.getData('chargeAngle') as number
                e.setVelocity(Math.cos(chargeAngle) * 380, Math.sin(chargeAngle) * 380)
                if (chargeTimer <= 0) {
                  e.setData('chargeState', 'idle')
                  e.setData('chargeTimer', 2500 + Math.random() * 2000)
                }
              }
              continue
            }

            e.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
          }
        }

        private pullOrbs() {
          for (const o of this.xpOrbs.getChildren() as Phaser.Physics.Arcade.Image[]) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, o.x, o.y)
            const angle = Phaser.Math.Angle.Between(o.x, o.y, this.player.x, this.player.y)
            if (o.getData('vacuumed')) {
              o.setVelocity(Math.cos(angle) * 520, Math.sin(angle) * 520)
            } else if (dist < this.magnetRadius) {
              o.setVelocity(Math.cos(angle) * (120 + (this.magnetRadius - dist) * 3),
                            Math.sin(angle) * (120 + (this.magnetRadius - dist) * 3))
            } else {
              o.setVelocity(0, 0)
            }
          }
        }

        // ─── combat ─────────────────────────────────────────────────────────

        private onBulletHitEnemy(bullet: Phaser.GameObjects.GameObject, enemy: Phaser.GameObjects.GameObject) {
          const b = bullet as Phaser.Physics.Arcade.Image
          const e = enemy as Phaser.Physics.Arcade.Image
          if (!b.active || !e.active) return

          const pierceLeft = b.getData('pierceLeft') as number | undefined

          if (pierceLeft !== undefined) {
            const hitSet: Set<Phaser.GameObjects.GameObject> = b.getData('hitEnemies')
            if (hitSet.has(e)) return
            hitSet.add(e)
            const dmg = (b.getData('dmg') as number) ?? this.sniperDmg
            this.damageEnemy(e, dmg)
            const remaining = pierceLeft - 1
            if (remaining <= 0) b.destroy()
            else b.setData('pierceLeft', remaining)
          } else {
            const dmg = (b.getData('dmg') as number) ?? this.shotgunDmg
            b.destroy()
            this.damageEnemy(e, dmg)
          }
        }

        private onPlayerHitEnemy(_p: Phaser.GameObjects.GameObject, _e: Phaser.GameObjects.GameObject) {
          if (this.iframes > 0) return
          const contactDmg = 10 + Math.floor((this.gameTime / 1000) / 60) * 4
          this.hp = Math.max(0, this.hp - contactDmg)
          this.iframes = 650
          if (this.hp <= 0) this.showGameOver()
        }

        private damageEnemy(e: Phaser.Physics.Arcade.Image, dmg: number, flash = true) {
          if (!e.active) return
          const hp = (e.getData('hp') as number) - dmg
          if (hp <= 0) { this.killEnemy(e); return }
          e.setData('hp', hp)
          if (flash) {
            e.setTint(0xffffff)
            this.time.delayedCall(90, () => { if (e.active) e.clearTint() })
          }
        }

        private killEnemy(e: Phaser.Physics.Arcade.Image) {
          if (!e.active) return

          if (e.getData('explodes')) {
            const expRadius = 80
            const expFlash = this.add.graphics().setDepth(8)
            expFlash.fillStyle(0xff4400, 0.55).fillCircle(e.x, e.y, expRadius)
            expFlash.lineStyle(2, 0xff8800, 0.9).strokeCircle(e.x, e.y, expRadius)
            this.tweens.add({ targets: expFlash, alpha: 0, duration: 450, onComplete: () => expFlash.destroy() })
            if (this.iframes <= 0 &&
                Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) <= expRadius) {
              const contactDmg = 10 + Math.floor((this.gameTime / 1000) / 60) * 4
              this.hp = Math.max(0, this.hp - contactDmg)
              this.iframes = 650
              if (this.hp <= 0) this.showGameOver()
            }
          }

          const orbBonus = (e.getData('orbBonus') as number) ?? 0
          const orbCount = 1 + orbBonus

          for (let i = 0; i < orbCount; i++) {
            if (this.xpOrbs.countActive() < MAX_ORBS) {
              const ox = e.x + (Math.random() - 0.5) * 16
              const oy = e.y + (Math.random() - 0.5) * 16
              const orb = (this.xpOrbs.create(ox, oy, 'orb') as Phaser.Physics.Arcade.Image)
                .setDepth(2).setVelocity(0, 0)
              orb.setData('xpValue', 1)
            }
          }
          e.destroy()
          this.score++
          this.scoreText.setText(`Score: ${this.score}`)
        }

        private tintConsolidatedOrb(orb: Phaser.Physics.Arcade.Image, value: number) {
          const t = Math.min(1, (value - 1) / 15)
          const g = Math.round(0x50 * (1 - t))
          orb.setTint((0xff << 16) | (g << 8))
          orb.setScale(1 + Math.min(1.5, (value - 1) * 0.08))
        }

        private consolidateOrbs() {
          const nearbyOrbs = (this.xpOrbs.getChildren() as Phaser.Physics.Arcade.Image[]).filter(o => {
            if (!o.active) return false
            return Phaser.Math.Distance.Between(this.player.x, this.player.y, o.x, o.y) < CONSOLIDATE_NEARBY_RADIUS
          })
          if (nearbyOrbs.length < CONSOLIDATE_THRESHOLD) return

          const totalXp = nearbyOrbs.reduce((sum, o) => sum + (((o.getData('xpValue') as number) ?? 1)), 0)
          for (const o of nearbyOrbs) o.destroy()

          const angle = Math.random() * Math.PI * 2
          const dist = CONSOLIDATE_EDGE_MIN + Math.random() * (CONSOLIDATE_EDGE_MAX - CONSOLIDATE_EDGE_MIN)
          const cx = this.player.x + Math.cos(angle) * dist
          const cy = this.player.y + Math.sin(angle) * dist
          const combined = (this.xpOrbs.create(
            Phaser.Math.Clamp(cx, 0, WORLD),
            Phaser.Math.Clamp(cy, 0, WORLD),
            'orb'
          ) as Phaser.Physics.Arcade.Image).setDepth(2).setVelocity(0, 0)
          combined.setData('xpValue', totalXp)
          this.tintConsolidatedOrb(combined, totalXp)
        }

        // ─── progression ────────────────────────────────────────────────────

        private onCollectOrb(_p: Phaser.GameObjects.GameObject, orb: Phaser.GameObjects.GameObject) {
          const o = orb as Phaser.Physics.Arcade.Image
          const xpValue = (o.getData('xpValue') as number) ?? 1
          o.destroy()
          this.xp += xpValue * this.orbMultiplier
          if (this.xp >= this.xpNeeded) {
            this.xp = 0
            this.xpNeeded = Math.floor(this.xpNeeded * 1.25)
            this.level++
            this.levelText.setText(`Level ${this.level}`)
            this.showUpgradeMenu()
          }
        }

        private getWeaponUpgrade(): { name: string; desc: string; apply: () => void; isWeaponUpgrade: true } | null {
          if (this.weaponLevel >= 9 || this.weaponType === null) return null
          const lvl = this.weaponLevel
          type Step = { desc: string; apply: () => void }
          const paths: Record<string, Step[]> = {
            shotgun: [
              { desc: '+2 pellets  ·  −50ms cooldown',             apply: () => { this.extraBullets += 2; this.shootRate = Math.max(100, this.shootRate - 50) } },
              { desc: '+30% damage  ·  +50px range',               apply: () => { this.shotgunDmg = Math.round(this.shotgunDmg * 1.3); this.shotgunRange += 50 } },
              { desc: 'Unlock rear shot',                          apply: () => { this.rearShot = true } },
              { desc: '+2 pellets  ·  +30% damage',                apply: () => { this.extraBullets += 2; this.shotgunDmg = Math.round(this.shotgunDmg * 1.3) } },
              { desc: '−80ms cooldown  ·  +60px range',            apply: () => { this.shootRate = Math.max(100, this.shootRate - 80); this.shotgunRange += 60 } },
              { desc: '+40% damage  ·  +2 pellets',                apply: () => { this.shotgunDmg = Math.round(this.shotgunDmg * 1.4); this.extraBullets += 2 } },
              { desc: '−80ms cooldown  ·  +60px range',            apply: () => { this.shootRate = Math.max(100, this.shootRate - 80); this.shotgunRange += 60 } },
              { desc: '+60% damage  ·  +4 pellets  ·  −100ms',     apply: () => { this.shotgunDmg = Math.round(this.shotgunDmg * 1.6); this.extraBullets += 4; this.shootRate = Math.max(100, this.shootRate - 100) } },
            ],
            sniper: [
              { desc: '+1 pierce  ·  +50% damage',                 apply: () => { this.pierceCount++; this.sniperDmg = Math.round(this.sniperDmg * 1.5) } },
              { desc: '−250ms cooldown  ·  +30% bullet speed',     apply: () => { this.shootRate = Math.max(300, this.shootRate - 250); this.bulletSpd = Math.round(this.bulletSpd * 1.3) } },
              { desc: 'Rear shot  ·  +50% damage',                 apply: () => { this.rearShot = true; this.sniperDmg = Math.round(this.sniperDmg * 1.5) } },
              { desc: '+2 pierce  ·  −200ms cooldown',             apply: () => { this.pierceCount += 2; this.shootRate = Math.max(300, this.shootRate - 200) } },
              { desc: '+70% damage  ·  +30% bullet speed',         apply: () => { this.sniperDmg = Math.round(this.sniperDmg * 1.7); this.bulletSpd = Math.round(this.bulletSpd * 1.3) } },
              { desc: '+2 pierce  ·  −200ms cooldown',             apply: () => { this.pierceCount += 2; this.shootRate = Math.max(300, this.shootRate - 200) } },
              { desc: '+80% damage  ·  +30% bullet speed',         apply: () => { this.sniperDmg = Math.round(this.sniperDmg * 1.8); this.bulletSpd = Math.round(this.bulletSpd * 1.3) } },
              { desc: '+3 pierce  ·  +100% damage  ·  −200ms',     apply: () => { this.pierceCount += 3; this.sniperDmg = Math.round(this.sniperDmg * 2.0); this.shootRate = Math.max(300, this.shootRate - 200) } },
            ],
            aura: [
              { desc: '+30% damage',                               apply: () => { this.auraDmg = Math.round(this.auraDmg * 1.3) } },
              { desc: '+25px radius  ·  −80ms cooldown',           apply: () => { this.auraRadius += 25; this.shootRate = Math.max(100, this.shootRate - 80) } },
              { desc: '+50% damage  ·  +25px radius',              apply: () => { this.auraDmg = Math.round(this.auraDmg * 1.5); this.auraRadius += 25 } },
              { desc: '−100ms cooldown  ·  +30px radius',          apply: () => { this.shootRate = Math.max(100, this.shootRate - 100); this.auraRadius += 30 } },
              { desc: '+60% damage  ·  +30px radius',              apply: () => { this.auraDmg = Math.round(this.auraDmg * 1.6); this.auraRadius += 30 } },
              { desc: '−100ms cooldown  ·  +35px radius',          apply: () => { this.shootRate = Math.max(100, this.shootRate - 100); this.auraRadius += 35 } },
              { desc: '+80% damage  ·  +35px radius',              apply: () => { this.auraDmg = Math.round(this.auraDmg * 1.8); this.auraRadius += 35 } },
              { desc: '+100% damage  ·  +50px radius  ·  −100ms',  apply: () => { this.auraDmg = Math.round(this.auraDmg * 2.0); this.auraRadius += 50; this.shootRate = Math.max(100, this.shootRate - 100) } },
            ],
            machinegun: [
              { desc: '+40% damage  ·  −15ms cooldown',            apply: () => { this.machineGunDmg = Math.round(this.machineGunDmg * 1.4); this.shootRate = Math.max(50, this.shootRate - 15) } },
              { desc: '+40% damage  ·  −15ms cooldown',            apply: () => { this.machineGunDmg = Math.round(this.machineGunDmg * 1.4); this.shootRate = Math.max(50, this.shootRate - 15) } },
              { desc: 'Piercing rounds — bullets pass through 1 enemy', apply: () => { this.machineGunPierce = true } },
              { desc: '+40% damage  ·  −15ms cooldown',            apply: () => { this.machineGunDmg = Math.round(this.machineGunDmg * 1.4); this.shootRate = Math.max(50, this.shootRate - 15) } },
              { desc: 'Burst fire — 2 bullets per shot',           apply: () => { this.machineGunBurst = 2 } },
              { desc: 'Rear shot  ·  +30% damage',                 apply: () => { this.rearShot = true; this.machineGunDmg = Math.round(this.machineGunDmg * 1.3) } },
              { desc: '3-round burst  ·  −20ms cooldown',          apply: () => { this.machineGunBurst = 3; this.shootRate = Math.max(50, this.shootRate - 20) } },
              { desc: '+60% damage  ·  −20ms cooldown',            apply: () => { this.machineGunDmg = Math.round(this.machineGunDmg * 1.6); this.shootRate = Math.max(50, this.shootRate - 20) } },
            ],
          }
          const step = paths[this.weaponType]?.[lvl - 1]
          if (!step) return null
          return {
            name: `Weapon Lvl ${lvl + 1}`,
            desc: step.desc,
            apply: () => { step.apply(); this.weaponLevel++ },
            isWeaponUpgrade: true,
          }
        }

        private getUpgrades() {
          const passives = [
            { name: 'Swift Feet',     desc: 'Move 25% faster',                   apply: () => { this.moveSpeed = Math.round(this.moveSpeed * 1.25) } },
            { name: 'XP Magnet',      desc: 'Pull orbs from 80px further away',  apply: () => { this.magnetRadius += 80 } },
            { name: 'Bounty Hunter',  desc: 'Gain 35% more XP from every orb collected', apply: () => { this.orbMultiplier += 0.35 } },
            { name: 'Vital Surge',    desc: 'Restore 40 HP and raise max HP by 20', apply: () => { this.maxHp += 20; this.hp = Math.min(this.maxHp, this.hp + 40) } },
            { name: 'Power Core',     desc: '+20% weapon damage',                apply: () => { this.shotgunDmg = Math.round(this.shotgunDmg * 1.2); this.sniperDmg = Math.round(this.sniperDmg * 1.2); this.auraDmg = Math.round(this.auraDmg * 1.2); this.machineGunDmg = Math.round(this.machineGunDmg * 1.2) } },
            { name: 'Overclock',      desc: 'Fire 15% faster',                   apply: () => { this.shootRate = Math.max(50, Math.round(this.shootRate * 0.85)) } },
          ]
          const weaponUpgrade = this.getWeaponUpgrade()
          // weapon upgrade appears 3× in the pool for higher weight
          const pool = [...passives, ...(weaponUpgrade ? [weaponUpgrade, weaponUpgrade, weaponUpgrade] : [])]
          pool.sort(() => Math.random() - 0.5)
          const seen = new Set<string>()
          const result: typeof passives = []
          for (const u of pool) {
            if (!seen.has(u.name) && result.length < 3) { seen.add(u.name); result.push(u) }
          }
          return result
        }

        private showUpgradeMenu() {
          this.levelUpPending = true
          this.physics.world.pause()

          const { width: w, height: h } = this.cameras.main
          const upgrades = this.getUpgrades()

          const overlay = this.add.graphics().setScrollFactor(0).setDepth(40)
          overlay.fillStyle(0x000000, 0.75).fillRect(0, 0, w, h)

          const title = this.add.text(w / 2, h / 2 - 130, `LEVEL ${this.level} — Choose an upgrade`, {
            fontSize: '22px', color: '#fbbf24', stroke: '#000', strokeThickness: 4,
          }).setOrigin(0.5).setScrollFactor(0).setDepth(41)

          const cardW = Math.min(190, (w - 80) / 3 - 10)
          const cardH = 140
          const gap = cardW + 20
          const startX = w / 2 - gap

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tag = (o: any) => { o.__menuCard = true }
          tag(overlay); tag(title)

          upgrades.forEach((upgrade, i) => {
            const cx = startX + i * gap
            const cy = h / 2

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const isWeapon = !!(upgrade as any).isWeaponUpgrade
            const idleColor  = isWeapon ? 0x1a1f2e : 0x16161e
            const hoverColor = isWeapon ? 0x1e2a40 : 0x2a2a3e
            const idleBorder = isWeapon ? 0x3b82f6 : 0x3a3a5a
            const hoverBorder = isWeapon ? 0x60a5fa : 0xfbbf24

            const bg = this.add.graphics().setScrollFactor(0).setDepth(41)
            const draw = (hover: boolean) => {
              bg.clear()
              bg.fillStyle(hover ? hoverColor : idleColor)
              bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10)
              bg.lineStyle(hover || isWeapon ? 2 : 1, hover ? hoverBorder : idleBorder)
              bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10)
            }
            draw(false)

            const nameText = this.add.text(cx, cy - 32, upgrade.name, {
              fontSize: '15px', color: isWeapon ? '#93c5fd' : '#ffffff', stroke: '#000', strokeThickness: 2,
              align: 'center', wordWrap: { width: cardW - 16 },
            }).setOrigin(0.5).setScrollFactor(0).setDepth(42)

            const descText = this.add.text(cx, cy + 18, upgrade.desc, {
              fontSize: '12px', color: isWeapon ? '#bfdbfe' : '#aaaacc',
              align: 'center', wordWrap: { width: cardW - 16 },
            }).setOrigin(0.5).setScrollFactor(0).setDepth(42)

            const zone = this.add.zone(cx, cy, cardW, cardH)
              .setScrollFactor(0).setDepth(43).setInteractive({ useHandCursor: true })

            zone.on('pointerover', () => draw(true))
            zone.on('pointerout', () => draw(false))
            zone.on('pointerdown', () => {
              upgrade.apply()
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              this.children.list.filter((o: any) => o.__menuCard).forEach((o: any) => o.destroy())
              this.levelUpPending = false
              this.physics.world.resume()
            })

            tag(bg); tag(nameText); tag(descText); tag(zone)
          })

          this.addStatsPanel(o => tag(o))
        }

        // ─── stats panel ────────────────────────────────────────────────────

        private buildStatLines() {
          const wt = this.weaponType
          const rate = (1000 / this.shootRate).toFixed(1)
          const lines: { label: string; value: string }[] = [
            { label: 'HP',           value: `${this.hp} / ${this.maxHp}` },
            { label: 'Move Speed',   value: String(this.moveSpeed) },
            { label: 'Magnet',       value: String(this.magnetRadius) },
            { label: 'Orb ×',        value: this.orbMultiplier.toFixed(2) },
            { label: 'Weapon Lvl',   value: `${this.weaponLevel} / 9` },
          ]
          if (wt === 'shotgun') {
            lines.push(
              { label: 'Fire Rate',  value: `${rate}/s` },
              { label: 'Pellets',    value: String(6 + this.extraBullets) },
              { label: 'Range',      value: String(this.shotgunRange) },
              { label: 'Damage',     value: String(this.shotgunDmg) },
              { label: 'Rear Shot',  value: this.rearShot ? 'Yes' : 'No' },
            )
          } else if (wt === 'sniper') {
            lines.push(
              { label: 'Fire Rate',  value: `${rate}/s` },
              { label: 'Pierce',     value: String(this.pierceCount) },
              { label: 'Blt Speed',  value: String(this.bulletSpd) },
              { label: 'Damage',     value: String(this.sniperDmg) },
              { label: 'Rear Shot',  value: this.rearShot ? 'Yes' : 'No' },
            )
          } else if (wt === 'aura') {
            lines.push(
              { label: 'Pulse Rate', value: `${rate}/s` },
              { label: 'Radius',     value: String(this.auraRadius) },
              { label: 'Damage',     value: String(this.auraDmg) },
            )
          } else if (wt === 'machinegun') {
            lines.push(
              { label: 'Fire Rate',  value: `${rate}/s` },
              { label: 'Burst',      value: String(this.machineGunBurst) + (this.rearShot ? '+rear' : '') },
              { label: 'Pierce',     value: this.machineGunPierce ? 'Yes' : 'No' },
              { label: 'Damage',     value: String(this.machineGunDmg) },
            )
          }
          return lines
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private addStatsPanel(collect: (o: any) => void) {
          const { width: w, height: h } = this.cameras.main
          const lines = this.buildStatLines()
          const panelW = 175
          const rowH = 17
          const panelH = 26 + lines.length * rowH + 8
          const px = w - panelW - 14
          const py = h - panelH - 14

          const bg = this.add.graphics().setScrollFactor(0).setDepth(46)
          bg.fillStyle(0x080810, 0.88)
          bg.fillRoundedRect(px, py, panelW, panelH, 6)
          bg.lineStyle(1, 0x3a3a5a, 1)
          bg.strokeRoundedRect(px, py, panelW, panelH, 6)
          collect(bg)

          const title = this.add.text(px + panelW / 2, py + 8, 'STATS', {
            fontSize: '11px', color: '#fbbf24',
          }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(47)
          collect(title)

          lines.forEach(({ label, value }, i) => {
            const y = py + 24 + i * rowH
            collect(this.add.text(px + 10, y, label, {
              fontSize: '11px', color: '#9ca3af',
            }).setScrollFactor(0).setDepth(47))
            collect(this.add.text(px + panelW - 10, y, value, {
              fontSize: '11px', color: '#e5e7eb',
            }).setOrigin(1, 0).setScrollFactor(0).setDepth(47))
          })
        }

        // ─── spawning ───────────────────────────────────────────────────────

        private spawnPressure(): number {
          const n = this.enemies.countActive()
          if (n <= 4)  return 0.1   // 10× faster — field is nearly empty
          if (n <= 12) return 0.3   // ~3× faster
          if (n <= 25) return 0.6   // ~1.7× faster
          if (n <= 45) return 1.0   // base rate
          return 2.5                 // 2.5× slower — field is packed
        }

        private spawnWave() {
          const gameTimeSecs = this.gameTime / 1000
          const count = 2 + Math.floor(gameTimeSecs / 25) + Math.floor(gameTimeSecs / 120)
          const available = ENEMY_TYPES.filter(t => gameTimeSecs >= t.unlockSecs)
          const totalWeight = available.reduce((s, t) => s + t.weight, 0)
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2
            const dist = 550 + Math.random() * 250
            const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 10, WORLD - 10)
            const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 10, WORLD - 10)
            let r = Math.random() * totalWeight
            const type = available.find(t => (r -= t.weight) <= 0) ?? available[available.length - 1]

            const spawnOne = (sx: number, sy: number) => {
              const e = this.enemies.create(sx, sy, type.key) as Phaser.Physics.Arcade.Image
              e.setDepth(3).setData('hp', type.hp).setData('speed', type.speed).setData('orbBonus', type.orbBonus)
              if (type.key === 'enemy_charger') {
                e.setData('isCharger', true).setData('chargeState', 'idle').setData('chargeTimer', 2000 + Math.random() * 2000)
              }
              if (type.key === 'enemy_ghost') {
                e.setAlpha(0.45).setData('isGhost', true)
              }
              if (type.key === 'enemy_bomber') {
                e.setData('explodes', true)
              }
            }

            if (type.key === 'enemy_swarm') {
              for (let j = 0; j < 5; j++) {
                const sa = Math.random() * Math.PI * 2
                const sr = Math.random() * 50
                spawnOne(
                  Phaser.Math.Clamp(x + Math.cos(sa) * sr, 10, WORLD - 10),
                  Phaser.Math.Clamp(y + Math.sin(sa) * sr, 10, WORLD - 10),
                )
              }
            } else {
              spawnOne(x, y)
            }
          }
          this.spawnTimer = this.spawnRate * this.spawnPressure()
        }

        private spawnBossWave() {
          const { width: w, height: h } = this.cameras.main
          const warn = this.add.text(w / 2, h / 2 - 60, '⚠ BOSS INCOMING', {
            fontSize: '26px', color: '#ef4444', stroke: '#000000', strokeThickness: 5,
          }).setOrigin(0.5).setScrollFactor(0).setDepth(30)
          this.tweens.add({ targets: warn, alpha: 0, duration: 3000, onComplete: () => warn.destroy() })

          this.time.delayedCall(3000, () => {
            if (this.dead) return
            const angle = Math.random() * Math.PI * 2
            const bx = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * 620, 10, WORLD - 10)
            const by = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * 620, 10, WORLD - 10)
            const boss = this.enemies.create(bx, by, 'enemy_boss') as Phaser.Physics.Arcade.Image
            boss.setDepth(3).setData('hp', 1500).setData('speed', 47).setData('orbBonus', 18)
          })
        }

        // ─── ui ─────────────────────────────────────────────────────────────

        private effectiveShootRate() {
          return this.frenzyTimer > 0 ? this.shootRate / 2 : this.shootRate
        }

        private drawUI() {
          const barW = 160
          this.hpBar.clear()
          this.hpBar.fillStyle(0x1a1a1a).fillRect(10, 50, barW, 10)
          this.hpBar.fillStyle(0xef4444).fillRect(10, 50, barW * (this.hp / this.maxHp), 10)
          this.xpBar.clear()
          this.xpBar.fillStyle(0x1a1a1a).fillRect(10, 64, barW, 6)
          this.xpBar.fillStyle(0xa78bfa).fillRect(10, 64, barW * (this.xp / this.xpNeeded), 6)
          const effects: string[] = []
          if (this.frenzyTimer > 0) effects.push(`⚡ FRENZY ${(this.frenzyTimer / 1000).toFixed(1)}s`)
          if (this.freezeTimer > 0) effects.push(`❄ FREEZE ${(this.freezeTimer / 1000).toFixed(1)}s`)
          this.effectText.setText(effects.join('   '))
        }

        private showTitleScreen() {
          const { width: w, height: h } = this.cameras.main
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ui: any[] = []

          const overlay = this.add.graphics().setScrollFactor(0).setDepth(50)
          overlay.fillStyle(0x000000, 0.96).fillRect(0, 0, w, h)
          ui.push(overlay)

          const title = this.add.text(w / 2, h / 2 - 110, 'SURVIVORS', {
            fontSize: '52px', color: '#4ade80', stroke: '#000000', strokeThickness: 6,
          }).setOrigin(0.5).setScrollFactor(0).setDepth(51)
          ui.push(title)
          this.tweens.add({
            targets: title, scaleX: 1.04, scaleY: 1.04,
            duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          })

          ui.push(this.add.text(w / 2, h / 2 - 58, 'a browser game', {
            fontSize: '14px', color: '#6b7280',
          }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

          const btn = this.add.text(w / 2, h / 2 + 20, '[ START ]', {
            fontSize: '24px', color: '#4ade80', stroke: '#000000', strokeThickness: 3,
          }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setInteractive({ useHandCursor: true })
          ui.push(btn)

          ui.push(this.add.text(w / 2, h / 2 + 50, 'or press Space', {
            fontSize: '12px', color: '#4b5563',
          }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

          ui.push(this.add.text(w / 2, h / 2 + 100, 'Photosensitivity warning: contains flashing lights', {
            fontSize: '10px', color: '#6b7280',
          }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

          ui.push(this.add.text(w / 2, h / 2 + 116, 'and rapidly changing visuals. Play with caution if photosensitive.', {
            fontSize: '10px', color: '#4b5563',
          }).setOrigin(0.5).setScrollFactor(0).setDepth(51))

          const dismiss = () => {
            this.input.keyboard!.off('keydown-SPACE', dismiss)
            ui.forEach(o => o.destroy())
            this.showWeaponSelection()
          }

          btn.on('pointerover', () => btn.setColor('#86efac'))
          btn.on('pointerout', () => btn.setColor('#4ade80'))
          btn.on('pointerdown', dismiss)
          this.input.keyboard!.on('keydown-SPACE', dismiss)
        }

        private showWeaponSelection() {
          const { width: w, height: h } = this.cameras.main

          const WEAPONS: { type: WeaponType; name: string; desc: string; stats: string; accent: number; setup: () => void }[] = [
            {
              type: 'shotgun', name: 'Shotgun',
              desc: 'Fires a cone of pellets.\nDeadly up close, useless at range.',
              stats: '6 pellets · 550ms cooldown',
              accent: 0xf97316,
              setup: () => { this.shootRate = 550; this.bulletSpd = 320 },
            },
            {
              type: 'sniper', name: 'Sniper Rifle',
              desc: 'Single piercing shot.\nSlower but punches through enemies.',
              stats: 'Pierces 2 enemies · 1400ms cooldown',
              accent: 0x60a5fa,
              setup: () => { this.shootRate = 1400; this.bulletSpd = 680 },
            },
            {
              type: 'aura', name: 'Shock Aura',
              desc: 'Electric pulse in all directions.\nSlow to kill but fully omnidirectional.',
              stats: '110px radius · 500ms pulse',
              accent: 0xa78bfa,
              setup: () => { this.shootRate = 500 },
            },
            {
              type: 'machinegun', name: 'Machine Gun',
              desc: 'Rapid single shots.\nBuilds into a multi-barrel onslaught.',
              stats: '100ms cooldown · scales to 7-way spread',
              accent: 0x4ade80,
              setup: () => { this.shootRate = 100; this.bulletSpd = 520 },
            },
          ]

          const overlay = this.add.graphics().setScrollFactor(0).setDepth(50)
          overlay.fillStyle(0x000000, 0.88).fillRect(0, 0, w, h)

          const cardW = Math.min(170, (w - 60) / 4 - 10)
          const cardH = 160
          const gap = cardW + 14
          const startX = w / 2 - gap * 1.5

          const titleText = this.add.text(w / 2, h / 2 - 160, 'Choose your weapon', {
            fontSize: '26px', color: '#ffffff', stroke: '#000', strokeThickness: 4,
          }).setOrigin(0.5).setScrollFactor(0).setDepth(51)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const allUI: any[] = [overlay, titleText]

          WEAPONS.forEach((weapon, i) => {
            const cx = startX + i * gap
            const cy = h / 2

            const bg = this.add.graphics().setScrollFactor(0).setDepth(51)
            const draw = (hover: boolean) => {
              bg.clear()
              bg.fillStyle(hover ? 0x1e1e30 : 0x111118)
              bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12)
              bg.lineStyle(hover ? 3 : 2, hover ? weapon.accent : 0x2a2a3a)
              bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12)
            }
            draw(false)

            const nameText = this.add.text(cx, cy - 52, weapon.name, {
              fontSize: '16px', color: '#ffffff', stroke: '#000', strokeThickness: 2,
              align: 'center',
            }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

            const descText = this.add.text(cx, cy - 4, weapon.desc, {
              fontSize: '12px', color: '#ccccdd',
              align: 'center', wordWrap: { width: cardW - 16 },
            }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

            const statsText = this.add.text(cx, cy + 56, weapon.stats, {
              fontSize: '11px', color: `#${weapon.accent.toString(16).padStart(6, '0')}`,
              align: 'center', wordWrap: { width: cardW - 16 },
            }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

            const zone = this.add.zone(cx, cy, cardW, cardH)
              .setScrollFactor(0).setDepth(53).setInteractive({ useHandCursor: true })

            zone.on('pointerover', () => draw(true))
            zone.on('pointerout', () => draw(false))
            zone.on('pointerdown', () => {
              weapon.setup()
              this.weaponType = weapon.type
              allUI.forEach(o => o.destroy())
              ;[bg, nameText, descText, statsText, zone].forEach(o => o.destroy())
              this.spawnWave()
            })

            allUI.push(bg, nameText, descText, statsText, zone)
          })
        }

        private showGameOver() {
          this.dead = true
          this.player.setVelocity(0, 0)
          for (const e of this.enemies.getChildren())
            (e as Phaser.Physics.Arcade.Image).setVelocity(0, 0)

          const { width: w, height: h } = this.cameras.main
          this.add.graphics().setScrollFactor(0).setDepth(30)
            .fillStyle(0x000000, 0.65).fillRect(0, 0, w, h)

          this.add.text(w / 2, h / 2 - 60, 'GAME OVER', {
            fontSize: '36px', color: '#ef4444', stroke: '#000', strokeThickness: 5,
          }).setOrigin(0.5).setScrollFactor(0).setDepth(31)

          const t = Math.floor(this.gameTime / 1000)
          const timeStr = `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`
          this.add.text(w / 2, h / 2 - 10, `Score: ${this.score}  ·  Time: ${timeStr}`, {
            fontSize: '18px', color: '#ffffff', stroke: '#000', strokeThickness: 3,
          }).setOrigin(0.5).setScrollFactor(0).setDepth(31)

          const btn = this.add.text(w / 2, h / 2 + 50, '[ Restart ]', {
            fontSize: '22px', color: '#4ade80', stroke: '#000', strokeThickness: 3,
          }).setOrigin(0.5).setScrollFactor(0).setDepth(31).setInteractive({ useHandCursor: true })

          btn.on('pointerover', () => btn.setColor('#86efac'))
          btn.on('pointerout', () => btn.setColor('#4ade80'))
          btn.on('pointerdown', () => this.scene.restart())
        }

        // ─── power-ups ──────────────────────────────────────────────────────

        private readonly PU_TYPES = [
          { key: 'pu_vacuum', label: 'XP Vacuum',   color: 0xa78bfa, stroke: 0xc4b5fd },
          { key: 'pu_frenzy', label: 'Frenzy',      color: 0xf97316, stroke: 0xfed7aa },
          { key: 'pu_nuke',   label: 'Nuke',        color: 0xef4444, stroke: 0xfca5a5 },
          { key: 'pu_freeze', label: 'Time Freeze', color: 0x22d3ee, stroke: 0xa5f3fc },
          { key: 'pu_heal',   label: 'Full Heal',   color: 0x4ade80, stroke: 0x86efac },
          { key: 'pu_orbs',   label: 'Orb Shower',  color: 0xfbbf24, stroke: 0xfde68a },
        ]

        private spawnPowerUp() {
          const type = this.PU_TYPES[Math.floor(Math.random() * this.PU_TYPES.length)]
          const angle = Math.random() * Math.PI * 2
          const dist = 350 + Math.random() * 350
          const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 80, WORLD - 80)
          const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 80, WORLD - 80)

          const pu = this.powerUps.create(x, y, type.key) as Phaser.Physics.Arcade.Image
          pu.setDepth(6).setData('type', type.key)

          const lbl = this.add.text(x, y - 26, type.label, {
            fontSize: '11px', color: '#ffffff', stroke: '#000000', strokeThickness: 2,
          }).setOrigin(0.5).setDepth(7)
          pu.setData('label', lbl)

          this.tweens.add({
            targets: pu, scaleX: 1.18, scaleY: 1.18,
            duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          })
        }

        private onCollectPowerUp(_p: Phaser.GameObjects.GameObject, powerUp: Phaser.GameObjects.GameObject) {
          const pu = powerUp as Phaser.Physics.Arcade.Image
          if (!pu.active) return
          const type = pu.getData('type') as string
          ;(pu.getData('label') as Phaser.GameObjects.Text | undefined)?.destroy()
          pu.destroy()
          this.applyPowerUp(type)
        }

        private applyPowerUp(type: string) {
          if (type === 'pu_vacuum') {
            for (const o of this.xpOrbs.getChildren() as Phaser.Physics.Arcade.Image[]) {
              if (o.active) o.setData('vacuumed', true)
            }
          } else if (type === 'pu_frenzy') {
            this.frenzyTimer = 15000
          } else if (type === 'pu_nuke') {
            const cam = this.cameras.main
            const l = cam.scrollX - 40, r = cam.scrollX + cam.width + 40
            const t = cam.scrollY - 40, b = cam.scrollY + cam.height + 40
            for (const e of [...this.enemies.getChildren()] as Phaser.Physics.Arcade.Image[]) {
              if (e.active && e.x >= l && e.x <= r && e.y >= t && e.y <= b) this.killEnemy(e)
            }
            const flash = this.add.graphics().setScrollFactor(0).setDepth(25)
            flash.fillStyle(0xffffff, 0.35).fillRect(0, 0, cam.width, cam.height)
            this.tweens.add({ targets: flash, alpha: 0, duration: 350, onComplete: () => flash.destroy() })
          } else if (type === 'pu_freeze') {
            this.freezeTimer = 5000
            const cam = this.cameras.main
            const flash = this.add.graphics().setScrollFactor(0).setDepth(25)
            flash.fillStyle(0x22d3ee, 0.2).fillRect(0, 0, cam.width, cam.height)
            this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() })
          } else if (type === 'pu_heal') {
            this.hp = this.maxHp
          } else if (type === 'pu_orbs') {
            for (let i = 0; i < 25; i++) {
              const a = (i / 25) * Math.PI * 2
              const r = 60 + Math.random() * 80
              const ox = this.player.x + Math.cos(a) * r
              const oy = this.player.y + Math.sin(a) * r
              ;(this.xpOrbs.create(ox, oy, 'orb') as Phaser.Physics.Arcade.Image).setDepth(2).setVelocity(0, 0).setData('xpValue', 1)
            }
          }
        }

        private spawnObstacles() {
          const cx = WORLD / 2, cy = WORLD / 2
          const safeR = 700
          const place = (key: string, count: number) => {
            for (let i = 0; i < count; i++) {
              let x: number, y: number
              do {
                x = 100 + Math.random() * (WORLD - 200)
                y = 100 + Math.random() * (WORLD - 200)
              } while (Phaser.Math.Distance.Between(x, y, cx, cy) < safeR)
              this.obstacles.create(x, y, key).setDepth(3)
            }
          }
          place('obs_pillar', 260)
          place('obs_hwall',  130)
          place('obs_vwall',  130)
        }

        private buildTextures() {
          const make = (key: string, draw: (g: Phaser.GameObjects.Graphics) => void, w: number, h: number) => {
            if (this.textures.exists(key)) return
            const g = this.make.graphics()
            draw(g); g.generateTexture(key, w, h); g.destroy()
          }

          make('player', g => {
            g.fillStyle(0x4ade80); g.fillRoundedRect(0, 0, 26, 26, 5)
            g.lineStyle(2, 0x86efac); g.strokeRoundedRect(1, 1, 24, 24, 5)
          }, 26, 26)

          for (const t of ENEMY_TYPES) {
            make(t.key, g => {
              g.fillStyle(t.color); g.fillRoundedRect(0, 0, t.size, t.size, t.radius)
              g.lineStyle(2, t.stroke); g.strokeRoundedRect(1, 1, t.size - 2, t.size - 2, t.radius)
            }, t.size, t.size)
          }

          for (const t of this.PU_TYPES) {
            make(t.key, g => {
              // diamond (rotated square) drawn as polygon
              const s = 14
              g.fillStyle(t.color, 1)
              g.fillTriangle(s, 0,  s*2, s,  s, s*2)
              g.fillTriangle(s, 0,  0,   s,  s, s*2)
              g.lineStyle(2, t.stroke, 1)
              g.strokeTriangle(s, 0,  s*2, s,  s, s*2)
              g.strokeTriangle(s, 0,  0,   s,  s, s*2)
            }, 28, 28)
          }

          make('obs_pillar', g => {
            g.fillStyle(0x2d3748); g.fillRect(0, 0, 48, 48)
            g.lineStyle(2, 0x4a5568); g.strokeRect(1, 1, 46, 46)
            g.lineStyle(1, 0x4a5568, 0.4)
            g.lineBetween(8, 8, 40, 40); g.lineBetween(40, 8, 8, 40)
          }, 48, 48)

          make('obs_hwall', g => {
            g.fillStyle(0x2d3748); g.fillRect(0, 0, 160, 40)
            g.lineStyle(2, 0x4a5568); g.strokeRect(1, 1, 158, 38)
            for (let x = 40; x < 160; x += 40) { g.lineStyle(1, 0x4a5568, 0.35); g.lineBetween(x, 4, x, 36) }
          }, 160, 40)

          make('obs_vwall', g => {
            g.fillStyle(0x2d3748); g.fillRect(0, 0, 40, 160)
            g.lineStyle(2, 0x4a5568); g.strokeRect(1, 1, 38, 158)
            for (let y = 40; y < 160; y += 40) { g.lineStyle(1, 0x4a5568, 0.35); g.lineBetween(4, y, 36, y) }
          }, 40, 160)

          make('bullet', g => {
            g.fillStyle(0xfbbf24); g.fillCircle(4, 4, 4)
          }, 8, 8)

          make('mgBullet', g => {
            g.fillStyle(0x4ade80); g.fillRect(0, 1, 10, 4)
            g.lineStyle(1, 0x86efac); g.strokeRect(0, 1, 10, 4)
          }, 10, 6)

          make('sniperBullet', g => {
            g.fillStyle(0x93c5fd); g.fillRect(0, 1, 14, 6)
            g.lineStyle(1, 0xbfdbfe); g.strokeRect(0, 1, 14, 6)
          }, 14, 8)

          make('orb', g => {
            g.fillStyle(0xa78bfa); g.fillCircle(5, 5, 5)
            g.lineStyle(1, 0xc4b5fd); g.strokeCircle(5, 5, 4)
          }, 10, 10)
        }
      }

      phaserGame = new Phaser.Game({
        type: Phaser.AUTO,
        width: container.clientWidth,
        height: 520,
        backgroundColor: '#111111',
        parent: container,
        physics: { default: 'arcade', arcade: { debug: false } },
        scene: [GameScene],
        audio: { noAudio: true },
      })
    }

    init()
    return () => {
      cancelled = true
      phaserGame?.destroy(true)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-zinc-800"
    />
  )
}
