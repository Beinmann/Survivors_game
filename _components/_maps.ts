import { WORLD } from './_constants'
import { WaveDef } from './_waves'

export type MapKey = 'ruins' | 'swamp' | 'fortress' | 'speedzone'

export interface MapDef {
  key: MapKey
  name: string
  desc: string
  flavor: string
  accent: number
  bgBase: number
  bgLine: number
  bgDark: number
  bgAccent: number
  bgPattern: 'hex' | 'grid' | 'circuit' | 'wetland'
  enemyWeights: Partial<Record<string, number>>
  waves: WaveDef[]
}

export const MAPS: readonly MapDef[] = [
  {
    key: 'ruins',
    name: 'City Ruins',
    desc: 'The fallen city.\nAll enemy types.',
    flavor: 'Balanced',
    accent: 0x4ade80,
    bgBase: 0x0d1b2a,
    bgLine: 0x192840,
    bgDark: 0x101e32,
    bgAccent: 0x2e4870,
    bgPattern: 'hex',
    enemyWeights: {
      enemy_charger: 0.35,
      enemy_scavenger: 0.8,
      enemy_ambusher: 0.6,
    },
    waves: [
      { name: 'Vanguard',      durationSec: 45, weights: { enemy_grunt: 1.0 } },
      { name: 'Scavenger Raid', durationSec: 60, weights: { enemy_scavenger: 1.0, enemy_ambusher: 0.7 } },
      { name: 'Heavy Hitters', durationSec: 75, weights: { enemy_brute: 1.0, enemy_grunt: 0.4 } },
      { name: 'Crashers',      durationSec: 75, weights: { enemy_charger: 1.0, enemy_speeder: 0.6 } },
      { name: 'Warlord',       durationSec: 60, weights: { enemy_grunt: 0.5, enemy_elite: 0.7, enemy_brute: 0.5 }, isBoss: true },
      { name: 'The Remnant',   durationSec: 90, weights: { enemy_grunt: 0.5, enemy_speeder: 0.6, enemy_elite: 0.7, enemy_charger: 0.4, enemy_ghost: 0.5, enemy_swarm: 0.5 } },
      { name: 'Last Stand',    durationSec: 90, weights: { enemy_elite: 0.8, enemy_tank: 0.5, enemy_healer: 0.4, enemy_splitter: 0.5, enemy_brute: 0.5, enemy_grunt: 0.4 } },
    ],
  },
  {
    key: 'swamp',
    name: 'Toxic Swamp',
    desc: 'Murky and dangerous.\nGhosts and bombers lurk.',
    flavor: 'No tanks · No elites',
    accent: 0x4ade80,
    bgBase: 0x071410,
    bgLine: 0x122218,
    bgDark: 0x0a1a14,
    bgAccent: 0x1e3828,
    bgPattern: 'wetland',
    enemyWeights: {
      enemy_ghost: 2.5,
      enemy_bomber: 2.2,
      enemy_swarm: 2.0,
      enemy_speeder: 1.5,
      enemy_grunt: 0.6,
      enemy_charger: 0.1,
      enemy_elite: 0,
      enemy_tank: 0,
      enemy_plague: 1.5,
      enemy_nest: 0.4,
    },
    waves: [
      { name: 'Fog Rises',       durationSec: 45, weights: { enemy_grunt: 0.6, enemy_ghost: 1.5 } },
      { name: 'Phantom Tide',    durationSec: 60, weights: { enemy_ghost: 1.0 } },
      { name: 'Bomb Run',        durationSec: 75, weights: { enemy_bomber: 1.0, enemy_grunt: 0.4 } },
      { name: 'Plaguebearers',   durationSec: 75, weights: { enemy_plague: 1.8, enemy_grunt: 0.4 } },
      { name: 'Swamp Warden',    durationSec: 60, weights: { enemy_ghost: 1.2, enemy_plague: 1.0 }, isBoss: true },
      { name: 'Nesting Grounds', durationSec: 90, weights: { enemy_nest: 0.7, enemy_swarm: 2.0, enemy_ghost: 0.8 } },
      { name: 'Miasma',          durationSec: 90, weights: { enemy_plague: 1.6, enemy_ghost: 1.6, enemy_swarm: 1.2, enemy_healer: 0.5, enemy_bomber: 0.6 } },
    ],
  },
  {
    key: 'fortress',
    name: 'Corrupted Fortress',
    desc: 'Armored enemies rule.\nSlow but brutal.',
    flavor: 'No ghosts · No swarms',
    accent: 0xf97316,
    bgBase: 0x150e06,
    bgLine: 0x261a0e,
    bgDark: 0x1a1208,
    bgAccent: 0x3a2510,
    bgPattern: 'grid',
    enemyWeights: {
      enemy_tank: 1.8,
      enemy_brute: 1.6,
      enemy_elite: 1.8,
      enemy_charger: 0.25,
      enemy_grunt: 0.4,
      enemy_speeder: 0.2,
      enemy_ghost: 0,
      enemy_swarm: 0,
      enemy_juggernaut: 0.8,
      enemy_sapper: 0.6,
      enemy_berserker: 1.0,
      enemy_lockdown: 0.5,
    },
    waves: [
      { name: 'Garrison',     durationSec: 45, weights: { enemy_grunt: 0.6, enemy_brute: 1.0 } },
      { name: 'Heavy Watch',  durationSec: 60, weights: { enemy_brute: 1.4, enemy_tank: 0.8 } },
      { name: 'Shock Troops', durationSec: 75, weights: { enemy_charger: 1.0, enemy_berserker: 1.0 } },
      { name: 'Bulwark',      durationSec: 75, weights: { enemy_tank: 1.4, enemy_juggernaut: 0.7 } },
      { name: 'Warden',       durationSec: 60, weights: { enemy_tank: 0.8, enemy_juggernaut: 0.6, enemy_elite: 0.8, enemy_brute: 0.6 }, isBoss: true },
      { name: 'Iron Column',  durationSec: 90, weights: { enemy_sapper: 0.8, enemy_lockdown: 0.7, enemy_brute: 1.0, enemy_grunt: 0.3 } },
      { name: 'Reckoning',    durationSec: 90, weights: { enemy_juggernaut: 1.0, enemy_tank: 1.5, enemy_elite: 1.8, enemy_brute: 1.2, enemy_sapper: 0.5, enemy_healer: 0.5, enemy_lockdown: 0.6 } },
    ],
  },
  {
    key: 'speedzone',
    name: 'Speed Zone',
    desc: 'Everything moves faster.\nSpeeders and chargers swarm.',
    flavor: 'No tanks · No bombers',
    accent: 0x22d3ee,
    bgBase: 0x060f18,
    bgLine: 0x0c1e2e,
    bgDark: 0x081420,
    bgAccent: 0x0e2d44,
    bgPattern: 'circuit',
    enemyWeights: {
      enemy_speeder: 3.0,
      enemy_charger: 1.2,
      enemy_elite: 2.0,
      enemy_swarm: 1.5,
      enemy_grunt: 0.3,
      enemy_tank: 0,
      enemy_bomber: 0,
      enemy_brute: 0,
      enemy_hunter: 1.4,
      enemy_dasher: 1.0,
      enemy_blinker: 1.0,
    },
    waves: [
      { name: 'Runners',           durationSec: 45, weights: { enemy_speeder: 1.0 } },
      { name: 'Pack Hunters',      durationSec: 60, weights: { enemy_speeder: 1.5, enemy_hunter: 1.2 } },
      { name: 'Blink Strike',      durationSec: 75, weights: { enemy_dasher: 1.3, enemy_blinker: 1.3 } },
      { name: 'Elite Circuit',     durationSec: 75, weights: { enemy_elite: 1.8, enemy_charger: 0.9 } },
      { name: 'Velocity',          durationSec: 60, weights: { enemy_speeder: 2.0, enemy_elite: 1.5, enemy_hunter: 1.0 }, isBoss: true },
      { name: 'Overdrive',         durationSec: 90, weights: { enemy_speeder: 2.5, enemy_dasher: 1.3, enemy_blinker: 1.3, enemy_swarm: 1.2 } },
      { name: 'Terminal Velocity', durationSec: 90, weights: { enemy_speeder: 2.5, enemy_elite: 2.0, enemy_hunter: 1.4, enemy_dasher: 1.3, enemy_blinker: 1.3, enemy_charger: 1.0 } },
    ],
  },
]

