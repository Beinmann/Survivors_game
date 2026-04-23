import { WORLD } from './_constants'

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
    enemyWeights: {},
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
      enemy_charger: 0.2,
      enemy_elite: 0,
      enemy_tank: 0,
    },
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
      enemy_charger: 1.5,
      enemy_grunt: 0.4,
      enemy_speeder: 0.2,
      enemy_ghost: 0,
      enemy_swarm: 0,
    },
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
      enemy_charger: 2.5,
      enemy_elite: 2.0,
      enemy_swarm: 1.5,
      enemy_grunt: 0.3,
      enemy_tank: 0,
      enemy_bomber: 0,
      enemy_brute: 0,
    },
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
  const blockW = 240
  const blockH = 120
  const rows = Math.ceil(WORLD / blockH) + 1
  const cols = Math.ceil(WORLD / blockW) + 2

  bg.fillStyle(map.bgDark)
  for (let row = 0; row < rows; row++) {
    const xOff = (row % 2) * (blockW / 2)
    for (let col = 0; col < cols; col++) {
      if (Math.abs(Math.sin(col * 73.1 + row * 131.7)) < 0.28) {
        bg.fillRect(col * blockW - xOff, row * blockH, blockW, blockH)
      }
    }
  }

  bg.lineStyle(2, map.bgLine)
  bg.beginPath()
  for (let row = 0; row <= rows; row++) {
    bg.moveTo(0, row * blockH); bg.lineTo(WORLD, row * blockH)
  }
  bg.strokePath()

  bg.beginPath()
  for (let row = 0; row < rows; row++) {
    const xOff = (row % 2) * (blockW / 2)
    for (let col = 0; col <= cols; col++) {
      const x = col * blockW - xOff
      bg.moveTo(x, row * blockH); bg.lineTo(x, (row + 1) * blockH)
    }
  }
  bg.strokePath()

  bg.fillStyle(map.accent, 0.5)
  for (let row = 0; row < rows; row++) {
    const xOff = (row % 2) * (blockW / 2)
    for (let col = 0; col < cols; col++) {
      if (Math.abs(Math.sin(col * 29.1 + row * 79.7)) < 0.22) {
        const x = col * blockW - xOff
        const y = row * blockH
        bg.fillRect(x + 6, y + 6, 4, 4)
        bg.fillRect(x + blockW - 10, y + 6, 4, 4)
        bg.fillRect(x + 6, y + blockH - 10, 4, 4)
        bg.fillRect(x + blockW - 10, y + blockH - 10, 4, 4)
      }
    }
  }
}

function drawCircuit(bg: any, map: MapDef): void {
  bg.lineStyle(1, map.bgLine)
  bg.beginPath()
  for (let y = 0; y <= WORLD; y += 24) {
    bg.moveTo(0, y); bg.lineTo(WORLD, y)
  }
  bg.strokePath()

  bg.lineStyle(2, map.accent, 0.3)
  bg.beginPath()
  for (let i = 0; i < 700; i++) {
    const y = Math.abs(Math.sin(i * 31.7)) * WORLD
    const x = Math.abs(Math.sin(i * 73.1 + 5)) * WORLD
    const len = 80 + Math.abs(Math.sin(i * 11.3)) * 180
    bg.moveTo(x, y); bg.lineTo(x + len, y)
  }
  bg.strokePath()

  bg.lineStyle(3, map.accent, 0.55)
  bg.beginPath()
  for (let i = 0; i < 320; i++) {
    const x = Math.abs(Math.sin(i * 73.1 + 11)) * WORLD
    const y = Math.abs(Math.sin(i * 131.7 + 3)) * WORLD
    bg.moveTo(x, y - 11); bg.lineTo(x + 16, y); bg.lineTo(x, y + 11)
  }
  bg.strokePath()
}

function drawWetland(bg: any, map: MapDef): void {
  bg.fillStyle(map.bgDark)
  for (let i = 0; i < 280; i++) {
    const x = Math.abs(Math.sin(i * 73.1)) * WORLD
    const y = Math.abs(Math.sin(i * 131.7 + 1)) * WORLD
    const w = 80 + Math.abs(Math.sin(i * 57.3)) * 200
    const h = 40 + Math.abs(Math.sin(i * 97.1 + 3)) * 110
    bg.fillEllipse(x, y, w, h)
  }

  bg.fillStyle(map.bgLine)
  for (let i = 0; i < 180; i++) {
    const x = Math.abs(Math.sin(i * 41.3 + 7)) * WORLD
    const y = Math.abs(Math.sin(i * 89.7 + 2)) * WORLD
    const r = 14 + Math.abs(Math.sin(i * 61.1)) * 42
    bg.fillCircle(x, y, r)
  }

  bg.fillStyle(map.accent, 0.5)
  for (let i = 0; i < 160; i++) {
    const x = Math.abs(Math.sin(i * 23.7 + 4)) * WORLD
    const y = Math.abs(Math.sin(i * 53.1 + 9)) * WORLD
    const r = 3 + Math.abs(Math.sin(i * 17.3)) * 6
    bg.fillCircle(x, y, r)
  }

  bg.lineStyle(1, map.accent, 0.35)
  for (let i = 0; i < 180; i++) {
    const x = Math.abs(Math.sin(i * 91.3 + 13)) * WORLD
    const y = Math.abs(Math.sin(i * 43.7 + 7)) * WORLD
    const r = 4 + Math.abs(Math.sin(i * 31.1)) * 6
    bg.strokeCircle(x, y, r)
  }
}
