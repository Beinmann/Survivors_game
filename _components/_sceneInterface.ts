import { WeaponType, PassiveType } from './_types'
import { MapKey } from './_maps'

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
  passives: PassiveType[]
  passiveLevels: Partial<Record<PassiveType, number>>
  hp: number
  maxHp: number
  hpRegen: number
  _hpRegenAccum: number
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
  scythesDmg: number
  scythesCount: number
  scythesRadius: number
  scythesLifeSteal: boolean
  teslaDmg: number
  teslaJumps: number
  teslaStun: boolean
  teslaArcBack: boolean
  boomerangDmg: number
  boomerangCount: number
  boomerangDist: number
  boomerangPierce: boolean
  rocketDmg: number
  rocketRadius: number
  rocketBurst: number
  rocketSplit: boolean
  trailDmg: number
  trailDuration: number
  trailSize: number
  trailBurn: boolean
  trailExplode: boolean
  trailLastX: number
  trailLastY: number
  laserDmg: number
  laserRange: number
  laserWidth: number
  laserPierce: number
  turretDmg: number
  turretDuration: number
  turretFireRate: number
  turretMax: number
  orbitalDmg: number
  orbitalRadius: number
  orbitalCount: number
  blackholeDmg: number
  blackholeRadius: number
  blackholeDuration: number
  blackholePull: number
  grenadeDmg: number
  grenadeRadius: number
  grenadeBounces: number
  cryoDmg: number
  cryoShardCount: number
  cryoSlowDuration: number
  railgunDmg: number
  railgunChargeTime: number
  railgunWidth: number
  droneDmg: number
  droneCount: number
  bonusProjectiles: number
  powerUpSpawnTimer: number
  frenzyTimer: number
  freezeTimer: number
  gameTime: number
  globalSpeedMult: number
  nextBossWave: number
  paused: boolean
  showBaseStats: boolean
  pauseUI: any[]
  hudDirty: boolean
  _lastHp: number
  _lastMaxHp: number
  _lastXp: number
  _lastXpNeeded: number
  _lastTimerSecs: number
  _lastEffectStr: string
  gfxPoolFree: any[]

  // --- bonus tracking ---
  bonusMoveSpeed: number
  bonusDamage: number
  bonusCooldown: number
  bonusArea: number
  bonusWeaponDmg: Partial<Record<WeaponType, number>>
  bonusWeaponBulletSpd: Partial<Record<WeaponType, number>>
  flatWeaponShootRateReductions: Partial<Record<WeaponType, number>>

  // --- ui objects ---
  hpBar: any
  xpBar: any
  weaponHUDGfx: any
  auraGfx: any
  weaponHUDLvlTexts: any[]
  weaponHUDIcons: any[]
  passiveHUDLvlTexts: any[]
  passiveHUDIcons: any[]
  levelText: any
  scoreText: any
  timerText: any
  effectText: any

  // --- specials ---
  turrets: any[]
  blackholes: any[]
  orbitalStrikes: any[]
  railgunCharges: any[]
  drones: any[]

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
  playerSkin: string
  oneWeaponMode: boolean
  selectedMap: MapKey
  showTitleScreen(): void
  showModeSelection(): void
  showMapSelection(): void
  showWeaponSelection(): void
  showGameOver(): void
  unlockWeapon(wt: WeaponType): void
  rebuildWeaponHUDTexts(): void
  unlockPassive(pt: PassiveType): void
  applyPassiveBoost(pt: PassiveType): void
  buildTextures(): void
  effectiveShootRate(wt: WeaponType): number
  acquireGfx(depth?: number): any
  releaseGfx(gfx: any): void
  trailSprites: any[]
  _trailCheckTimer: number
  _lastAuraRadius: number
  updateTrailSprites(delta: number): void
  updateSpecials(delta: number): void
  fireShotgun(angle: number, wt: WeaponType): void
  fireSniper(angle: number, wt: WeaponType): void
  fireMachineGun(angle: number, wt: WeaponType): void
  fireAura(): void
  fireScythes(): void
  fireTesla(angle: number, wt: WeaponType): void
  fireBoomerang(angle: number, wt: WeaponType): void
  fireRocket(angle: number, wt: WeaponType): void
  fireTrail(): void
  fireLaser(angle: number): void
  fireTurret(): void
  fireOrbital(): void
  fireBlackhole(angle: number, wt: WeaponType): void
  fireGrenade(angle: number, wt: WeaponType): void
  fireCryo(angle: number, wt: WeaponType): void
  fireRailgun(angle: number): void
  fireDrones(): void
  move(): void
  autoShoot(time: number): void
  moveEnemies(delta: number): void
  pullOrbs(): void
  tintConsolidatedOrb(orb: any, value: number): void
}