export function getMapDef(key: MapKey): MapDef {
  return MAPS.find(m => m.key === key) ?? MAPS[0]
}

export function drawBackground(bg: any, map: MapDef): void {
  bg.fillStyle(map.bgBase)
  bg.fillRect(0, 0, WORLD, WORLD)

  switch (map.bgPattern) {
    case 'hex':     drawHex(bg, map);     break
    case 'grid':    drawGrid(bg, map);    break
    case 'circuit': drawCircuit(bg, map); break
    case 'wetland': drawWetland(bg, map); break
  }
}

function drawHex(bg: any, map: MapDef): void {
  const hexR = 80
  const hStep = Math.sqrt(3) * hexR
  const vStep = 1.5 * hexR
  const hexAngles = Array.from({ length: 6 }, (_, i) => (30 + 60 * i) * Math.PI / 180)
  const hexCols = Math.ceil(WORLD / hStep) + 2
  const hexRows = Math.ceil(WORLD / vStep) + 2

  const traceHex = (cx: number, cy: number) => {
    bg.beginPath()
    hexAngles.forEach((a, i) => {
      const px = cx + Math.cos(a) * hexR
      const py = cy + Math.sin(a) * hexR
      if (i === 0) bg.moveTo(px, py); else bg.lineTo(px, py)
    })
    bg.closePath()
  }

  bg.fillStyle(map.bgDark)
  for (let row = 0; row <= hexRows; row++) {
    for (let col = 0; col <= hexCols; col++) {
      const cx = col * hStep + (row % 2 !== 0 ? hStep / 2 : 0)
      const cy = row * vStep
      if (Math.abs(Math.sin(col * 127.1 + row * 311.7)) < 0.08) {
        traceHex(cx, cy); bg.fillPath()
      }
    }
  }

  bg.lineStyle(1, map.bgLine)
  for (let row = 0; row <= hexRows; row++) {
    for (let col = 0; col <= hexCols; col++) {
      const cx = col * hStep + (row % 2 !== 0 ? hStep / 2 : 0)
      const cy = row * vStep
      traceHex(cx, cy); bg.strokePath()
    }
  }

  bg.lineStyle(2, map.bgAccent)
  bg.fillStyle(map.bgAccent)
  for (let row = 0; row <= hexRows; row++) {
    for (let col = 0; col <= hexCols; col++) {
      const cx = col * hStep + (row % 2 !== 0 ? hStep / 2 : 0)
      const cy = row * vStep
      if (Math.abs(Math.sin(col * 127.1 + row * 311.7)) < 0.03) {
        traceHex(cx, cy); bg.strokePath()
        bg.fillRect(cx - 1, cy - 1, 3, 3)
      }
    }
  }
}

