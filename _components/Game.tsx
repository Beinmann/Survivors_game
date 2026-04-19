'use client'

import { useEffect, useRef } from 'react'

const WORLD = 3000
const SPAWN_INTERVAL_MS = 2500

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

      class GameScene extends Phaser.Scene {
        // --- objects ---
        private player!: Phaser.Physics.Arcade.Image
        private enemies!: Phaser.Physics.Arcade.Group
        private bullets!: Phaser.Physics.Arcade.Group
        private xpOrbs!: Phaser.Physics.Arcade.Group
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
        private wasd!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>

        // --- base state (reset in create) ---
        private weaponType: string | null = null
        private hp = 100; private maxHp = 100
        private xp = 0; private xpNeeded = 10
        private level = 1; private score = 0
        private shootCooldown = 0; private spawnTimer = 0
        private spawnRate = SPAWN_INTERVAL_MS
        private iframes = 0; private dead = false; private levelUpPending = false

        // --- upgradeable stats ---
        private moveSpeed = 200
        private shootRate = 750
        private extraBullets = 0     // shotgun: +pellets; sniper: unused; aura: unused
        private pierceCount = 2      // sniper: targets per bullet
        private rearShot = false
        private bulletSpd = 480
        private magnetRadius = 70
        private orbsPerKill = 1
        private auraRadius = 110
        private shotgunRange = 220   // max travel distance for shotgun pellets
        private shotgunDmg = 22; private sniperDmg = 60; private auraDmg = 10

        // --- timer ---
        private gameTime = 0

        // --- ui ---
        private hpBar!: Phaser.GameObjects.Graphics
        private xpBar!: Phaser.GameObjects.Graphics
        private levelText!: Phaser.GameObjects.Text
        private scoreText!: Phaser.GameObjects.Text
        private timerText!: Phaser.GameObjects.Text
        private paused = false
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private pauseUI: any[] = []

        constructor() { super('GameScene') }

        // ─── lifecycle ──────────────────────────────────────────────────────

        create() {
          this.weaponType = null
          this.hp = 100; this.maxHp = 100; this.xp = 0; this.xpNeeded = 10
          this.level = 1; this.score = 0; this.shootCooldown = 0
          this.spawnTimer = 0; this.spawnRate = SPAWN_INTERVAL_MS
          this.iframes = 0; this.dead = false; this.levelUpPending = false
          this.paused = false; this.pauseUI = []
          this.moveSpeed = 200; this.shootRate = 750
          this.extraBullets = 0; this.pierceCount = 2; this.rearShot = false
          this.bulletSpd = 480; this.magnetRadius = 70; this.orbsPerKill = 1
          this.auraRadius = 110; this.shotgunRange = 220
          this.shotgunDmg = 30; this.sniperDmg = 150; this.auraDmg = 10

          this.gameTime = 0

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
          this.physics.add.overlap(this.bullets, this.enemies,
            this.onBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this)
          this.physics.add.overlap(this.player, this.enemies,
            this.onPlayerHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this)
          this.physics.add.overlap(this.player, this.xpOrbs,
            this.onCollectOrb as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this)

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

          this.showWeaponSelection()
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

          this.move()
          this.autoShoot(time)
          this.moveEnemies()
          this.pullOrbs()

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
            this.shootCooldown = time + this.shootRate
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

          this.shootCooldown = time + this.shootRate
        }

        private fireShotgun(angle: number) {
          const pellets = 6 + this.extraBullets
          const cone = Math.PI / 5
          const step = pellets > 1 ? cone / (pellets - 1) : 0

          const fire = (a: number) => {
            const b = this.bullets.create(this.player.x, this.player.y, 'bullet') as Phaser.Physics.Arcade.Image
            b.setVelocity(Math.cos(a) * this.bulletSpd, Math.sin(a) * this.bulletSpd)
            b.setData('sx', this.player.x).setData('sy', this.player.y)
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
            b.setData('pierceLeft', this.pierceCount)
            b.setData('hitEnemies', new Set())
            b.setDepth(4)
          }
          fire(angle)
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
          const ring = this.add.graphics().setDepth(4)
          ring.lineStyle(2, 0xa78bfa, 0.7)
          ring.strokeCircle(this.player.x, this.player.y, this.auraRadius)
          this.tweens.add({ targets: ring, alpha: 0, duration: 420, onComplete: () => ring.destroy() })
        }

        // ─── movement / orbs ────────────────────────────────────────────────

        private moveEnemies() {
          const speed = 70 + Math.floor(this.gameTime / 10000) * 4
          for (const e of this.enemies.getChildren() as Phaser.Physics.Arcade.Image[]) {
            const angle = Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y)
            e.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
          }
        }

        private pullOrbs() {
          for (const o of this.xpOrbs.getChildren() as Phaser.Physics.Arcade.Image[]) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, o.x, o.y)
            if (dist < this.magnetRadius) {
              const angle = Phaser.Math.Angle.Between(o.x, o.y, this.player.x, this.player.y)
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
            // sniper — piercing bullet
            const hitSet: Set<Phaser.GameObjects.GameObject> = b.getData('hitEnemies')
            if (hitSet.has(e)) return
            hitSet.add(e)
            this.damageEnemy(e, this.sniperDmg)
            const remaining = pierceLeft - 1
            if (remaining <= 0) b.destroy()
            else b.setData('pierceLeft', remaining)
          } else {
            // shotgun — destroy bullet on contact
            b.destroy()
            this.damageEnemy(e, this.shotgunDmg)
          }
        }

        private onPlayerHitEnemy(_p: Phaser.GameObjects.GameObject, _e: Phaser.GameObjects.GameObject) {
          if (this.iframes > 0) return
          this.hp = Math.max(0, this.hp - 10)
          this.iframes = 900
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
          for (let i = 0; i < this.orbsPerKill; i++) {
            const ox = e.x + (Math.random() - 0.5) * 16
            const oy = e.y + (Math.random() - 0.5) * 16
            ;(this.xpOrbs.create(ox, oy, 'orb') as Phaser.Physics.Arcade.Image).setDepth(2).setVelocity(0, 0)
          }
          e.destroy()
          this.score++
          this.scoreText.setText(`Score: ${this.score}`)
        }

        // ─── progression ────────────────────────────────────────────────────

        private onCollectOrb(_p: Phaser.GameObjects.GameObject, orb: Phaser.GameObjects.GameObject) {
          ;(orb as Phaser.Physics.Arcade.Image).destroy()
          this.xp++
          if (this.xp >= this.xpNeeded) {
            this.xp = 0
            this.xpNeeded = Math.floor(this.xpNeeded * 1.6)
            this.level++
            this.levelText.setText(`Level ${this.level}`)
            this.showUpgradeMenu()
          }
        }

        private getUpgrades() {
          const wt = this.weaponType
          return [
            {
              name: 'Swift Feet',
              desc: 'Move 25% faster',
              apply: () => { this.moveSpeed = Math.round(this.moveSpeed * 1.25) },
            },
            {
              name: 'Extra Barrel',
              desc: wt === 'sniper' ? 'Pierce one more enemy per shot'
                  : wt === 'aura'   ? 'Expand aura radius by 30px'
                  :                   '+2 pellets per shot',
              apply: () => {
                if (wt === 'sniper') this.pierceCount++
                else if (wt === 'aura') this.auraRadius += 30
                else this.extraBullets += 2
              },
            },
            {
              name: 'XP Magnet',
              desc: 'Pull orbs from 80px further away',
              apply: () => { this.magnetRadius += 80 },
            },
            {
              name: 'Rapid Fire',
              desc: wt === 'aura' ? 'Pulse 22% more often' : 'Shoot 22% faster',
              apply: () => { this.shootRate = Math.max(180, Math.round(this.shootRate * 0.78)) },
            },
            {
              name: 'Bounty Hunter',
              desc: 'Enemies drop one extra XP orb',
              apply: () => { this.orbsPerKill++ },
            },
            {
              name: 'Vital Surge',
              desc: 'Restore 40 HP and raise max HP by 20',
              apply: () => { this.maxHp += 20; this.hp = Math.min(this.maxHp, this.hp + 40) },
            },
            {
              name: wt === 'aura' ? 'Wide Field' : 'Supersonic',
              desc: wt === 'shotgun' ? 'Increase shot range by 60px'
                  : wt === 'aura'    ? 'Expand aura radius by 40px'
                  :                    'Bullets travel 30% faster',
              apply: () => {
                if (wt === 'shotgun') this.shotgunRange += 60
                else if (wt === 'aura') this.auraRadius += 40
                else this.bulletSpd = Math.round(this.bulletSpd * 1.3)
              },
            },
            {
              name: wt === 'aura' ? 'Iron Will' : 'Back Shooter',
              desc: wt === 'aura' ? '+25 max HP and restore 25 HP'
                  :                  'Also fire behind you',
              apply: () => {
                if (wt === 'aura') { this.maxHp += 25; this.hp = Math.min(this.maxHp, this.hp + 25) }
                else this.rearShot = true
              },
            },
            {
              name: wt === 'sniper' ? 'AP Rounds'
                  : wt === 'aura'   ? 'Overload'
                  :                   'Heavy Slugs',
              desc: wt === 'sniper' ? 'Bullets deal 40% more damage'
                  : wt === 'aura'   ? 'Aura pulses 35% harder'
                  :                   'Pellets deal 30% more damage',
              apply: () => {
                if (wt === 'sniper') this.sniperDmg = Math.round(this.sniperDmg * 1.4)
                else if (wt === 'aura') this.auraDmg = Math.round(this.auraDmg * 1.35)
                else this.shotgunDmg = Math.round(this.shotgunDmg * 1.3)
              },
            },
          ]
        }

        private showUpgradeMenu() {
          this.levelUpPending = true
          this.physics.world.pause()

          const { width: w, height: h } = this.cameras.main
          const upgrades = [...this.getUpgrades()].sort(() => Math.random() - 0.5).slice(0, 3)

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

            const bg = this.add.graphics().setScrollFactor(0).setDepth(41)
            const draw = (hover: boolean) => {
              bg.clear()
              bg.fillStyle(hover ? 0x2a2a3e : 0x16161e)
              bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10)
              bg.lineStyle(2, hover ? 0xfbbf24 : 0x3a3a5a)
              bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10)
            }
            draw(false)

            const nameText = this.add.text(cx, cy - 32, upgrade.name, {
              fontSize: '15px', color: '#ffffff', stroke: '#000', strokeThickness: 2,
              align: 'center', wordWrap: { width: cardW - 16 },
            }).setOrigin(0.5).setScrollFactor(0).setDepth(42)

            const descText = this.add.text(cx, cy + 18, upgrade.desc, {
              fontSize: '12px', color: '#aaaacc',
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
        }

        // ─── spawning ───────────────────────────────────────────────────────

        private spawnWave() {
          const gameTimeSecs = this.gameTime / 1000
          const count = 3 + Math.floor(gameTimeSecs / 20)
          const baseHp = Math.round(25 + Math.floor(gameTimeSecs / 10) * 12)
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2
            const dist = 550 + Math.random() * 250
            const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 10, WORLD - 10)
            const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 10, WORLD - 10)
            const e = this.enemies.create(x, y, 'enemy') as Phaser.Physics.Arcade.Image
            e.setDepth(3).setData('hp', baseHp)
          }
          this.spawnTimer = this.spawnRate
        }

        // ─── ui ─────────────────────────────────────────────────────────────

        private drawUI() {
          const barW = 160
          this.hpBar.clear()
          this.hpBar.fillStyle(0x1a1a1a).fillRect(10, 50, barW, 10)
          this.hpBar.fillStyle(0xef4444).fillRect(10, 50, barW * (this.hp / this.maxHp), 10)
          this.xpBar.clear()
          this.xpBar.fillStyle(0x1a1a1a).fillRect(10, 64, barW, 6)
          this.xpBar.fillStyle(0xa78bfa).fillRect(10, 64, barW * (this.xp / this.xpNeeded), 6)
        }

        private showWeaponSelection() {
          const { width: w, height: h } = this.cameras.main

          const WEAPONS = [
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
              stats: 'Pierces 2 enemies · high dmg · 1400ms cooldown',
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
          ]

          const overlay = this.add.graphics().setScrollFactor(0).setDepth(50)
          overlay.fillStyle(0x000000, 0.88).fillRect(0, 0, w, h)

          const cardW = Math.min(200, (w - 80) / 3 - 10)
          const cardH = 160
          const gap = cardW + 20
          const startX = w / 2 - gap

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

          make('enemy', g => {
            g.fillStyle(0xef4444); g.fillRoundedRect(0, 0, 22, 22, 3)
            g.lineStyle(2, 0xfca5a5); g.strokeRoundedRect(1, 1, 20, 20, 3)
          }, 22, 22)

          make('bullet', g => {
            g.fillStyle(0xfbbf24); g.fillCircle(4, 4, 4)
          }, 8, 8)

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
