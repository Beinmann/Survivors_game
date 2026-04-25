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
  bgPattern: 'streets' | 'mire' | 'volcanic' | 'raceway'
  enemyWeights: Partial<Record<string, number>>
  waves: WaveDef[]
}

export const MAPS: readonly MapDef[] = [
  {
    key: 'ruins',
    name: 'City Ruins',
    desc: 'The fallen city.\nAll enemy types.',
    flavor: 'Balanced',
    accent: 0x9aa0a6,
    bgBase: 0x1a1a1c,
    bgLine: 0x2c2c30,
    bgDark: 0x121214,
    bgAccent: 0x6b5028,
    bgPattern: 'streets',
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
    bgBase: 0x07140e,
    bgLine: 0x12281a,
    bgDark: 0x0a1a14,
    bgAccent: 0x3aa860,
    bgPattern: 'mire',
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
    name: 'Volcanic Citadel',
    desc: 'Armored enemies rule.\nSlow but brutal.',
    flavor: 'No ghosts · No swarms',
    accent: 0xff6a2c,
    bgBase: 0x0a0807,
    bgLine: 0x1a1410,
    bgDark: 0x141008,
    bgAccent: 0xff6020,
    bgPattern: 'volcanic',
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
    name: 'Neon Raceway',
    desc: 'Everything moves faster.\nSpeeders and chargers swarm.',
    flavor: 'No tanks · No bombers',
    accent: 0x40e0ff,
    bgBase: 0x05080c,
    bgLine: 0x101820,
    bgDark: 0x080c12,
    bgAccent: 0x40e0ff,
    bgPattern: 'raceway',
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
      { name: 'Quick Step',        durationSec: 60, weights: { enemy_dasher: 1.3, enemy_speeder: 1.0 } },
      { name: 'Slipstream',        durationSec: 45, weights: { enemy_grunt: 0.6, enemy_speeder: 0.9 } },
      { name: 'Phase Shift',       durationSec: 75, weights: { enemy_speeder: 1.5, enemy_blinker: 0.8 } },
      { name: 'Velocity',          durationSec: 60, weights: { enemy_speeder: 2.0, enemy_elite: 1.5, enemy_hunter: 1.0 }, isBoss: true },
      { name: 'Terminal Velocity', durationSec: 90, weights: { enemy_speeder: 2.5, enemy_elite: 2.0, enemy_hunter: 1.4, enemy_dasher: 1.2, enemy_blinker: 0.9, enemy_charger: 1.0 } },
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
    case 'streets':  drawStreets(bg, map);  break
    case 'mire':     drawMire(bg, map);     break
    case 'volcanic': drawVolcanic(bg, map); break
    case 'raceway':  drawRaceway(bg, map);  break
  }
}

