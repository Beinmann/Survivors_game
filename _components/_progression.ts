import { IGameScene } from './_sceneInterface'
import { WeaponType, PassiveType, WEAPON_NAMES, ALL_WEAPON_TYPES, WEAPON_BASE, PASSIVE_DATA, ALL_PASSIVE_TYPES } from './_types'
import { isWeaponUnlocked } from './_persistence'

const MULTISHOT_AFFECTS: ReadonlySet<WeaponType> = new Set<WeaponType>([
  'shotgun', 'machinegun', 'boomerang', 'rocket', 'cryo', 'drones',
  'cleave', 'scythes', 'tesla', 'turret',
])

export function onCollectOrb(scene: IGameScene, _p: any, orb: any) {
  const o = orb as any
  const xpValue = o.getData('xpValue') ?? 1
  o.destroy()
  scene.xp += xpValue * scene.orbMultiplier
  if (scene.xp >= scene.xpNeeded) {
    scene.xp = 0
    scene.xpNeeded = Math.floor(scene.xpNeeded * 1.25)
    scene.level++
    scene.levelText.setText(`Level ${scene.level}`)
    scene.showUpgradeMenu()
  }
}

export function getWeaponUpgrades(scene: IGameScene): any[] {
  type Step = { desc: string; icon?: string; apply: () => void }
  const paths: Record<WeaponType, Step[]> = {
    shotgun: [
      { desc: '+2 pellets  ·  −50ms cooldown',             icon: 'ico_pellets', apply: () => { scene.extraBullets += 2; scene.flatWeaponShootRateReductions['shotgun'] = (scene.flatWeaponShootRateReductions['shotgun'] ?? 0) + 50; scene.recalculateStats() } },
      { desc: '+30% damage  ·  +50px range',               icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['shotgun'] = (scene.bonusWeaponDmg['shotgun'] ?? 0) + 0.3; scene.shotgunRange += 50; scene.recalculateStats() } },
      { desc: '+2 pellets  ·  +30% damage',                icon: 'ico_pellets', apply: () => { scene.extraBullets += 2; scene.bonusWeaponDmg['shotgun'] = (scene.bonusWeaponDmg['shotgun'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '−80ms cooldown  ·  +60px range',            icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['shotgun'] = (scene.flatWeaponShootRateReductions['shotgun'] ?? 0) + 80; scene.shotgunRange += 60; scene.recalculateStats() } },
      { desc: '+40% damage  ·  +2 pellets',                icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['shotgun'] = (scene.bonusWeaponDmg['shotgun'] ?? 0) + 0.4; scene.extraBullets += 2; scene.recalculateStats() } },
      { desc: '−80ms cooldown  ·  +60px range',            icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['shotgun'] = (scene.flatWeaponShootRateReductions['shotgun'] ?? 0) + 80; scene.shotgunRange += 60; scene.recalculateStats() } },
      { desc: '+60% damage  ·  +4 pellets  ·  −100ms',     icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['shotgun'] = (scene.bonusWeaponDmg['shotgun'] ?? 0) + 0.6; scene.extraBullets += 4; scene.flatWeaponShootRateReductions['shotgun'] = (scene.flatWeaponShootRateReductions['shotgun'] ?? 0) + 100; scene.recalculateStats() } },
    ],
    sniper: [
      { desc: '+1 pierce  ·  +50% damage',                 icon: 'ico_pierce', apply: () => { scene.pierceCount++; scene.bonusWeaponDmg['sniper'] = (scene.bonusWeaponDmg['sniper'] ?? 0) + 0.5; scene.recalculateStats() } },
      { desc: '−250ms cooldown  ·  +30% bullet speed',     icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['sniper'] = (scene.flatWeaponShootRateReductions['sniper'] ?? 0) + 250; scene.bonusWeaponBulletSpd['sniper'] = (scene.bonusWeaponBulletSpd['sniper'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '+2 pierce  ·  −200ms cooldown',             icon: 'ico_pierce', apply: () => { scene.pierceCount += 2; scene.flatWeaponShootRateReductions['sniper'] = (scene.flatWeaponShootRateReductions['sniper'] ?? 0) + 200; scene.recalculateStats() } },
      { desc: '+70% damage  ·  +30% bullet speed',         icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['sniper'] = (scene.bonusWeaponDmg['sniper'] ?? 0) + 0.7; scene.bonusWeaponBulletSpd['sniper'] = (scene.bonusWeaponBulletSpd['sniper'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '+2 pierce  ·  −200ms cooldown',             icon: 'ico_pierce', apply: () => { scene.pierceCount += 2; scene.flatWeaponShootRateReductions['sniper'] = (scene.flatWeaponShootRateReductions['sniper'] ?? 0) + 200; scene.recalculateStats() } },
      { desc: '+80% damage  ·  +30% bullet speed',         icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['sniper'] = (scene.bonusWeaponDmg['sniper'] ?? 0) + 0.8; scene.bonusWeaponBulletSpd['sniper'] = (scene.bonusWeaponBulletSpd['sniper'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '+3 pierce  ·  +100% damage  ·  −200ms',     icon: 'ico_pierce', apply: () => { scene.pierceCount += 3; scene.bonusWeaponDmg['sniper'] = (scene.bonusWeaponDmg['sniper'] ?? 0) + 1.0; scene.flatWeaponShootRateReductions['sniper'] = (scene.flatWeaponShootRateReductions['sniper'] ?? 0) + 200; scene.recalculateStats() } },
    ],
    aura: [
      { desc: '+15% damage',                               icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['aura'] = (scene.bonusWeaponDmg['aura'] ?? 0) + 0.15; scene.recalculateStats() } },
      { desc: '+10px radius  ·  −50ms cooldown',           icon: 'ico_radius', apply: () => { scene.auraRadius += 10; scene.flatWeaponShootRateReductions['aura'] = (scene.flatWeaponShootRateReductions['aura'] ?? 0) + 50; scene.recalculateStats() } },
      { desc: '+25% damage  ·  +10px radius',              icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['aura'] = (scene.bonusWeaponDmg['aura'] ?? 0) + 0.25; scene.auraRadius += 10; scene.recalculateStats() } },
      { desc: '−80ms cooldown  ·  +15px radius',           icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['aura'] = (scene.flatWeaponShootRateReductions['aura'] ?? 0) + 80; scene.auraRadius += 15; scene.recalculateStats() } },
      { desc: '+30% damage  ·  +15px radius',              icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['aura'] = (scene.bonusWeaponDmg['aura'] ?? 0) + 0.30; scene.auraRadius += 15; scene.recalculateStats() } },
      { desc: '−80ms cooldown  ·  +20px radius',           icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['aura'] = (scene.flatWeaponShootRateReductions['aura'] ?? 0) + 80; scene.auraRadius += 20; scene.recalculateStats() } },
      { desc: '+40% damage  ·  +20px radius',              icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['aura'] = (scene.bonusWeaponDmg['aura'] ?? 0) + 0.40; scene.auraRadius += 20; scene.recalculateStats() } },
      { desc: '+50% damage  ·  +25px radius  ·  −80ms',    icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['aura'] = (scene.bonusWeaponDmg['aura'] ?? 0) + 0.50; scene.auraRadius += 25; scene.flatWeaponShootRateReductions['aura'] = (scene.flatWeaponShootRateReductions['aura'] ?? 0) + 80; scene.recalculateStats() } },
    ],
    machinegun: [
      { desc: '+50% damage  ·  −30ms cooldown',            icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['machinegun'] = (scene.bonusWeaponDmg['machinegun'] ?? 0) + 0.5; scene.flatWeaponShootRateReductions['machinegun'] = (scene.flatWeaponShootRateReductions['machinegun'] ?? 0) + 30; scene.recalculateStats() } },
      { desc: '+50% damage  ·  −30ms cooldown',            icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['machinegun'] = (scene.bonusWeaponDmg['machinegun'] ?? 0) + 0.5; scene.flatWeaponShootRateReductions['machinegun'] = (scene.flatWeaponShootRateReductions['machinegun'] ?? 0) + 30; scene.recalculateStats() } },
      { desc: 'Piercing rounds — bullets pass through 1 enemy', icon: 'ico_pierce', apply: () => { scene.machineGunPierce = true } },
      { desc: '+50% damage  ·  −30ms cooldown',            icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['machinegun'] = (scene.bonusWeaponDmg['machinegun'] ?? 0) + 0.5; scene.flatWeaponShootRateReductions['machinegun'] = (scene.flatWeaponShootRateReductions['machinegun'] ?? 0) + 30; scene.recalculateStats() } },
      { desc: 'Burst fire — 2 bullets per shot',           icon: 'ico_burst', apply: () => { scene.machineGunBurst = 2 } },
      { desc: '3-round burst  ·  −30ms cooldown',          icon: 'ico_burst', apply: () => { scene.machineGunBurst = 3; scene.flatWeaponShootRateReductions['machinegun'] = (scene.flatWeaponShootRateReductions['machinegun'] ?? 0) + 30; scene.recalculateStats() } },
      { desc: '+80% damage  ·  −30ms cooldown',            icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['machinegun'] = (scene.bonusWeaponDmg['machinegun'] ?? 0) + 0.8; scene.flatWeaponShootRateReductions['machinegun'] = (scene.flatWeaponShootRateReductions['machinegun'] ?? 0) + 30; scene.recalculateStats() } },
    ],
    scythes: [
      { desc: '+1 blade',                                        icon: 'wico_scythes', apply: () => { scene.scythesCount++; scene.recalculateStats() } },
      { desc: '+30% damage  ·  +20px radius  ·  +10% area',     icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['scythes'] = (scene.bonusWeaponDmg['scythes'] ?? 0) + 0.3; scene.scythesRadius += 20; scene.bonusArea += 0.1; scene._lastAuraRadius = -1; scene.recalculateStats() } },
      { desc: '+1 blade',                                        icon: 'wico_scythes', apply: () => { scene.scythesCount++; scene.recalculateStats() } },
      { desc: '+40% damage  ·  +20px radius  ·  +10% area',     icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['scythes'] = (scene.bonusWeaponDmg['scythes'] ?? 0) + 0.4; scene.scythesRadius += 20; scene.bonusArea += 0.1; scene._lastAuraRadius = -1; scene.recalculateStats() } },
      { desc: '−200ms cooldown  ·  +30% damage',                icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['scythes'] = (scene.flatWeaponShootRateReductions['scythes'] ?? 0) + 200; scene.bonusWeaponDmg['scythes'] = (scene.bonusWeaponDmg['scythes'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '+1 blade',                                        icon: 'wico_scythes', apply: () => { scene.scythesCount++; scene.recalculateStats() } },
      { desc: '+60% damage  ·  +30px radius  ·  +10% area',     icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['scythes'] = (scene.bonusWeaponDmg['scythes'] ?? 0) + 0.6; scene.scythesRadius += 30; scene.bonusArea += 0.1; scene._lastAuraRadius = -1; scene.recalculateStats() } },
      { desc: '+1 blade  ·  Life steal on hit',                  icon: 'ico_lifesteal', apply: () => { scene.scythesCount++; scene.scythesLifeSteal = true; scene.recalculateStats() } },
    ],
    tesla: [
      { desc: '+1 jump  ·  +30% damage',                   icon: 'ico_damage', apply: () => { scene.teslaJumps++; scene.bonusWeaponDmg['tesla'] = (scene.bonusWeaponDmg['tesla'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '−150ms cooldown  ·  +30% damage',           icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['tesla'] = (scene.flatWeaponShootRateReductions['tesla'] ?? 0) + 150; scene.bonusWeaponDmg['tesla'] = (scene.bonusWeaponDmg['tesla'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '+2 jumps  ·  +40% damage',                  icon: 'ico_damage', apply: () => { scene.teslaJumps += 2; scene.bonusWeaponDmg['tesla'] = (scene.bonusWeaponDmg['tesla'] ?? 0) + 0.4; scene.recalculateStats() } },
      { desc: 'Stunning bolts — slows enemies',            icon: 'ico_stun', apply: () => { scene.teslaStun = true } },
      { desc: '−150ms cooldown  ·  +50% damage',           icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['tesla'] = (scene.flatWeaponShootRateReductions['tesla'] ?? 0) + 150; scene.bonusWeaponDmg['tesla'] = (scene.bonusWeaponDmg['tesla'] ?? 0) + 0.5; scene.recalculateStats() } },
      { desc: '+2 jumps  ·  +60% damage',                  icon: 'ico_damage', apply: () => { scene.teslaJumps += 2; scene.bonusWeaponDmg['tesla'] = (scene.bonusWeaponDmg['tesla'] ?? 0) + 0.6; scene.recalculateStats() } },
      { desc: '−200ms cooldown  ·  +80% damage',           icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['tesla'] = (scene.flatWeaponShootRateReductions['tesla'] ?? 0) + 200; scene.bonusWeaponDmg['tesla'] = (scene.bonusWeaponDmg['tesla'] ?? 0) + 0.8; scene.recalculateStats() } },
      { desc: 'Arc back — can hit same target twice',      icon: 'ico_rearshot', apply: () => { scene.teslaArcBack = true } },
    ],
    boomerang: [
      { desc: '+50px range  ·  +30% damage',               icon: 'ico_range', apply: () => { scene.boomerangDist += 50; scene.bonusWeaponDmg['boomerang'] = (scene.bonusWeaponDmg['boomerang'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '+1 boomerang  ·  −100ms cooldown',          icon: 'wico_boomerang', apply: () => { scene.boomerangCount++; scene.flatWeaponShootRateReductions['boomerang'] = (scene.flatWeaponShootRateReductions['boomerang'] ?? 0) + 100; scene.recalculateStats() } },
      { desc: 'Piercing blades — pass through enemies',    icon: 'ico_pierce', apply: () => { scene.boomerangPierce = true } },
      { desc: '+50px range  ·  +40% damage',               icon: 'ico_range', apply: () => { scene.boomerangDist += 50; scene.bonusWeaponDmg['boomerang'] = (scene.bonusWeaponDmg['boomerang'] ?? 0) + 0.4; scene.recalculateStats() } },
      { desc: '+1 boomerang  ·  −150ms cooldown',          icon: 'wico_boomerang', apply: () => { scene.boomerangCount++; scene.flatWeaponShootRateReductions['boomerang'] = (scene.flatWeaponShootRateReductions['boomerang'] ?? 0) + 150; scene.recalculateStats() } },
      { desc: '+60% damage  ·  +30% bullet speed',         icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['boomerang'] = (scene.bonusWeaponDmg['boomerang'] ?? 0) + 0.6; scene.bonusWeaponBulletSpd['boomerang'] = (scene.bonusWeaponBulletSpd['boomerang'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '+80% damage  ·  +1 boomerang',              icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['boomerang'] = (scene.bonusWeaponDmg['boomerang'] ?? 0) + 0.8; scene.boomerangCount++; scene.recalculateStats() } },
      { desc: 'Spark trail — leaves damaging sparks',      icon: 'ico_spark', apply: () => { scene.trailDmg += 5; scene.trailBurn = true } },
    ],
    rocket: [
      { desc: '+20px explosion radius',                    icon: 'ico_radius', apply: () => { scene.rocketRadius += 20; scene.recalculateStats() } },
      { desc: '+50% damage  ·  −100ms cooldown',           icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['rocket'] = (scene.bonusWeaponDmg['rocket'] ?? 0) + 0.5; scene.flatWeaponShootRateReductions['rocket'] = (scene.flatWeaponShootRateReductions['rocket'] ?? 0) + 100; scene.recalculateStats() } },
      { desc: 'Burst fire — 2 rockets per shot',           icon: 'ico_burst', apply: () => { scene.rocketBurst = 2 } },
      { desc: '+30px explosion radius',                    icon: 'ico_radius', apply: () => { scene.rocketRadius += 30; scene.recalculateStats() } },
      { desc: '+70% damage  ·  −200ms cooldown',           icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['rocket'] = (scene.bonusWeaponDmg['rocket'] ?? 0) + 0.7; scene.flatWeaponShootRateReductions['rocket'] = (scene.flatWeaponShootRateReductions['rocket'] ?? 0) + 200; scene.recalculateStats() } },
      { desc: 'Burst fire — 3 rockets per shot',           icon: 'ico_burst', apply: () => { scene.rocketBurst = 3 } },
      { desc: '+100% damage  ·  +30px radius',             icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['rocket'] = (scene.bonusWeaponDmg['rocket'] ?? 0) + 1.0; scene.rocketRadius += 30; scene.recalculateStats() } },
      { desc: 'Cluster impact — rockets split on hit',     icon: 'ico_split', apply: () => { scene.rocketSplit = true } },
    ],
    trail: [
      { desc: '+1s duration  ·  +10px size',               icon: 'ico_cooldown', apply: () => { scene.trailDuration += 1000; scene.trailSize += 10; scene.recalculateStats() } },
      { desc: '+40% damage  ·  −50ms cooldown',            icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['trail'] = (scene.bonusWeaponDmg['trail'] ?? 0) + 0.4; scene.flatWeaponShootRateReductions['trail'] = (scene.flatWeaponShootRateReductions['trail'] ?? 0) + 50; scene.recalculateStats() } },
      { desc: '+2s duration  ·  +15px size',               icon: 'ico_cooldown', apply: () => { scene.trailDuration += 2000; scene.trailSize += 15; scene.recalculateStats() } },
      { desc: 'Burn effect — enemies keep taking damage',  icon: 'ico_burn', apply: () => { scene.trailBurn = true } },
      { desc: '+60% damage  ·  −50ms cooldown',            icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['trail'] = (scene.bonusWeaponDmg['trail'] ?? 0) + 0.6; scene.flatWeaponShootRateReductions['trail'] = (scene.flatWeaponShootRateReductions['trail'] ?? 0) + 50; scene.recalculateStats() } },
      { desc: '+80% damage  ·  +2s duration',              icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['trail'] = (scene.bonusWeaponDmg['trail'] ?? 0) + 0.8; scene.trailDuration += 2000; scene.recalculateStats() } },
      { desc: '−100ms cooldown  ·  +20px size',            icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['trail'] = (scene.flatWeaponShootRateReductions['trail'] ?? 0) + 100; scene.trailSize += 20; scene.recalculateStats() } },
      { desc: 'Volatile fire — patches explode on expiry', icon: 'ico_split', apply: () => { scene.trailExplode = true } },
    ],
    laser: [
      { desc: '+40% damage  ·  +40px range',               icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['laser'] = (scene.bonusWeaponDmg['laser'] ?? 0) + 0.4; scene.laserRange += 40; scene.recalculateStats() } },
      { desc: '+1 pierce  ·  −30ms cooldown',              icon: 'ico_pierce', apply: () => { scene.laserPierce++; scene.flatWeaponShootRateReductions['laser'] = (scene.flatWeaponShootRateReductions['laser'] ?? 0) + 30; scene.recalculateStats() } },
      { desc: '+50% damage  ·  +3px beam width',           icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['laser'] = (scene.bonusWeaponDmg['laser'] ?? 0) + 0.5; scene.laserWidth += 3; scene.recalculateStats() } },
      { desc: '+1 pierce  ·  +40px range',                 icon: 'ico_pierce', apply: () => { scene.laserPierce++; scene.laserRange += 40; scene.recalculateStats() } },
      { desc: '+60% damage  ·  −40ms cooldown',            icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['laser'] = (scene.bonusWeaponDmg['laser'] ?? 0) + 0.6; scene.flatWeaponShootRateReductions['laser'] = (scene.flatWeaponShootRateReductions['laser'] ?? 0) + 40; scene.recalculateStats() } },
      { desc: '+2 pierce  ·  +4px beam width',             icon: 'ico_pierce', apply: () => { scene.laserPierce += 2; scene.laserWidth += 4; scene.recalculateStats() } },
      { desc: '+80% damage  ·  +60px range',               icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['laser'] = (scene.bonusWeaponDmg['laser'] ?? 0) + 0.8; scene.laserRange += 60; scene.recalculateStats() } },
      { desc: '+3 pierce  ·  −50ms cooldown  ·  +5px',     icon: 'ico_pierce', apply: () => { scene.laserPierce += 3; scene.flatWeaponShootRateReductions['laser'] = (scene.flatWeaponShootRateReductions['laser'] ?? 0) + 50; scene.laserWidth += 5; scene.recalculateStats() } },
    ],
    turret: [
      { desc: '+40% damage  ·  +1s duration',              icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['turret'] = (scene.bonusWeaponDmg['turret'] ?? 0) + 0.4; scene.turretDuration += 1000; scene.recalculateStats() } },
      { desc: '−80ms turret fire rate  ·  +30% damage',    icon: 'ico_cooldown', apply: () => { scene.turretFireRate = Math.max(80, scene.turretFireRate - 80); scene.bonusWeaponDmg['turret'] = (scene.bonusWeaponDmg['turret'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '+1 max turret  ·  +1s duration',            icon: 'wico_turret', apply: () => { scene.turretMax++; scene.turretDuration += 1000 } },
      { desc: '+50% damage  ·  −60ms fire rate',           icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['turret'] = (scene.bonusWeaponDmg['turret'] ?? 0) + 0.5; scene.turretFireRate = Math.max(80, scene.turretFireRate - 60); scene.recalculateStats() } },
      { desc: '−500ms cooldown  ·  +2s duration',          icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['turret'] = (scene.flatWeaponShootRateReductions['turret'] ?? 0) + 500; scene.turretDuration += 2000; scene.recalculateStats() } },
      { desc: '+70% damage  ·  −60ms fire rate',           icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['turret'] = (scene.bonusWeaponDmg['turret'] ?? 0) + 0.7; scene.turretFireRate = Math.max(80, scene.turretFireRate - 60); scene.recalculateStats() } },
      { desc: '+1 max turret  ·  +500ms cooldown reduction', icon: 'wico_turret', apply: () => { scene.turretMax++; scene.flatWeaponShootRateReductions['turret'] = (scene.flatWeaponShootRateReductions['turret'] ?? 0) + 500; scene.recalculateStats() } },
      { desc: '+100% damage  ·  +3s duration',             icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['turret'] = (scene.bonusWeaponDmg['turret'] ?? 0) + 1.0; scene.turretDuration += 3000; scene.recalculateStats() } },
    ],
    orbital: [
      { desc: '+30% damage  ·  +15px radius',              icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['orbital'] = (scene.bonusWeaponDmg['orbital'] ?? 0) + 0.3; scene.orbitalRadius += 15; scene.recalculateStats() } },
      { desc: '−400ms cooldown',                           icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['orbital'] = (scene.flatWeaponShootRateReductions['orbital'] ?? 0) + 400; scene.recalculateStats() } },
      { desc: '+1 strike per volley',                      icon: 'wico_orbital', apply: () => { scene.orbitalCount++ } },
      { desc: '+40% damage  ·  +20px radius',              icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['orbital'] = (scene.bonusWeaponDmg['orbital'] ?? 0) + 0.4; scene.orbitalRadius += 20; scene.recalculateStats() } },
      { desc: '−400ms cooldown  ·  +20px radius',          icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['orbital'] = (scene.flatWeaponShootRateReductions['orbital'] ?? 0) + 400; scene.orbitalRadius += 20; scene.recalculateStats() } },
      { desc: '+1 strike  ·  +30% damage',                 icon: 'wico_orbital', apply: () => { scene.orbitalCount++; scene.bonusWeaponDmg['orbital'] = (scene.bonusWeaponDmg['orbital'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '+60% damage  ·  +30px radius',              icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['orbital'] = (scene.bonusWeaponDmg['orbital'] ?? 0) + 0.6; scene.orbitalRadius += 30; scene.recalculateStats() } },
      { desc: '+1 strike  ·  −500ms cooldown',             icon: 'wico_orbital', apply: () => { scene.orbitalCount++; scene.flatWeaponShootRateReductions['orbital'] = (scene.flatWeaponShootRateReductions['orbital'] ?? 0) + 500; scene.recalculateStats() } },
    ],
    blackhole: [
      { desc: '+30px radius  ·  +30% damage',              icon: 'ico_radius', apply: () => { scene.blackholeRadius += 30; scene.bonusWeaponDmg['blackhole'] = (scene.bonusWeaponDmg['blackhole'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '+40 pull strength  ·  +500ms duration',     icon: 'wico_blackhole', apply: () => { scene.blackholePull += 40; scene.blackholeDuration += 500 } },
      { desc: '+50% damage  ·  −800ms cooldown',           icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['blackhole'] = (scene.bonusWeaponDmg['blackhole'] ?? 0) + 0.5; scene.flatWeaponShootRateReductions['blackhole'] = (scene.flatWeaponShootRateReductions['blackhole'] ?? 0) + 800; scene.recalculateStats() } },
      { desc: '+30px radius  ·  +500ms duration',          icon: 'ico_radius', apply: () => { scene.blackholeRadius += 30; scene.blackholeDuration += 500 } },
      { desc: '+70% damage  ·  +40 pull',                  icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['blackhole'] = (scene.bonusWeaponDmg['blackhole'] ?? 0) + 0.7; scene.blackholePull += 40; scene.recalculateStats() } },
      { desc: '+40px radius  ·  +1s duration',             icon: 'ico_radius', apply: () => { scene.blackholeRadius += 40; scene.blackholeDuration += 1000 } },
      { desc: '+100% damage  ·  −1000ms cooldown',         icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['blackhole'] = (scene.bonusWeaponDmg['blackhole'] ?? 0) + 1.0; scene.flatWeaponShootRateReductions['blackhole'] = (scene.flatWeaponShootRateReductions['blackhole'] ?? 0) + 1000; scene.recalculateStats() } },
      { desc: '+50px radius  ·  +1s duration  ·  +60 pull', icon: 'ico_radius', apply: () => { scene.blackholeRadius += 50; scene.blackholeDuration += 1000; scene.blackholePull += 60 } },
    ],
    cryo: [
      { desc: '+1 shard  ·  +20% damage',                  icon: 'wico_cryo', apply: () => { scene.cryoShardCount++; scene.bonusWeaponDmg['cryo'] = (scene.bonusWeaponDmg['cryo'] ?? 0) + 0.2; scene.recalculateStats() } },
      { desc: '+500ms slow duration  ·  +30% damage',      icon: 'ico_slow', apply: () => { scene.cryoSlowDuration += 500; scene.bonusWeaponDmg['cryo'] = (scene.bonusWeaponDmg['cryo'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '+1 shard  ·  −100ms cooldown',              icon: 'wico_cryo', apply: () => { scene.cryoShardCount++; scene.flatWeaponShootRateReductions['cryo'] = (scene.flatWeaponShootRateReductions['cryo'] ?? 0) + 100; scene.recalculateStats() } },
      { desc: '+40% damage  ·  +500ms slow',               icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['cryo'] = (scene.bonusWeaponDmg['cryo'] ?? 0) + 0.4; scene.cryoSlowDuration += 500; scene.recalculateStats() } },
      { desc: '+2 shards',                                 icon: 'wico_cryo', apply: () => { scene.cryoShardCount += 2 } },
      { desc: '+60% damage  ·  −100ms cooldown',           icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['cryo'] = (scene.bonusWeaponDmg['cryo'] ?? 0) + 0.6; scene.flatWeaponShootRateReductions['cryo'] = (scene.flatWeaponShootRateReductions['cryo'] ?? 0) + 100; scene.recalculateStats() } },
      { desc: '+1 shard  ·  +1s slow duration',            icon: 'ico_slow', apply: () => { scene.cryoShardCount++; scene.cryoSlowDuration += 1000 } },
      { desc: '+80% damage  ·  +1 shard  ·  −150ms',       icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['cryo'] = (scene.bonusWeaponDmg['cryo'] ?? 0) + 0.8; scene.cryoShardCount++; scene.flatWeaponShootRateReductions['cryo'] = (scene.flatWeaponShootRateReductions['cryo'] ?? 0) + 150; scene.recalculateStats() } },
    ],
    railgun: [
      { desc: '−300ms charge time  ·  +20% damage',        icon: 'ico_charge', apply: () => { scene.railgunChargeTime = Math.max(200, scene.railgunChargeTime - 300); scene.bonusWeaponDmg['railgun'] = (scene.bonusWeaponDmg['railgun'] ?? 0) + 0.2; scene.recalculateStats() } },
      { desc: '+40% damage  ·  +2px beam width',           icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['railgun'] = (scene.bonusWeaponDmg['railgun'] ?? 0) + 0.4; scene.railgunWidth += 2; scene.recalculateStats() } },
      { desc: '−500ms cooldown  ·  −300ms charge',         icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['railgun'] = (scene.flatWeaponShootRateReductions['railgun'] ?? 0) + 500; scene.railgunChargeTime = Math.max(200, scene.railgunChargeTime - 300); scene.recalculateStats() } },
      { desc: '+60% damage',                               icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['railgun'] = (scene.bonusWeaponDmg['railgun'] ?? 0) + 0.6; scene.recalculateStats() } },
      { desc: '+3px beam width  ·  +20% damage',           icon: 'ico_damage', apply: () => { scene.railgunWidth += 3; scene.bonusWeaponDmg['railgun'] = (scene.bonusWeaponDmg['railgun'] ?? 0) + 0.2; scene.recalculateStats() } },
      { desc: '−700ms cooldown  ·  +30% damage',           icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['railgun'] = (scene.flatWeaponShootRateReductions['railgun'] ?? 0) + 700; scene.bonusWeaponDmg['railgun'] = (scene.bonusWeaponDmg['railgun'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '+100% damage  ·  −200ms charge',            icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['railgun'] = (scene.bonusWeaponDmg['railgun'] ?? 0) + 1.0; scene.railgunChargeTime = Math.max(200, scene.railgunChargeTime - 200); scene.recalculateStats() } },
      { desc: '+50% damage  ·  +4px width  ·  −400ms cd',  icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['railgun'] = (scene.bonusWeaponDmg['railgun'] ?? 0) + 0.5; scene.railgunWidth += 4; scene.flatWeaponShootRateReductions['railgun'] = (scene.flatWeaponShootRateReductions['railgun'] ?? 0) + 400; scene.recalculateStats() } },
    ],
    drones: [
      { desc: '+1 drone',                                  icon: 'wico_drones', apply: () => { scene.droneCount++ } },
      { desc: '+40% damage  ·  −150ms cooldown',           icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['drones'] = (scene.bonusWeaponDmg['drones'] ?? 0) + 0.4; scene.flatWeaponShootRateReductions['drones'] = (scene.flatWeaponShootRateReductions['drones'] ?? 0) + 150; scene.recalculateStats() } },
      { desc: '+1 drone  ·  +30% damage',                  icon: 'wico_drones', apply: () => { scene.droneCount++; scene.bonusWeaponDmg['drones'] = (scene.bonusWeaponDmg['drones'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '+50% damage',                               icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['drones'] = (scene.bonusWeaponDmg['drones'] ?? 0) + 0.5; scene.recalculateStats() } },
      { desc: '+1 drone  ·  −150ms cooldown',              icon: 'wico_drones', apply: () => { scene.droneCount++; scene.flatWeaponShootRateReductions['drones'] = (scene.flatWeaponShootRateReductions['drones'] ?? 0) + 150; scene.recalculateStats() } },
      { desc: '+70% damage  ·  −200ms cooldown',           icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['drones'] = (scene.bonusWeaponDmg['drones'] ?? 0) + 0.7; scene.flatWeaponShootRateReductions['drones'] = (scene.flatWeaponShootRateReductions['drones'] ?? 0) + 200; scene.recalculateStats() } },
      { desc: '+2 drones  ·  +30% damage',                 icon: 'wico_drones', apply: () => { scene.droneCount += 2; scene.bonusWeaponDmg['drones'] = (scene.bonusWeaponDmg['drones'] ?? 0) + 0.3; scene.recalculateStats() } },
      { desc: '+100% damage  ·  +1 drone  ·  −200ms',      icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['drones'] = (scene.bonusWeaponDmg['drones'] ?? 0) + 1.0; scene.droneCount++; scene.flatWeaponShootRateReductions['drones'] = (scene.flatWeaponShootRateReductions['drones'] ?? 0) + 200; scene.recalculateStats() } },
    ],
    cleave: [
      { desc: '+40% damage  ·  +15px radius',              icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['cleave'] = (scene.bonusWeaponDmg['cleave'] ?? 0) + 0.4; scene.cleaveRadius += 15; scene.recalculateStats() } },
      { desc: '−250ms cooldown  ·  +20° arc',              icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['cleave'] = (scene.flatWeaponShootRateReductions['cleave'] ?? 0) + 250; scene.cleaveArc += (20 * Math.PI) / 180; scene.recalculateStats() } },
      { desc: '+1 slash  ·  +20% damage',                  icon: 'wico_cleave', apply: () => { scene.cleaveCount++; scene.bonusWeaponDmg['cleave'] = (scene.bonusWeaponDmg['cleave'] ?? 0) + 0.2; scene.recalculateStats() } },
      { desc: '+50% damage  ·  +20px radius',              icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['cleave'] = (scene.bonusWeaponDmg['cleave'] ?? 0) + 0.5; scene.cleaveRadius += 20; scene.recalculateStats() } },
      { desc: '−250ms cooldown  ·  +25° arc',              icon: 'ico_cooldown', apply: () => { scene.flatWeaponShootRateReductions['cleave'] = (scene.flatWeaponShootRateReductions['cleave'] ?? 0) + 250; scene.cleaveArc += (25 * Math.PI) / 180; scene.recalculateStats() } },
      { desc: '+1 slash  ·  +30° arc',                     icon: 'wico_cleave', apply: () => { scene.cleaveCount++; scene.cleaveArc += (30 * Math.PI) / 180 } },
      { desc: '+70% damage  ·  +25px radius',              icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['cleave'] = (scene.bonusWeaponDmg['cleave'] ?? 0) + 0.7; scene.cleaveRadius += 25; scene.recalculateStats() } },
      { desc: '+100% damage  ·  +1 slash  ·  −300ms',      icon: 'ico_damage', apply: () => { scene.bonusWeaponDmg['cleave'] = (scene.bonusWeaponDmg['cleave'] ?? 0) + 1.0; scene.cleaveCount++; scene.flatWeaponShootRateReductions['cleave'] = (scene.flatWeaponShootRateReductions['cleave'] ?? 0) + 300; scene.recalculateStats() } },
    ],
  }
  const result: any[] = []
  for (const wt of scene.weapons) {
    const lvl = scene.weaponLevels[wt] ?? 1
    if (lvl >= 9) continue
    const step = paths[wt]?.[lvl - 1]
    if (!step) continue
    result.push({
      name: `${WEAPON_NAMES[wt]} Lv ${lvl + 1}`,
      desc: step.desc,
      icon: `wico_${wt}`,
      apply: () => { step.apply(); scene.weaponLevels[wt] = lvl + 1 },
      isWeaponUpgrade: true,
    })
  }
  return result
}

