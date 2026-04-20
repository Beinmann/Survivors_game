// eslint-disable-next-line @typescript-eslint/no-explicit-any
type G = any

export const ICON_DEFS: { key: string; w: number; h: number; draw: (g: G) => void }[] = [
  // ── weapon icon textures (for upgrade cards) ───────────────────────────
  {
    key: 'wico_shotgun', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.lineStyle(1.5, 0xf97316)
      const spread = Math.PI / 3
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 - spread / 2 + (i / 4) * spread
        g.lineBetween(cx, cy + 6, cx + Math.cos(a) * 14, cy + Math.sin(a) * 14 + 6)
      }
      g.fillStyle(0xf97316).fillRect(cx - 2, cy + 1, 4, 6)
    },
  },
  {
    key: 'wico_sniper', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.lineStyle(1.5, 0x60a5fa)
      g.strokeCircle(cx, cy, 10)
      g.lineBetween(cx - 14, cy, cx - 11, cy)
      g.lineBetween(cx + 11, cy, cx + 14, cy)
      g.lineBetween(cx, cy - 14, cx, cy - 11)
      g.lineBetween(cx, cy + 11, cx, cy + 14)
      g.fillStyle(0x60a5fa).fillCircle(cx, cy, 2)
    },
  },
  {
    key: 'wico_aura', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.lineStyle(1.5, 0xa78bfa)
      g.strokeCircle(cx, cy, 9)
      g.lineStyle(1, 0xa78bfa, 0.45)
      g.strokeCircle(cx, cy, 13)
      g.fillStyle(0xa78bfa).fillCircle(cx, cy, 2)
    },
  },
  {
    key: 'wico_machinegun', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.fillStyle(0x4ade80).fillRect(cx - 3, cy - 10, 6, 18)
      g.fillStyle(0x1e5c30).fillRect(cx - 5, cy - 1, 10, 4)
      g.lineStyle(1, 0x4ade80)
      for (let i = 0; i < 3; i++) g.lineBetween(cx - 8, cy - 8 + i * 5, cx - 5, cy - 8 + i * 5)
    },
  },

  // ── effect icons (upgrade cards + stats panel) ─────────────────────────
  {
    key: 'ico_damage', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2, 0xfbbf24)
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        g.lineBetween(12, 12, 12 + Math.cos(a) * 9, 12 + Math.sin(a) * 9)
      }
      g.fillStyle(0xfbbf24).fillCircle(12, 12, 3)
    },
  },
  {
    key: 'ico_pellets', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2, 0xf97316)
      const spread = Math.PI / 2.5
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 - spread / 2 + (i / 4) * spread
        g.lineBetween(12, 19, 12 + Math.cos(a) * 12, 12 + Math.sin(a) * 12 + 7)
      }
    },
  },
  {
    key: 'ico_range', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2, 0xf97316)
      g.lineBetween(3, 12, 20, 12)
      g.lineBetween(15, 7, 20, 12)
      g.lineBetween(15, 17, 20, 12)
      g.lineStyle(1, 0xf97316, 0.6)
      g.lineBetween(8, 9, 8, 15)
      g.lineBetween(13, 9, 13, 15)
    },
  },
  {
    key: 'ico_cooldown', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2, 0x60a5fa)
      g.strokeCircle(12, 12, 9)
      g.lineBetween(12, 12, 12, 5)
      g.lineBetween(12, 12, 17, 15)
    },
  },
  {
    key: 'ico_pierce', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(1.5, 0x60a5fa)
      g.strokeCircle(12, 12, 6)
      g.lineStyle(2, 0x93c5fd)
      g.lineBetween(2, 12, 22, 12)
      g.lineBetween(17, 8, 22, 12)
      g.lineBetween(17, 16, 22, 12)
    },
  },
  {
    key: 'ico_bulletspeed', w: 24, h: 24,
    draw: (g: G) => {
      g.fillStyle(0x60a5fa)
      g.fillTriangle(21, 12, 13, 8, 13, 16)
      g.fillRect(5, 10, 9, 4)
      g.lineStyle(1, 0x93c5fd, 0.7)
      g.lineBetween(1, 8, 6, 8)
      g.lineBetween(1, 12, 3, 12)
      g.lineBetween(1, 16, 6, 16)
    },
  },
  {
    key: 'ico_rearshot', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2, 0xa78bfa)
      g.lineBetween(12, 12, 21, 12)
      g.lineBetween(17, 8, 21, 12)
      g.lineBetween(17, 16, 21, 12)
      g.lineBetween(12, 12, 3, 12)
      g.lineBetween(7, 8, 3, 12)
      g.lineBetween(7, 16, 3, 12)
    },
  },
  {
    key: 'ico_radius', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(1.5, 0xa78bfa)
      for (let r = 4; r <= 10; r += 3) {
        g.beginPath()
        g.arc(12, 16, r, Math.PI, 0, false)
        g.strokePath()
      }
      g.fillStyle(0xa78bfa).fillCircle(12, 16, 2)
    },
  },
  {
    key: 'ico_burst', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2.5, 0x4ade80)
      g.lineBetween(5, 7, 19, 7)
      g.lineBetween(5, 12, 19, 12)
      g.lineBetween(5, 17, 19, 17)
    },
  },
  {
    key: 'ico_hp', w: 24, h: 24,
    draw: (g: G) => {
      g.fillStyle(0xef4444)
      g.fillCircle(8, 9, 5)
      g.fillCircle(16, 9, 5)
      g.fillTriangle(3, 11, 21, 11, 12, 22)
    },
  },
  {
    key: 'ico_movespeed', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(3, 0xfbbf24)
      g.lineBetween(14, 2, 8, 13)
      g.lineBetween(8, 13, 14, 13)
      g.lineBetween(14, 13, 8, 22)
    },
  },
  {
    key: 'ico_magnet', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(3, 0xa78bfa)
      g.beginPath()
      g.arc(12, 11, 7, Math.PI, 0, false)
      g.strokePath()
      g.lineBetween(5, 11, 5, 18)
      g.lineBetween(19, 11, 19, 18)
      g.lineStyle(3, 0xef4444)
      g.lineBetween(5, 18, 9, 18)
      g.lineStyle(3, 0x60a5fa)
      g.lineBetween(15, 18, 19, 18)
    },
  },
  {
    key: 'ico_orbmult', w: 24, h: 24,
    draw: (g: G) => {
      g.fillStyle(0xa78bfa)
      g.fillTriangle(12, 5, 19, 12, 12, 19)
      g.fillTriangle(12, 5, 5, 12, 12, 19)
      g.lineStyle(1, 0xc4b5fd)
      g.strokeTriangle(12, 5, 19, 12, 12, 19)
      g.strokeTriangle(12, 5, 5, 12, 12, 19)
      g.fillStyle(0xfde68a)
      g.fillCircle(4, 4, 1.5)
      g.fillCircle(20, 4, 1.5)
      g.fillCircle(4, 20, 1.5)
      g.fillCircle(20, 20, 1.5)
    },
  },
  {
    key: 'ico_level', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(3, 0xfbbf24)
      g.lineBetween(4, 17, 12, 7)
      g.lineBetween(20, 17, 12, 7)
    },
  },
]