function drawStreets(bg: any, map: MapDef): void {
  const slabStep = 320
  const slabCols = Math.ceil(WORLD / slabStep)
  const slabRows = Math.ceil(WORLD / slabStep)

  bg.fillStyle(map.bgDark)
  for (let i = 0; i < 220; i++) {
    const x = Math.abs(Math.sin(i * 73.1)) * WORLD
    const y = Math.abs(Math.sin(i * 131.7 + 1)) * WORLD
    const r = 35 + Math.abs(Math.sin(i * 57.3)) * 75
    bg.fillCircle(x, y, r)
  }

  bg.lineStyle(1, map.bgLine)
  bg.beginPath()
  for (let c = 0; c <= slabCols; c++) {
    const x = c * slabStep
    bg.moveTo(x, 0); bg.lineTo(x, WORLD)
  }
  for (let r = 0; r <= slabRows; r++) {
    const y = r * slabStep
    bg.moveTo(0, y); bg.lineTo(WORLD, y)
  }
  bg.strokePath()

  bg.lineStyle(1, map.bgLine)
  bg.beginPath()
  for (let c = 0; c < slabCols; c++) {
    for (let r = 0; r < slabRows; r++) {
      const seed = Math.sin(c * 73.1 + r * 131.7)
      if (Math.abs(seed) < 0.10) {
        const cx = c * slabStep
        const cy = r * slabStep
        const x1 = cx + 30 + Math.abs(Math.sin(c * 41.3 + r * 89.7)) * (slabStep - 60)
        const x2 = cx + Math.abs(Math.sin(c * 19.7 + r * 11.3)) * slabStep
        const x3 = cx + Math.abs(Math.sin(c * 53.1 + r * 67.7)) * slabStep
        const x4 = cx + 30 + Math.abs(Math.sin(c * 31.7 + r * 17.9)) * (slabStep - 60)
        bg.moveTo(x1, cy)
        bg.lineTo(x2, cy + slabStep / 3)
        bg.lineTo(x3, cy + (2 * slabStep) / 3)
        bg.lineTo(x4, cy + slabStep)
      }
    }
  }
  bg.strokePath()

  bg.fillStyle(map.bgDark)
  bg.lineStyle(1, map.bgBase)
  for (let c = 0; c < slabCols; c++) {
    for (let r = 0; r < slabRows; r++) {
      if (Math.abs(Math.sin(c * 17.3 + r * 23.7)) < 0.004) {
        const cx = c * slabStep + slabStep / 2
        const cy = r * slabStep + slabStep / 2
        bg.fillRect(cx - 12, cy - 8, 24, 16)
        bg.beginPath()
        bg.moveTo(cx - 12, cy - 4); bg.lineTo(cx + 12, cy - 4)
        bg.moveTo(cx - 12, cy);     bg.lineTo(cx + 12, cy)
        bg.moveTo(cx - 12, cy + 4); bg.lineTo(cx + 12, cy + 4)
        bg.strokePath()
      }
    }
  }

  bg.fillStyle(map.bgLine)
  for (let i = 0; i < 90; i++) {
    const cx = Math.abs(Math.sin(i * 23.7 + 4)) * WORLD
    const cy = Math.abs(Math.sin(i * 53.1 + 9)) * WORLD
    const pieces = 4 + Math.floor(Math.abs(Math.sin(i * 11.3)) * 4)
    for (let j = 0; j < pieces; j++) {
      const dx = Math.sin(i * 7.7 + j * 13.1) * 32
      const dy = Math.cos(i * 11.3 + j * 19.7) * 32
      const w = 6 + Math.abs(Math.sin(i * 5.7 + j * 17.3)) * 10
      const h = 6 + Math.abs(Math.cos(i * 9.1 + j * 23.7)) * 10
      bg.fillRect(cx + dx, cy + dy, w, h)
    }
  }

  bg.fillStyle(map.bgAccent)
  const hLanes = [1500, 4200, 7800, 10800]
  for (const ly of hLanes) {
    for (let x = 0; x < WORLD; x += 100) {
      bg.fillRect(x, ly, 60, 4)
    }
  }
  const vLanes = [2300, 5500, 8900, 11500]
  for (const lx of vLanes) {
    for (let y = 0; y < WORLD; y += 100) {
      bg.fillRect(lx, y, 4, 60)
    }
  }
}