export function getUpgrades(scene: IGameScene) {
  const weaponUpgrades = scene.getWeaponUpgrades()
  const passiveUpgrades = scene.passives.map(pt => {
    const lvl = scene.passiveLevels[pt] ?? 1
    const data = PASSIVE_DATA[pt]
    if (lvl >= (data.maxLevel ?? 5)) return null
    return {
      name: `${data.name} Lv ${lvl + 1}`,
      icon: data.icon,
      desc: data.desc,
      apply: () => { scene.passiveLevels[pt] = lvl + 1; scene.applyPassiveBoost(pt) },
      isPassiveUpgrade: true,
    }
  }).filter(Boolean) as any[]

  const weaponUnlockOptions = (!scene.oneWeaponMode && scene.weapons.length < 3)
    ? ALL_WEAPON_TYPES
        .filter(wt => !scene.weapons.includes(wt) && isWeaponUnlocked(wt))
        .map(wt => ({
          name: `Unlock ${WEAPON_NAMES[wt]}`,
          icon: `wico_${wt}`,
          desc: weaponUnlockDesc(wt),
          apply: () => scene.unlockWeapon(wt),
          isNewWeapon: true as const,
        }))
    : []

  const passiveUnlockOptions = scene.passives.length < 3
    ? ALL_PASSIVE_TYPES
        .filter(pt => !scene.passives.includes(pt))
        .map(pt => ({
          name: `Unlock ${PASSIVE_DATA[pt].name}`,
          icon: PASSIVE_DATA[pt].icon,
          desc: PASSIVE_DATA[pt].desc,
          apply: () => scene.unlockPassive(pt),
          isNewPassive: true as const,
        }))
    : []

  const pool = [
    ...weaponUpgrades.flatMap(u => [u, u, u]),
    ...passiveUpgrades.flatMap(u => [u, u, u]),
    ...weaponUnlockOptions.flatMap(u => [u, u]),
    ...passiveUnlockOptions.flatMap(u => [u, u]),
  ]
  pool.sort(() => Math.random() - 0.5)
  const seen = new Set<string>()
  const result: any[] = []
  for (const u of pool) {
    if (!seen.has(u.name) && result.length < 3) { seen.add(u.name); result.push(u) }
  }

  const totalAcquired = scene.weapons.length + scene.passives.length
  const existingUpgrades = [...weaponUpgrades, ...passiveUpgrades]
  const hasExisting = result.some(u => u.isWeaponUpgrade || u.isPassiveUpgrade)
  if (totalAcquired >= 3 && !hasExisting && existingUpgrades.length > 0) {
    const available = existingUpgrades.filter(u => !result.some(r => r.name === u.name))
    const candidates = available.length > 0 ? available : existingUpgrades
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    result[Math.floor(Math.random() * result.length)] = pick
  }

  return result
}

