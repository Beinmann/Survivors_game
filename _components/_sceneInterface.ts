import { WeaponType, PassiveType } from './_types'

export interface IGameScene {
  // --- objects ---
  player: any
  enemies: any
  bullets: any
  xpOrbs: any
  obstacles: any
  powerUps: any
  cursors: any
  wasd: any
  time: any
  tweens: any
  physics: any
  add: any
  cameras: any
  input: any
  textures: any
  make: any
  scene: any
  children: any

  // --- state ---
  weapons: WeaponType[]
  weaponLevels: Partial<Record<WeaponType, number>>
  weaponCooldowns: Partial<Record<WeaponType, number>>
  weaponShootRates: Partial<Record<WeaponType, number>>
  weaponBulletSpd: Partial<Record<WeaponType, number>>
  weaponRearShot: Partial<Record<WeaponType, boolean>>
  passives: PassiveType[]
  passiveLevels: Partial<Record<PassiveType, number>>
  hp: number
  maxHp: number
  xp: number
  xpNeeded: number
  level: number
  score: number
  spawnTimer: number
  spawnRate: number
  iframes: number
  dead: boolean
  levelUpPending: boolean
  moveSpeed: number
  extraBullets: number
  pierceCount: number
  magnetRadius: number
  orbMultiplier: number
  auraRadius: number
  shotgunRange: number
  shotgunDmg: number
  sniperDmg: number
  auraDmg: number
  machineGunDmg: number
  machineGunBurst: number
  machineGunPierce: boolean
  powerUpSpawnTimer: number
  frenzyTimer: number
  freezeTimer: number
  gameTime: number
  globalSpeedMult: number
  nextBossWave: number
  paused: boolean
  showBaseStats: boolean
  pauseUI: any[]

  // --- bonus tracking ---
  bonusMoveSpeed: number
  bonusDamage: number
  bonusCooldown: number
  bonusWeaponDmg: Partial<Record<WeaponType, number>>
  bonusWeaponBulletSpd: Partial<Record<WeaponType, number>>
  flatWeaponShootRateReductions: Partial<Record<WeaponType, number>>

  // --- ui objects ---
  hpBar: any
  xpBar: any
  weaponHUDGfx: any
  auraGfx: any
  weaponHUDLvlTexts: any[]
  passiveHUDLvlTexts: any[]
  passiveHUDIcons: any[]
  levelText: any
  scoreText: any
  timerText: any
  effectText: any

  // --- methods ---
  resetState(): void
  togglePause(): void
  spawnWave(): void
  spawnBossWave(): void
  spawnObstacles(): void
  spawnPowerUp(): void
  applyPowerUp(type: string): void
  onCollectPowerUp(p: any, pu: any): void
  onBulletHitEnemy(b: any, e: any): void
  onPlayerHitEnemy(p: any, e: any): void
  damageEnemy(e: any, dmg: number, flash?: boolean): void
  killEnemy(e: any): void
  onCollectOrb(p: any, o: any): void
  getWeaponUpgrades(): any[]
  getUpgrades(): any[]
  showUpgradeMenu(): void
  recalculateStats(): void
  addStatsPanel(collect: (o: any) => void): void
  buildStatLines(): any[]
  drawUI(): void
  drawWeaponHUD(): void
  drawWeaponIcon(cx: number, cy: number, wt: WeaponType): void
  showTitleScreen(): void
  showWeaponSelection(): void
  showGameOver(): void
  unlockWeapon(wt: WeaponType): void
  rebuildWeaponHUDTexts(): void
  unlockPassive(pt: PassiveType): void
  applyPassiveBoost(pt: PassiveType): void
  buildTextures(): void
  effectiveShootRate(wt: WeaponType): number
  fireShotgun(angle: number, wt: WeaponType): void
  fireSniper(angle: number, wt: WeaponType): void
  fireMachineGun(angle: number, wt: WeaponType): void
  fireAura(): void
  move(): void
  autoShoot(time: number): void
  moveEnemies(delta: number): void
  pullOrbs(): void
  tintConsolidatedOrb(orb: any, value: number): void
}