function drawMire(bg: any, map: MapDef): void {
  bg.fillStyle(map.bgDark)
  for (let i = 0; i < 90; i++) {
    const x = Math.abs(Math.sin(i * 73.1)) * WORLD
    const y = Math.abs(Math.sin(i * 131.7 + 1)) * WORLD
    const w = 200 + Math.abs(Math.sin(i * 57.3)) * 300
    const h = 150 + Math.abs(Math.sin(i * 97.1 + 3)) * 250
    bg.fillEllipse(x, y, w, h)
  }

  bg.lineStyle(2, map.bgLine)
  bg.beginPath()
  for (let i = 0; i < 60; i++) {
    let x = Math.abs(Math.sin(i * 41.3 + 7)) * WORLD
    let y = Math.abs(Math.sin(i * 89.7 + 2)) * WORLD
    bg.moveTo(x, y)
    let angle = Math.sin(i * 11.7) * Math.PI * 2
    for (let s = 0; s < 8; s++) {
      const segLen = 80 + Math.abs(Math.sin(i * 31.3 + s * 17.7)) * 60
      angle += Math.sin(i * 47.1 + s * 23.7) * 0.7
      x += Math.cos(angle) * segLen
      y += Math.sin(angle) * segLen
      bg.lineTo(x, y)
    }
  }
  bg.strokePath()

  bg.fillStyle(map.bgLine)
  for (let i = 0; i < 50; i++) {
    const cx = Math.abs(Math.sin(i * 23.7 + 4)) * WORLD
    const cy = Math.abs(Math.sin(i * 53.1 + 9)) * WORLD
    const ang = Math.sin(i * 17.3) * Math.PI
    const halfW = 15
    const halfH = 3
    const cosA = Math.cos(ang)
    const sinA = Math.sin(ang)
    bg.beginPath()
    bg.moveTo(cx + (-halfW) * cosA - (-halfH) * sinA, cy + (-halfW) * sinA + (-halfH) * cosA)
    bg.lineTo(cx + ( halfW) * cosA - (-halfH) * sinA, cy + ( halfW) * sinA + (-halfH) * cosA)
    bg.lineTo(cx + ( halfW) * cosA - ( halfH) * sinA, cy + ( halfW) * sinA + ( halfH) * cosA)
    bg.lineTo(cx + (-halfW) * cosA - ( halfH) * sinA, cy + (-halfW) * sinA + ( halfH) * cosA)
    bg.closePath()
    bg.fillPath()
  }

  bg.fillStyle(map.bgAccent)
  for (let i = 0; i < 80; i++) {
    const cx = Math.abs(Math.sin(i * 19.3 + 11)) * WORLD
    const cy = Math.abs(Math.sin(i * 67.7 + 13)) * WORLD
    const count = 4 + Math.floor(Math.abs(Math.sin(i * 11.3)) * 4)
    for (let j = 0; j < count; j++) {
      const dx = Math.sin(i * 7.7 + j * 13.1) * 25
      const dy = Math.cos(i * 11.3 + j * 19.7) * 25
      const sz = 2 + Math.abs(Math.sin(i + j * 5.7)) * 2
      bg.fillCircle(cx + dx, cy + dy, sz)
    }
  }
}

function drawVolcanic(bg: any, map: MapDef): void {
  const tileStep = 240
  const cols = Math.ceil(WORLD / tileStep)
  const rows = Math.ceil(WORLD / tileStep)

  const cornerJitter = (c: number, r: number, salt: number) =>
    Math.sin(c * 13.7 + r * 91.3 + salt * 7.1) * 22

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = c * tileStep
      const y = r * tileStep
      const useDark = Math.abs(Math.sin(c * 89.7 + r * 53.1)) < 0.3
      bg.fillStyle(useDark ? map.bgDark : map.bgBase)

      bg.beginPath()
      bg.moveTo(x + cornerJitter(c, r, 0),                y + cornerJitter(c, r, 1))
      bg.lineTo(x + tileStep + cornerJitter(c + 1, r, 0), y + cornerJitter(c + 1, r, 1))
      bg.lineTo(x + tileStep + cornerJitter(c + 1, r + 1, 0), y + tileStep + cornerJitter(c + 1, r + 1, 1))
      bg.lineTo(x + cornerJitter(c, r + 1, 0),            y + tileStep + cornerJitter(c, r + 1, 1))
      bg.closePath()
      bg.fillPath()
    }
  }

  bg.lineStyle(1, map.bgLine)
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = c * tileStep
      const y = r * tileStep
      bg.beginPath()
      bg.moveTo(x + cornerJitter(c, r, 0),                y + cornerJitter(c, r, 1))
      bg.lineTo(x + tileStep + cornerJitter(c + 1, r, 0), y + cornerJitter(c + 1, r, 1))
      bg.lineTo(x + tileStep + cornerJitter(c + 1, r + 1, 0), y + tileStep + cornerJitter(c + 1, r + 1, 1))
      bg.lineTo(x + cornerJitter(c, r + 1, 0),            y + tileStep + cornerJitter(c, r + 1, 1))
      bg.closePath()
      bg.strokePath()
    }
  }

  bg.fillStyle(map.bgDark, 0.6)
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (Math.abs(Math.sin(c * 31.7 + r * 67.3)) < 0.008) {
        const cx = c * tileStep + tileStep / 2
        const cy = r * tileStep + tileStep / 2
        const radius = 30 + Math.abs(Math.sin(c * 17.3 + r * 23.7)) * 30
        bg.fillCircle(cx, cy, radius)
      }
    }
  }

  bg.lineStyle(2, map.bgAccent)
  bg.beginPath()
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = c * tileStep
      const y = r * tileStep
      if (Math.abs(Math.sin(c * 113.7 + r * 79.3)) < 0.03) {
        bg.moveTo(x + tileStep + cornerJitter(c + 1, r, 0), y + cornerJitter(c + 1, r, 1))
        bg.lineTo(x + tileStep + cornerJitter(c + 1, r + 1, 0), y + tileStep + cornerJitter(c + 1, r + 1, 1))
      }
      if (Math.abs(Math.sin(c * 47.1 + r * 29.7)) < 0.03) {
        bg.moveTo(x + cornerJitter(c, r + 1, 0),                y + tileStep + cornerJitter(c, r + 1, 1))
        bg.lineTo(x + tileStep + cornerJitter(c + 1, r + 1, 0), y + tileStep + cornerJitter(c + 1, r + 1, 1))
      }
    }
  }
  bg.strokePath()
}