function weaponUnlockDesc(wt: WeaponType): string {
  const descs: Record<WeaponType, string> = {
    shotgun:    'Cone of pellets · deadly up close',
    sniper:     'Piercing shot · slow but powerful',
    aura:       'Electric pulse · hits all nearby enemies',
    machinegun: 'Rapid fire · scales to burst spread',
    scythes:    'Orbiting blades · slice through swarms',
    tesla:      'Chain lightning · jumps between targets',
    boomerang:  'Returning blade · hits enemies twice',
    rocket:     'Seeking missiles · explosive impact',
    trail:      'Fire walk · leaves damaging path',
    laser:      'Beam of light · pierces several enemies',
    turret:     'Deploys a sentry · fires for 8 seconds',
    orbital:    'Marks a target · strikes from above',
    blackhole:  'Gravity well · pulls and crushes',
    cryo:       'Icy shards · slow enemies on hit',
    railgun:    'Charges then sustains a piercing beam',
    drones:     'Homing drones · ram their target, pass-through damage',
    cleave:     'Crescent slash · heavy burst hit in a wide arc',
  }
  return descs[wt]
}

export function showUpgradeMenu(scene: IGameScene) {
  const upgrades = scene.getUpgrades()

  if (upgrades.length === 0) {
    const bonus = 25
    scene.hp = Math.min(scene.maxHp, scene.hp + bonus)
    scene.hudDirty = true

    if (scene.maxLevelShown) {
      const heal = scene.add.text(scene.player.x, scene.player.y - 40, `+${bonus} HP`, {
        fontSize: '16px', color: '#a3e635', stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(41)
      scene.tweens.add({
        targets: heal,
        y: heal.y - 40,
        alpha: 0,
        duration: 1100,
        onComplete: () => heal.destroy(),
      })
      return
    }
    scene.maxLevelShown = true

    scene.levelUpPending = true
    scene.physics.world.pause()
    scene.tweens.pauseAll()
    scene.time.paused = true

    const { width: w, height: h } = scene.cameras.main
    const overlay = scene.add.graphics().setScrollFactor(0).setDepth(40)
    overlay.fillStyle(0x000000, 0.7).fillRect(0, 0, w, h)
    const msg = scene.add.text(w / 2, h / 2 - 20, 'MAX LEVEL', {
      fontSize: '28px', color: '#fbbf24', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(41)
    const sub = scene.add.text(w / 2, h / 2 + 20, `All upgrades complete — further levels restore ${bonus} HP`, {
      fontSize: '15px', color: '#a3e635', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(41)
    const hint = scene.add.text(w / 2, h / 2 + 55, 'Click to continue', {
      fontSize: '13px', color: '#888899', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(41)
    let dismissed = false
    const dismiss = () => {
      if (dismissed) return
      dismissed = true
      overlay.destroy(); msg.destroy(); sub.destroy(); hint.destroy()
      scene.levelUpPending = false
      scene.tweens.resumeAll()
      scene.time.paused = false
      scene.physics.world.resume()
    }
    scene.input.once('pointerdown', dismiss)
    window.setTimeout(dismiss, 3000)
    return
  }

  scene.levelUpPending = true
  scene.physics.world.pause()
  scene.tweens.pauseAll()
  scene.time.paused = true

  const { width: w, height: h } = scene.cameras.main

  const overlay = scene.add.graphics().setScrollFactor(0).setDepth(40)
  overlay.fillStyle(0x000000, 0.75).fillRect(0, 0, w, h)

  const title = scene.add.text(w / 2, h / 2 - 130, `LEVEL ${scene.level} — Choose an upgrade`, {
    fontSize: '22px', color: '#fbbf24', stroke: '#000', strokeThickness: 4,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(41)

  const cardW = Math.min(190, (w - 80) / 3 - 10)
  const cardH = 140
  const gap = cardW + 20
  const startX = w / 2 - gap

  const tag = (o: any) => { o.__menuCard = true }
  tag(overlay); tag(title)

  const cardDraws: Array<(hover: boolean) => void> = []
  let selectedIndex = Math.min(Math.floor(upgrades.length / 2), upgrades.length - 1)

  const setSelected = (i: number) => {
    selectedIndex = i
    cardDraws.forEach((d, idx) => d(idx === selectedIndex))
  }

  const cleanup = () => {
    scene.input.keyboard?.off('keydown-LEFT', moveLeft)
    scene.input.keyboard?.off('keydown-A', moveLeft)
    scene.input.keyboard?.off('keydown-RIGHT', moveRight)
    scene.input.keyboard?.off('keydown-D', moveRight)
    scene.input.keyboard?.off('keydown-SPACE', confirmKey)
    scene.input.keyboard?.off('keydown-ENTER', confirmKey)
    scene.input.keyboard?.off('keydown-ESC', skip)
    scene.children.list.filter((o: any) => o.__menuCard).forEach((o: any) => o.destroy())
    scene.levelUpPending = false
    scene.tweens.resumeAll()
    scene.time.paused = false
    scene.physics.world.resume()
    if (scene.debugLevelQueue > 0) {
      scene.debugLevelQueue--
      scene.level++
      scene.levelText.setText(`Level ${scene.level}`)
      scene.showUpgradeMenu()
    }
  }

  const confirm = (i: number) => {
    upgrades[i].apply()
    scene.hudDirty = true
    cleanup()
  }

  const skip = () => {
    cleanup()
  }

  const moveLeft   = () => setSelected((selectedIndex - 1 + cardDraws.length) % cardDraws.length)
  const moveRight  = () => setSelected((selectedIndex + 1) % cardDraws.length)
  const confirmKey = () => confirm(selectedIndex)

  upgrades.forEach((upgrade: any, i: number) => {
    const cx = startX + i * gap
    const cy = h / 2

    const u = upgrade as any
    const isWeapon     = !!u.isWeaponUpgrade
    const isNewWeapon  = !!u.isNewWeapon
    const isPassive    = !!u.isPassiveUpgrade
    const isNewPassive = !!u.isNewPassive

    const idleColor   = (isNewWeapon || isNewPassive) ? 0x1f1a0a : isWeapon ? 0x1a1f2e : isPassive ? 0x161f16 : 0x16161e
    const hoverColor  = (isNewWeapon || isNewPassive) ? 0x2e2210 : isWeapon ? 0x1e2a40 : isPassive ? 0x1e2e1e : 0x2a2a3e
    const idleBorder  = (isNewWeapon || isNewPassive) ? 0xd97706 : isWeapon ? 0x3b82f6 : isPassive ? 0x10b981 : 0x3a3a5a
    const hoverBorder = (isNewWeapon || isNewPassive) ? 0xfbbf24 : isWeapon ? 0x60a5fa : isPassive ? 0x34d399 : 0xfbbf24

    const bg = scene.add.graphics().setScrollFactor(0).setDepth(41)
    const draw = (hover: boolean) => {
      bg.clear()
      bg.fillStyle(hover ? hoverColor : idleColor)
      bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10)
      bg.lineStyle(hover || isWeapon || isNewWeapon || isPassive || isNewPassive ? 2 : 1, hover ? hoverBorder : idleBorder)
      bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10)
    }
    draw(i === selectedIndex)
    cardDraws.push(draw)

    const iconKey = (upgrade as any).icon as string | undefined
    const iconImg = scene.add.image(cx, cy - 43, iconKey ?? 'ico_damage')
      .setDisplaySize(24, 24).setScrollFactor(0).setDepth(42)
    tag(iconImg)

    const nameColor = (isNewWeapon || isNewPassive) ? '#fcd34d' : isWeapon ? '#93c5fd' : isPassive ? '#6ee7b7' : '#ffffff'
    const nameText = scene.add.text(cx, cy - 20, upgrade.name, {
      fontSize: '15px', color: nameColor, stroke: '#000', strokeThickness: 2,
      align: 'center', wordWrap: { width: cardW - 16 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(42)

    const descColor = (isNewWeapon || isNewPassive) ? '#fde68a' : isWeapon ? '#bfdbfe' : isPassive ? '#a7f3d0' : '#aaaacc'
    const descText = scene.add.text(cx, cy + 22, upgrade.desc, {
      fontSize: '12px', color: descColor,
      align: 'center', wordWrap: { width: cardW - 16 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(42)

    const isMultishot = (u.icon as string | undefined) === 'ico_projectiles'
    if (isMultishot) {
      const affected = scene.weapons.filter(wt => MULTISHOT_AFFECTS.has(wt))
      if (affected.length > 0) {
        const iconSize = 18
        const gap = 6
        const rowW = affected.length * iconSize + (affected.length - 1) * gap
        const rowY = cy + 56
        const startCx = cx - rowW / 2 + iconSize / 2
        affected.forEach((wt, idx) => {
          const ix = startCx + idx * (iconSize + gap)
          const wIcon = scene.add.image(ix, rowY, `wico_${wt}`)
            .setDisplaySize(iconSize, iconSize).setScrollFactor(0).setDepth(42)
          tag(wIcon)
        })
      }
    }

    const zone = scene.add.zone(cx, cy, cardW, cardH)
      .setScrollFactor(0).setDepth(43).setInteractive({ useHandCursor: true })

    zone.on('pointerover', () => setSelected(i))
    zone.on('pointerdown', () => confirm(i))

    tag(bg); tag(nameText); tag(descText); tag(zone)
  })

  const skipW = 140, skipH = 32
  const skipY = h / 2 + cardH / 2 + 35
  const skipBg = scene.add.graphics().setScrollFactor(0).setDepth(41)
  let skipHover = false
  const drawSkip = () => {
    skipBg.clear()
    skipBg.fillStyle(skipHover ? 0x2a2a3e : 0x16161e)
    skipBg.fillRoundedRect(w / 2 - skipW / 2, skipY - skipH / 2, skipW, skipH, 8)
    skipBg.lineStyle(skipHover ? 2 : 1, skipHover ? 0xfbbf24 : 0x3a3a5a)
    skipBg.strokeRoundedRect(w / 2 - skipW / 2, skipY - skipH / 2, skipW, skipH, 8)
  }
  drawSkip()
  const skipText = scene.add.text(w / 2, skipY, 'Skip (Esc)', {
    fontSize: '13px', color: '#aaaacc', stroke: '#000', strokeThickness: 2,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(42)
  const skipZone = scene.add.zone(w / 2, skipY, skipW, skipH)
    .setScrollFactor(0).setDepth(43).setInteractive({ useHandCursor: true })
  skipZone.on('pointerover', () => { skipHover = true; drawSkip() })
  skipZone.on('pointerout',  () => { skipHover = false; drawSkip() })
  skipZone.on('pointerdown', () => skip())
  tag(skipBg); tag(skipText); tag(skipZone)

  scene.input.keyboard?.on('keydown-LEFT',  moveLeft)
  scene.input.keyboard?.on('keydown-A',     moveLeft)
  scene.input.keyboard?.on('keydown-RIGHT', moveRight)
  scene.input.keyboard?.on('keydown-D',     moveRight)
  scene.input.keyboard?.on('keydown-SPACE', confirmKey)
  scene.input.keyboard?.on('keydown-ENTER', confirmKey)
  scene.input.keyboard?.on('keydown-ESC',   skip)

  scene.addStatsPanel((o: any) => tag(o))
}

export function pullOrbs(scene: IGameScene) {
  const px = scene.player.x, py = scene.player.y
  const magR2 = scene.magnetRadius * scene.magnetRadius
  for (const o of scene.xpOrbs.getChildren() as any[]) {
    const dx = px - o.x, dy = py - o.y
    const vacuumed = o.getData('vacuumed')
    if (vacuumed || dx*dx + dy*dy < magR2) {
      const dist = Math.sqrt(dx*dx + dy*dy)
      const vx = dx / dist, vy = dy / dist
      if (vacuumed) {
        o.setVelocity(vx * 520, vy * 520)
      } else {
        const spd = 120 + (scene.magnetRadius - dist) * 3
        o.setVelocity(vx * spd, vy * spd)
      }
    } else {
      o.setVelocity(0, 0)
    }
  }
}

export function unlockWeapon(scene: IGameScene, wt: WeaponType) {
  scene.weapons.push(wt)
  scene.weaponLevels[wt]     = 1
  
  if (wt === 'scythes')  scene.scythesCount = 1
  if (wt === 'tesla')    scene.teslaJumps = 2
  if (wt === 'boomerang') scene.boomerangCount = 1
  if (wt === 'rocket')   scene.rocketBurst = 1
  if (wt === 'trail')    scene.trailSize = 20
  if (wt === 'drones')   scene.droneCount = 1
  if (wt === 'orbital')  scene.orbitalCount = 1
  if (wt === 'turret')   scene.turretMax = Math.max(scene.turretMax, 2)
  if (wt === 'cleave')   scene.cleaveCount = 1

  if (scene.weaponShootRates[wt] === undefined) {
    scene.weaponShootRates[wt] = WEAPON_BASE[wt].shootRate
  }
  if (scene.weaponBulletSpd[wt] === undefined) {
    scene.weaponBulletSpd[wt] = WEAPON_BASE[wt].bulletSpd
  }
  scene.weaponCooldowns[wt]  = 0
  scene.rebuildWeaponHUDTexts()
}