function drawGrid(bg: any, map: MapDef): void {
  const step = 120
  bg.fillStyle(map.bgDark)
  for (let x = 0; x < WORLD; x += step) {
    for (let y = 0; y < WORLD; y += step) {
      if (Math.abs(Math.sin(x * 0.041 + y * 0.017)) < 0.12) {
        bg.fillRect(x, y, step, step)
      }
    }
  }
  bg.lineStyle(1, map.bgLine)
  bg.beginPath()
  for (let x = 0; x <= WORLD; x += step) {
    bg.moveTo(x, 0); bg.lineTo(x, WORLD)
  }
  for (let y = 0; y <= WORLD; y += step) {
    bg.moveTo(0, y); bg.lineTo(WORLD, y)
  }
  bg.strokePath()
  bg.fillStyle(map.bgAccent)
  for (let x = 0; x <= WORLD; x += step) {
    for (let y = 0; y <= WORLD; y += step) {
      if (Math.abs(Math.sin(x * 0.041 + y * 0.017)) < 0.06) {
        bg.fillRect(x - 2, y - 2, 5, 5)
      }
    }
  }
}

function drawCircuit(bg: any, map: MapDef): void {
  const step = 100
  const cols = Math.ceil(WORLD / step) + 1
  const rows = Math.ceil(WORLD / step) + 1
  bg.lineStyle(1, map.bgLine)
  bg.beginPath()
  for (let x = 0; x <= WORLD; x += step) {
    bg.moveTo(x, 0); bg.lineTo(x, WORLD)
  }
  for (let y = 0; y <= WORLD; y += step) {
    bg.moveTo(0, y); bg.lineTo(WORLD, y)
  }
  bg.strokePath()
  bg.lineStyle(2, map.bgAccent)
  bg.beginPath()
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const x = col * step
      const y = row * step
      if (Math.sin(col * 73.1 + row * 131.7) > 0.55) {
        bg.moveTo(x, y); bg.lineTo(x + step, y)
      }
      if (Math.sin(col * 119.3 + row * 57.9) > 0.55) {
        bg.moveTo(x, y); bg.lineTo(x, y + step)
      }
    }
  }
  bg.strokePath()
  bg.fillStyle(map.bgAccent)
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      if (Math.abs(Math.sin(col * 73.1 + row * 131.7)) < 0.08) {
        bg.fillRect(col * step - 3, row * step - 3, 7, 7)
      }
    }
  }
}

function drawWetland(bg: any, map: MapDef): void {
  bg.fillStyle(map.bgDark)
  for (let i = 0; i < 350; i++) {
    const x = Math.abs(Math.sin(i * 73.1)) * WORLD
    const y = Math.abs(Math.sin(i * 131.7 + 1)) * WORLD
    const w = 60 + Math.abs(Math.sin(i * 57.3)) * 160
    const h = 30 + Math.abs(Math.sin(i * 97.1 + 3)) * 80
    bg.fillEllipse(x, y, w, h)
  }
  bg.lineStyle(1, map.bgLine)
  for (let i = 0; i < 180; i++) {
    const x = Math.abs(Math.sin(i * 41.3 + 7)) * WORLD
    const y = Math.abs(Math.sin(i * 89.7 + 2)) * WORLD
    const r = 20 + Math.abs(Math.sin(i * 61.1)) * 60
    bg.strokeCircle(x, y, r)
  }
  bg.fillStyle(map.bgAccent)
  for (let i = 0; i < 120; i++) {
    const x = Math.abs(Math.sin(i * 23.7 + 4)) * WORLD
    const y = Math.abs(Math.sin(i * 53.1 + 9)) * WORLD
    bg.fillRect(x - 1, y - 1, 3, 3)
  }
}