function drawRaceway(bg: any, map: MapDef): void {
  bg.fillStyle(map.bgLine)
  for (let i = 0; i < 3000; i++) {
    const x = Math.abs(Math.sin(i * 73.1)) * WORLD
    const y = Math.abs(Math.sin(i * 131.7 + 1)) * WORLD
    bg.fillRect(x, y, 1, 1)
  }

  bg.fillStyle(map.bgDark)
  for (let i = 0; i < 150; i++) {
    const x = Math.abs(Math.sin(i * 41.3 + 7)) * WORLD
    const y = Math.abs(Math.sin(i * 89.7 + 2)) * WORLD
    const w = 80 + Math.abs(Math.sin(i * 57.3)) * 150
    const h = 60 + Math.abs(Math.sin(i * 97.1 + 3)) * 120
    bg.fillEllipse(x, y, w, h)
  }

  bg.fillStyle(map.bgAccent, 0.6)
  const hLanes = [2200, 5000, 7900, 10500]
  for (const ly of hLanes) {
    for (let x = 0; x < WORLD; x += 140) {
      bg.fillRect(x, ly, 80, 2)
    }
  }
  const vLanes = [1800, 4500, 7200, 10800]
  for (const lx of vLanes) {
    for (let y = 0; y < WORLD; y += 140) {
      bg.fillRect(lx, y, 2, 80)
    }
  }

  bg.lineStyle(2, map.bgAccent, 0.7)
  bg.beginPath()
  for (let i = 0; i < 120; i++) {
    const cx = Math.abs(Math.sin(i * 23.7 + 4)) * WORLD
    const cy = Math.abs(Math.sin(i * 53.1 + 9)) * WORLD
    const dirIdx = Math.floor(Math.abs(Math.sin(i * 11.3)) * 8)
    const angle = (dirIdx * Math.PI) / 4
    const size = 16
    const tipX = cx + Math.cos(angle) * size
    const tipY = cy + Math.sin(angle) * size
    const wing1Ang = angle + Math.PI * 0.75
    const wing2Ang = angle - Math.PI * 0.75
    bg.moveTo(cx + Math.cos(wing1Ang) * size, cy + Math.sin(wing1Ang) * size)
    bg.lineTo(tipX, tipY)
    bg.lineTo(cx + Math.cos(wing2Ang) * size, cy + Math.sin(wing2Ang) * size)
  }
  bg.strokePath()

  bg.lineStyle(1, map.bgLine)
  bg.beginPath()
  for (let i = 0; i < 80; i++) {
    const cx = Math.abs(Math.sin(i * 19.3 + 11)) * WORLD
    const cy = Math.abs(Math.sin(i * 67.7 + 13)) * WORLD
    const angle = Math.sin(i * 17.3) * Math.PI * 2
    const len = 60 + Math.abs(Math.sin(i * 31.3)) * 60
    bg.moveTo(cx, cy)
    bg.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len)
  }
  bg.strokePath()
}
