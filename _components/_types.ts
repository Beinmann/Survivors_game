export type WeaponType =
  | 'shotgun' | 'sniper' | 'aura' | 'machinegun' | 'scythes' | 'tesla'
  | 'boomerang' | 'rocket' | 'trail'
  | 'laser' | 'turret' | 'orbital' | 'blackhole' | 'grenade' | 'cryo' | 'railgun' | 'drones'

export const ALL_WEAPON_TYPES: WeaponType[] = [
  'shotgun', 'sniper', 'aura', 'machinegun', 'scythes', 'tesla',
  'boomerang', 'rocket', 'trail',
  'laser', 'turret', 'orbital', 'blackhole', 'grenade', 'cryo', 'railgun', 'drones',
]

export const WEAPON_NAMES: Record<WeaponType, string> = {
  shotgun: 'Shotgun',
  sniper: 'Sniper',
  aura: 'Shock Aura',
  machinegun: 'Machine Gun',
  scythes: 'Spectral Scythes',
  tesla: 'Tesla Chain',
  boomerang: 'Ricochet Boomerang',
  rocket: 'Homing Rockets',
  trail: 'Incendiary Trail',
  laser: 'Laser Beam',
  turret: 'Sentry Turret',
  orbital: 'Orbital Strike',
  blackhole: 'Black Hole',
  grenade: 'Grenade Launcher',
  cryo: 'Cryo Shards',
  railgun: 'Railgun',
  drones: 'Swarm Drones',
}

export const WEAPON_BASE: Record<WeaponType, { shootRate: number; bulletSpd: number; damage: number }> = {
  shotgun:    { shootRate: 950,  bulletSpd: 320, damage: 30 },
  sniper:     { shootRate: 1400, bulletSpd: 680, damage: 150 },
  aura:       { shootRate: 500,  bulletSpd: 0,   damage: 10 },
  machinegun: { shootRate: 200,  bulletSpd: 520, damage: 4 },
  scythes:    { shootRate: 1500, bulletSpd: 0,   damage: 25 },
  tesla:      { shootRate: 1400, bulletSpd: 0,   damage: 13 },
  boomerang:  { shootRate: 1000, bulletSpd: 350, damage: 22 },
  rocket:     { shootRate: 1500, bulletSpd: 250, damage: 45 },
  trail:      { shootRate: 100,  bulletSpd: 0,   damage: 12 },
  laser:      { shootRate: 250,  bulletSpd: 0,   damage: 12 },
  turret:     { shootRate: 6000, bulletSpd: 460, damage: 18 },
  orbital:    { shootRate: 3500, bulletSpd: 0,   damage: 90 },
  blackhole:  { shootRate: 7000, bulletSpd: 420, damage: 6 },
  grenade:    { shootRate: 1200, bulletSpd: 380, damage: 55 },
  cryo:       { shootRate: 900,  bulletSpd: 360, damage: 14 },
  railgun:    { shootRate: 4500, bulletSpd: 0,   damage: 300 },
  drones:     { shootRate: 1800, bulletSpd: 400, damage: 30 },
}

export type PassiveType = 'movespeed' | 'magnet' | 'orbmult' | 'hp' | 'damage' | 'cooldown' | 'area' | 'projectiles'
export const ALL_PASSIVE_TYPES: PassiveType[] = ['movespeed', 'magnet', 'orbmult', 'hp', 'damage', 'cooldown', 'area', 'projectiles']
export const PASSIVE_DATA: Record<PassiveType, { name: string, icon: string, desc: string, maxLevel?: number }> = {
  movespeed:   { name: 'Swift Feet',    icon: 'ico_movespeed',   desc: 'Move 20% faster' },
  magnet:      { name: 'XP Magnet',     icon: 'ico_magnet',      desc: 'Pull orbs from 50px further away' },
  orbmult:     { name: 'Bounty Hunter', icon: 'ico_orbmult',     desc: 'Gain 25% more XP from every orb' },
  hp:          { name: 'Vital Surge',   icon: 'ico_hp',          desc: '+25 max HP and +0.5 HP/s regen' },
  damage:      { name: 'Power Core',    icon: 'ico_damage',      desc: '+15% damage for all active weapons' },
  cooldown:    { name: 'Overclock',     icon: 'ico_cooldown',    desc: 'All weapons fire 12% faster' },
  area:        { name: 'Arcane Reach',  icon: 'ico_area',        desc: '+15% size to all weapons and shots' },
  projectiles: { name: 'Multishot',     icon: 'ico_projectiles', desc: '+1 projectile per volley', maxLevel: 2 },
}
