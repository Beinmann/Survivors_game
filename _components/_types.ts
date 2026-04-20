export type WeaponType = 'shotgun' | 'sniper' | 'aura' | 'machinegun' | 'scythes' | 'tesla' | 'boomerang' | 'rocket' | 'trail'

export const ALL_WEAPON_TYPES: WeaponType[] = ['shotgun', 'sniper', 'aura', 'machinegun', 'scythes', 'tesla', 'boomerang', 'rocket', 'trail']

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
  trail:      { shootRate: 400,  bulletSpd: 0,   damage: 12 },
}

export type PassiveType = 'movespeed' | 'magnet' | 'orbmult' | 'hp' | 'damage' | 'cooldown'
export const ALL_PASSIVE_TYPES: PassiveType[] = ['movespeed', 'magnet', 'orbmult', 'hp', 'damage', 'cooldown']
export const PASSIVE_DATA: Record<PassiveType, { name: string, icon: string, desc: string }> = {
  movespeed: { name: 'Swift Feet',    icon: 'ico_movespeed', desc: 'Move 20% faster' },
  magnet:    { name: 'XP Magnet',     icon: 'ico_magnet',    desc: 'Pull orbs from 50px further away' },
  orbmult:   { name: 'Bounty Hunter', icon: 'ico_orbmult',   desc: 'Gain 25% more XP from every orb' },
  hp:        { name: 'Vital Surge',   icon: 'ico_hp',        desc: 'Restore 40 HP and raise max HP by 20' },
  damage:    { name: 'Power Core',    icon: 'ico_damage',    desc: '+15% damage for all active weapons' },
  cooldown:  { name: 'Overclock',     icon: 'ico_cooldown',  desc: 'All weapons fire 12% faster' },
}
