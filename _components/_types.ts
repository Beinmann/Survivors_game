export type WeaponType =
  | 'shotgun' | 'sniper' | 'aura' | 'machinegun' | 'scythes' | 'tesla'
  | 'boomerang' | 'rocket'
  | 'laser' | 'turret' | 'orbital' | 'blackhole' | 'cryo' | 'railgun' | 'drones'
  | 'cleave'

export const ALL_WEAPON_TYPES: WeaponType[] = [
  'shotgun', 'sniper', 'aura', 'machinegun', 'scythes', 'tesla',
  'boomerang', 'rocket',
  'laser', 'turret', 'orbital', 'blackhole', 'cryo', 'railgun', 'drones',
  'cleave',
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
  laser: 'Laser Beam',
  turret: 'Sentry Turret',
  orbital: 'Orbital Strike',
  blackhole: 'Black Hole',
  cryo: 'Cryo Shards',
  railgun: 'Plasma Lance',
  drones: 'Swarm Drones',
  cleave: 'Crescent Cleave',
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
  laser:      { shootRate: 250,  bulletSpd: 0,   damage: 12 },
  turret:     { shootRate: 6000, bulletSpd: 460, damage: 18 },
  orbital:    { shootRate: 3500, bulletSpd: 0,   damage: 90 },
  blackhole:  { shootRate: 7000, bulletSpd: 420, damage: 6 },
  cryo:       { shootRate: 900,  bulletSpd: 360, damage: 14 },
  railgun:    { shootRate: 4500, bulletSpd: 0,   damage: 35 },
  drones:     { shootRate: 1800, bulletSpd: 400, damage: 30 },
  cleave:     { shootRate: 1800, bulletSpd: 0,   damage: 80 },
}

export type PassiveType = 'movespeed' | 'bounty' | 'hp' | 'damage' | 'cooldown' | 'area' | 'projectiles'
export const ALL_PASSIVE_TYPES: PassiveType[] = ['movespeed', 'bounty', 'hp', 'damage', 'cooldown', 'area', 'projectiles']
export const PASSIVE_DATA: Record<PassiveType, { name: string, icon: string, desc: string, maxLevel?: number }> = {
  movespeed:   { name: 'Swift Feet',    icon: 'ico_movespeed',   desc: 'Move 20% faster' },
  bounty:      { name: 'Bounty Magnet', icon: 'ico_magnet',      desc: '+35px pickup range and +15% XP per orb' },
  hp:          { name: 'Vital Surge',   icon: 'ico_hp',          desc: '+25 max HP and +0.5 HP/s regen' },
  damage:      { name: 'Power Core',    icon: 'ico_damage',      desc: '+15% damage for all active weapons' },
  cooldown:    { name: 'Overclock',     icon: 'ico_cooldown',    desc: '−8% cooldown for all weapons' },
  area:        { name: 'Arcane Reach',  icon: 'ico_area',        desc: '+15% size to all weapons and shots' },
  projectiles: { name: 'Multishot',     icon: 'ico_projectiles', desc: '+1 projectile per volley', maxLevel: 2 },
}

export type EvolutionDef = {
  name: string
  desc: string
  icon: string
  linkedPassive: PassiveType
  linkedPassiveMinLevel: number
}

export const WEAPON_EVOLUTIONS: Partial<Record<WeaponType, EvolutionDef>> = {
  rocket: {
    name: 'Swarm Barrage',
    desc: '5-rocket salvo · each shatters into 6 homing shards',
    icon: 'wico_rocket_evolved',
    linkedPassive: 'damage',
    linkedPassiveMinLevel: 3,
  },
  blackhole: {
    name: 'Supermassive',
    desc: '×2 radius · ×3 pull · ×2 duration · ×2 tick damage',
    icon: 'wico_blackhole_evolved',
    linkedPassive: 'area',
    linkedPassiveMinLevel: 3,
  },
  cryo: {
    name: 'Glacial Volley',
    desc: '8 shards · ×2 slow · shards fracture into 2 on hit',
    icon: 'wico_cryo_evolved',
    linkedPassive: 'projectiles',
    linkedPassiveMinLevel: 2,
  },
  scythes: {
    name: 'Death Coil',
    desc: 'Two counter-rotating rings · +2 blades · always life steal',
    icon: 'wico_scythes_evolved',
    linkedPassive: 'area',
    linkedPassiveMinLevel: 3,
  },
  shotgun: {
    name: 'Thunder Hail',
    desc: 'Pellets chain a bolt to nearest enemy · wider cone · longer range',
    icon: 'wico_shotgun_evolved',
    linkedPassive: 'projectiles',
    linkedPassiveMinLevel: 2,
  },
  machinegun: {
    name: 'Flak Cannon',
    desc: 'Each bullet explodes · +80% damage · −30% fire rate',
    icon: 'wico_machinegun_evolved',
    linkedPassive: 'damage',
    linkedPassiveMinLevel: 3,
  },
  laser: {
    name: 'Prism Array',
    desc: 'Fires a + pattern — 4 independent beams per pulse',
    icon: 'wico_laser_evolved',
    linkedPassive: 'projectiles',
    linkedPassiveMinLevel: 2,
  },
  orbital: {
    name: 'Meteor Shower',
    desc: '5 strikes over a wide spread · 0.6s telegraph',
    icon: 'wico_orbital_evolved',
    linkedPassive: 'projectiles',
    linkedPassiveMinLevel: 2,
  },
  turret: {
    name: 'Mortar Squad',
    desc: 'Turrets fire mortar rockets · ×3 damage · slower fire rate',
    icon: 'wico_turret_evolved',
    linkedPassive: 'damage',
    linkedPassiveMinLevel: 3,
  },
  sniper: {
    name: 'Crit Cascade',
    desc: 'Shots ricochet to nearest enemy · up to 6 bounces at full damage',
    icon: 'wico_sniper_evolved',
    linkedPassive: 'area',
    linkedPassiveMinLevel: 3,
  },
  aura: {
    name: 'Thunderdome',
    desc: '×2 radius · ×2 pulse rate · each hit chains a bolt at +50% damage',
    icon: 'wico_aura_evolved',
    linkedPassive: 'area',
    linkedPassiveMinLevel: 3,
  },
  tesla: {
    name: 'Storm Surge',
    desc: 'Bolt detaches and roams — chains enemy-to-enemy on its own for ~1s',
    icon: 'wico_tesla_evolved',
    linkedPassive: 'damage',
    linkedPassiveMinLevel: 3,
  },
  boomerang: {
    name: 'Star Fan',
    desc: '5 piercing blades in a star · return paths seek enemies',
    icon: 'wico_boomerang_evolved',
    linkedPassive: 'projectiles',
    linkedPassiveMinLevel: 2,
  },
  railgun: {
    name: 'Starbreaker',
    desc: 'Sustain sweeps 360° around you — lighthouse beam',
    icon: 'wico_railgun_evolved',
    linkedPassive: 'area',
    linkedPassiveMinLevel: 3,
  },
  drones: {
    name: 'Hornet Swarm',
    desc: '+4 drones · ×2 attack rate · each attack fires a homing micro-rocket',
    icon: 'wico_drones_evolved',
    linkedPassive: 'projectiles',
    linkedPassiveMinLevel: 2,
  },
  cleave: {
    name: 'Sundering Edge',
    desc: 'Each slash launches an outgoing shockwave — pierces, ~2.2× range',
    icon: 'wico_cleave_evolved',
    linkedPassive: 'projectiles',
    linkedPassiveMinLevel: 2,
  },
}
