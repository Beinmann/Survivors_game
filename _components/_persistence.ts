import { WeaponType, ALL_WEAPON_TYPES } from './_types'

export type ModeKey = 'oneWeapon'

interface MetaSave {
  version: 1
  coins: number
  unlockedWeapons: WeaponType[]
  unlockedModes: ModeKey[]
}

const STORAGE_KEY = 'survivors_game_meta_v1'

const DEFAULTS: MetaSave = {
  version: 1,
  coins: 0,
  unlockedWeapons: ['shotgun', 'machinegun'],
  unlockedModes: [],
}

const TIER_STARTER = 50
const TIER_MID = 150
const TIER_ADVANCED = 300
const MODE_ONE_WEAPON_COST = 500

export const WEAPON_COSTS: Record<WeaponType, number> = {
  shotgun: 0,
  machinegun: 0,
  sniper: TIER_STARTER,
  aura: TIER_STARTER,
  scythes: TIER_MID,
  tesla: TIER_MID,
  boomerang: TIER_MID,
  rocket: TIER_MID,
  trail: TIER_MID,
  cryo: TIER_MID,
  cleave: TIER_MID,
  laser: TIER_ADVANCED,
  turret: TIER_ADVANCED,
  orbital: TIER_ADVANCED,
  blackhole: TIER_ADVANCED,
  railgun: TIER_ADVANCED,
  drones: TIER_ADVANCED,
}

export const MODE_COSTS: Record<ModeKey, number> = {
  oneWeapon: MODE_ONE_WEAPON_COST,
}

function hasLS(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

function cloneDefaults(): MetaSave {
  return {
    version: 1,
    coins: DEFAULTS.coins,
    unlockedWeapons: [...DEFAULTS.unlockedWeapons],
    unlockedModes: [...DEFAULTS.unlockedModes],
  }
}

function loadMeta(): MetaSave {
  if (!hasLS()) return cloneDefaults()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneDefaults()
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== 1) return cloneDefaults()
    const validWeapons = new Set<string>(ALL_WEAPON_TYPES)
    const unlockedWeapons: WeaponType[] = Array.isArray(parsed.unlockedWeapons)
      ? parsed.unlockedWeapons.filter((w: unknown): w is WeaponType => typeof w === 'string' && validWeapons.has(w))
      : [...DEFAULTS.unlockedWeapons]
    const unlockedModes: ModeKey[] = Array.isArray(parsed.unlockedModes)
      ? parsed.unlockedModes.filter((m: unknown): m is ModeKey => m === 'oneWeapon')
      : []
    const coins = typeof parsed.coins === 'number' && isFinite(parsed.coins) ? Math.max(0, Math.floor(parsed.coins)) : 0
    return { version: 1, coins, unlockedWeapons, unlockedModes }
  } catch {
    return cloneDefaults()
  }
}

function saveMeta(m: MetaSave): void {
  if (!hasLS()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(m))
  } catch {
    // quota exceeded or private-browsing lockdown — silently ignore
  }
}

export function getCoins(): number {
  return loadMeta().coins
}

export function awardCoins(n: number): void {
  if (n <= 0) return
  const m = loadMeta()
  m.coins += Math.floor(n)
  saveMeta(m)
}

export function spendCoins(n: number): boolean {
  const m = loadMeta()
  if (m.coins < n) return false
  m.coins -= n
  saveMeta(m)
  return true
}

export function isWeaponUnlocked(wt: WeaponType): boolean {
  return loadMeta().unlockedWeapons.includes(wt)
}

export function unlockWeaponMeta(wt: WeaponType): void {
  const m = loadMeta()
  if (m.unlockedWeapons.includes(wt)) return
  m.unlockedWeapons.push(wt)
  saveMeta(m)
}

export function isModeUnlocked(k: ModeKey): boolean {
  return loadMeta().unlockedModes.includes(k)
}

export function unlockMode(k: ModeKey): void {
  const m = loadMeta()
  if (m.unlockedModes.includes(k)) return
  m.unlockedModes.push(k)
  saveMeta(m)
}

export function getWeaponCost(wt: WeaponType): number {
  return WEAPON_COSTS[wt]
}

export function getModeCost(k: ModeKey): number {
  return MODE_COSTS[k]
}
