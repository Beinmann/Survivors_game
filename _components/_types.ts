export type WeaponType = 'shotgun' | 'sniper' | 'aura' | 'machinegun'

export const ALL_WEAPON_TYPES: WeaponType[] = ['shotgun', 'sniper', 'aura', 'machinegun']

export const WEAPON_NAMES: Record<WeaponType, string> = {
  shotgun: 'Shotgun',
  sniper: 'Sniper',
  aura: 'Shock Aura',
  machinegun: 'Machine Gun',
}

export const WEAPON_BASE: Record<WeaponType, { shootRate: number; bulletSpd: number }> = {
  shotgun:    { shootRate: 550,  bulletSpd: 320 },
  sniper:     { shootRate: 1400, bulletSpd: 680 },
  aura:       { shootRate: 500,  bulletSpd: 0   },
  machinegun: { shootRate: 100,  bulletSpd: 520 },
}
