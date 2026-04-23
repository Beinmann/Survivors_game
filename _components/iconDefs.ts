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
  {
    key: 'wico_scythes', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.lineStyle(2, 0x94a3b8)
      g.beginPath()
      g.arc(cx, cy, 10, -Math.PI / 2, Math.PI / 2)
      g.strokePath()
      g.lineStyle(1, 0xe2e8f0)
      g.beginPath()
      g.arc(cx, cy, 8, -Math.PI / 2, Math.PI / 2)
      g.strokePath()
      g.fillStyle(0x475569).fillRect(cx - 10, cy - 1, 10, 2)
    },
  },
  {
    key: 'wico_tesla', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.lineStyle(2.5, 0xbfdbfe)
      g.beginPath()
      g.moveTo(cx - 6, cy + 8)
      g.lineTo(cx + 4, cy)
      g.lineTo(cx - 4, cy)
      g.lineTo(cx + 6, cy - 8)
      g.strokePath()
    },
  },
  {
    key: 'wico_boomerang', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.lineStyle(2, 0xf87171)
      g.beginPath()
      g.moveTo(cx - 8, cy - 8)
      g.lineTo(cx + 6, cy)
      g.lineTo(cx - 8, cy + 8)
      g.strokePath()
    },
  },
  {
    key: 'wico_rocket', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.fillStyle(0x475569).fillRect(cx - 8, cy - 4, 16, 8)
      g.fillStyle(0xef4444).fillRect(cx - 11, cy - 3, 4, 6)
      g.fillStyle(0xef4444).fillTriangle(cx + 8, cy - 4, cx + 8, cy + 4, cx + 13, cy)
    },
  },
  {
    key: 'wico_trail', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.fillStyle(0xf97316, 0.8).fillCircle(cx, cy, 10)
      g.fillStyle(0xfacc15, 0.6).fillCircle(cx, cy, 6)
      g.lineStyle(1.5, 0xfb923c)
      g.strokeCircle(cx, cy, 12)
    },
  },
  {
    key: 'wico_laser', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.fillStyle(0xfde047).fillRect(cx - 3, cy - 3, 6, 6)
      g.lineStyle(3, 0xfde047, 0.9)
      g.lineBetween(cx + 3, cy, cx + 13, cy)
      g.lineStyle(1.5, 0xffffff, 1)
      g.lineBetween(cx + 3, cy, cx + 13, cy)
      g.fillStyle(0xffffff, 0.7).fillCircle(cx + 13, cy, 2)
    },
  },
  {
    key: 'wico_turret', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.fillStyle(0x1f2937).fillCircle(cx, cy, 9)
      g.lineStyle(2, 0xfbbf24).strokeCircle(cx, cy, 9)
      g.fillStyle(0xfbbf24).fillRect(cx, cy - 2, 12, 4)
      g.fillStyle(0xf59e0b).fillCircle(cx, cy, 3)
    },
  },
  {
    key: 'wico_orbital', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.lineStyle(2, 0xef4444).strokeCircle(cx, cy, 9)
      g.lineStyle(1.5, 0xfca5a5).strokeCircle(cx, cy, 5)
      g.lineStyle(1.5, 0xef4444)
      g.lineBetween(cx - 13, cy, cx - 9, cy)
      g.lineBetween(cx + 9, cy, cx + 13, cy)
      g.lineBetween(cx, cy - 13, cx, cy - 9)
      g.lineBetween(cx, cy + 9, cx, cy + 13)
      g.fillStyle(0xef4444).fillCircle(cx, cy, 1.5)
    },
  },
  {
    key: 'wico_blackhole', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.fillStyle(0x000000).fillCircle(cx, cy, 8)
      g.lineStyle(2, 0xa78bfa).strokeCircle(cx, cy, 11)
      g.lineStyle(1, 0xc4b5fd, 0.65).strokeCircle(cx, cy, 7)
      g.fillStyle(0xa78bfa, 0.65).fillCircle(cx, cy, 3)
    },
  },
  {
    key: 'wico_grenade', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.fillStyle(0x4b5563).fillCircle(cx, cy + 1, 9)
      g.lineStyle(1.5, 0x9ca3af).strokeCircle(cx, cy + 1, 9)
      g.fillStyle(0xfbbf24).fillRect(cx - 2, cy - 9, 4, 5)
      g.fillStyle(0xef4444).fillCircle(cx, cy - 9, 2)
      g.lineStyle(1, 0x1f2937).lineBetween(cx - 5, cy - 2, cx + 5, cy + 4)
    },
  },
  {
    key: 'wico_cryo', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.fillStyle(0x22d3ee)
      g.fillTriangle(cx, cy - 10, cx + 5, cy, cx, cy + 10)
      g.fillTriangle(cx, cy - 10, cx - 5, cy, cx, cy + 10)
      g.fillTriangle(cx - 10, cy, cx, cy - 5, cx + 10, cy)
      g.fillTriangle(cx - 10, cy, cx, cy + 5, cx + 10, cy)
      g.lineStyle(1, 0xa5f3fc, 0.8).strokeCircle(cx, cy, 2)
    },
  },
  {
    key: 'wico_railgun', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.fillStyle(0x1e3a8a).fillRect(cx - 10, cy - 2, 14, 4)
      g.lineStyle(1, 0x60a5fa).strokeRect(cx - 10, cy - 2, 14, 4)
      g.fillStyle(0x93c5fd).fillRect(cx + 4, cy - 1, 8, 2)
      g.lineStyle(1.5, 0xfde68a, 0.85)
      g.lineBetween(cx + 12, cy, cx + 14, cy)
      g.fillStyle(0xfbbf24).fillCircle(cx - 8, cy, 2)
    },
  },
  {
    key: 'wico_drones', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2
        const x = cx + Math.cos(a) * 8
        const y = cy + Math.sin(a) * 8
        g.fillStyle(0xd1d5db).fillRect(x - 3, y - 1, 6, 3)
        g.fillStyle(0x6b7280).fillRect(x - 1, y - 2, 2, 5)
      }
    },
  },
  {
    key: 'ico_projectiles', w: 24, h: 24,
    draw: (g: G) => {
      g.fillStyle(0xfbbf24)
      g.fillCircle(6, 12, 2)
      g.fillCircle(12, 12, 2)
      g.fillCircle(18, 12, 2)
      g.lineStyle(1.5, 0xfde68a)
      g.lineBetween(2, 12, 4, 12)
      g.lineBetween(8, 12, 10, 12)
      g.lineBetween(14, 12, 16, 12)
      g.lineBetween(20, 12, 22, 12)
    },
  },
  {
    key: 'ico_slow', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2, 0x22d3ee).strokeCircle(12, 12, 9)
      g.lineBetween(12, 12, 12, 6)
      g.lineBetween(12, 12, 16, 14)
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2
        g.fillStyle(0xa5f3fc).fillCircle(12 + Math.cos(a) * 11, 12 + Math.sin(a) * 11, 1.2)
      }
    },
  },
  {
    key: 'ico_charge', w: 24, h: 24,
    draw: (g: G) => {
      g.fillStyle(0x60a5fa)
      g.fillTriangle(10, 2, 18, 12, 12, 12)
      g.fillTriangle(12, 12, 6, 22, 14, 12)
    },
  },
  {
    key: 'ico_regen', w: 24, h: 24,
    draw: (g: G) => {
      g.fillStyle(0x4ade80)
      g.fillCircle(8, 9, 5)
      g.fillCircle(16, 9, 5)
      g.fillTriangle(3, 11, 21, 11, 12, 22)
      g.lineStyle(1.5, 0x86efac)
      g.beginPath()
      g.arc(19, 4, 4, Math.PI * 0.3, Math.PI * 1.9, false)
      g.strokePath()
    },
  },

  // ── power-up icons ──────────────────────────────────────────────────────
  {
    key: 'pu_vacuum', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.lineStyle(3, 0xa78bfa)
      g.beginPath()
      g.arc(cx, cy - 3, 7, Math.PI, 0, false)
      g.strokePath()
      g.lineBetween(cx - 7, cy - 3, cx - 7, cy + 4)
      g.lineBetween(cx + 7, cy - 3, cx + 7, cy + 4)
      g.lineStyle(3, 0xef4444)
      g.lineBetween(cx - 7, cy + 4, cx - 3, cy + 4)
      g.lineStyle(3, 0x60a5fa)
      g.lineBetween(cx + 3, cy + 4, cx + 7, cy + 4)
    },
  },
  {
    key: 'pu_frenzy', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.fillStyle(0xf97316)
      g.fillPoints([
        { x: cx,       y: cy - 10 },
        { x: cx + 4.5, y: cy - 5.2 },
        { x: cx + 6,   y: cy },
        { x: cx + 4.5, y: cy + 5.2 },
        { x: cx,       y: cy + 10 },
        { x: cx - 4.5, y: cy + 5.2 },
        { x: cx - 6,   y: cy },
        { x: cx - 4.5, y: cy - 5.2 },
      ], true)
      g.fillStyle(0xfacc15).fillCircle(cx, cy + 2, 4)
    },
  },
  {
    key: 'pu_nuke', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.fillStyle(0xef4444).fillCircle(cx, cy - 2, 8)
      g.fillStyle(0xef4444).fillRect(cx - 6, cy + 2, 12, 6)
      g.fillStyle(0x000000)
      g.fillCircle(cx - 3, cy - 3, 2)
      g.fillCircle(cx + 3, cy - 3, 2)
      g.fillRect(cx - 2, cy + 3, 4, 2)
    },
  },
  {
    key: 'pu_freeze', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.lineStyle(2, 0x22d3ee)
      g.strokeCircle(cx, cy, 9)
      g.lineBetween(cx, cy, cx, cy - 6)
      g.lineBetween(cx, cy, cx + 4, cy + 2)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        g.lineBetween(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9, cx + Math.cos(a) * 12, cy + Math.sin(a) * 12)
      }
    },
  },
  {
    key: 'pu_heal', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.fillStyle(0x4ade80)
      g.fillCircle(cx - 5, cy - 4, 6)
      g.fillCircle(cx + 5, cy - 4, 6)
      g.fillTriangle(cx - 11, cy - 2, cx + 11, cy - 2, cx, cy + 10)
      g.fillStyle(0xffffff).fillRect(cx - 1, cy - 4, 2, 6)
      g.fillStyle(0xffffff).fillRect(cx - 3, cy - 2, 6, 2)
    },
  },
  {
    key: 'pu_orbs', w: 28, h: 28,
    draw: (g: G) => {
      const cx = 14, cy = 14
      g.fillStyle(0xfbbf24).fillCircle(cx, cy, 5)
      g.fillStyle(0xa78bfa).fillCircle(cx - 7, cy + 6, 3)
      g.fillStyle(0x22d3ee).fillCircle(cx + 7, cy + 6, 3)
      g.fillStyle(0xef4444).fillCircle(cx - 6, cy - 7, 3)
      g.fillStyle(0x4ade80).fillCircle(cx + 6, cy - 7, 3)
    },
  },

  // ── unique upgrade mechanics ──────────────────────────────────────────
  {
    key: 'ico_lifesteal', w: 24, h: 24,
    draw: (g: G) => {
      g.fillStyle(0xef4444)
      g.fillCircle(8, 8, 4)
      g.fillCircle(16, 8, 4)
      g.fillTriangle(4, 9, 20, 9, 12, 18)
      g.lineStyle(2, 0x94a3b8)
      g.lineBetween(4, 4, 20, 20)
    },
  },
  {
    key: 'ico_stun', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2, 0xfacc15)
      for (let i = 0; i < 3; i++) {
        const r = 5 + i * 3
        g.beginPath()
        g.arc(12, 12, r, i, i + 1)
        g.strokePath()
      }
      g.fillStyle(0xfacc15).fillCircle(12, 12, 2)
    },
  },
  {
    key: 'ico_burn', w: 24, h: 24,
    draw: (g: G) => {
      g.fillStyle(0xf97316)
      g.fillPoints([
        { x: 12, y: 2 },
        { x: 15, y: 7 },
        { x: 16, y: 12 },
        { x: 15, y: 17 },
        { x: 12, y: 22 },
        { x: 9,  y: 17 },
        { x: 8,  y: 12 },
        { x: 9,  y: 7 },
      ], true)
      g.fillStyle(0xef4444).fillCircle(12, 15, 3)
    },
  },
  {
    key: 'ico_split', w: 24, h: 24,
    draw: (g: G) => {
      const cx = 12, cy = 12
      g.fillStyle(0x64748b).fillCircle(cx, cy, 4)
      g.lineStyle(1.5, 0x94a3b8)
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2
        g.lineBetween(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, cx + Math.cos(a) * 11, cy + Math.sin(a) * 11)
        g.fillStyle(0xef4444).fillCircle(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11, 2)
      }
    },
  },
  {
    key: 'ico_spark', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2, 0xfacc15)
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2
        g.lineBetween(12, 12, 12 + Math.cos(a) * 9, 12 + Math.sin(a) * 9)
      }
      g.fillStyle(0xffffff).fillCircle(12, 12, 2)
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
  {
    key: 'ico_area', w: 24, h: 24,
    draw: (g: G) => {
      const cx = 12, cy = 12
      g.lineStyle(2, 0x34d399)
      g.strokeCircle(cx, cy, 10)
      g.lineStyle(1.5, 0x34d399, 0.55)
      g.strokeCircle(cx, cy, 6)
      g.lineStyle(1, 0x34d399, 0.25)
      g.strokeCircle(cx, cy, 2.5)
      g.fillStyle(0x34d399).fillCircle(cx, cy, 1.5)
    },
  },

  // ── enemy icons ──────────────────────────────────────────────────────────
  {
    key: 'eico_grunt', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2, 0xef4444)
      g.strokeRect(6, 6, 12, 12)
      g.fillStyle(0xef4444).fillRect(9, 9, 6, 6)
    },
  },
  {
    key: 'eico_brute', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2, 0xf97316)
      g.strokeRoundedRect(2, 15, 20, 5, 1)
      g.fillStyle(0xf97316)
      g.fillCircle(5, 19, 1.2); g.fillCircle(9, 19, 1.2); g.fillCircle(13, 19, 1.2); g.fillCircle(17, 19, 1.2)
      g.strokeRect(4, 9, 16, 6)
      g.strokeRect(9, 5, 7, 4)
      g.lineBetween(15, 7, 22, 7)
    },
  },
  {
    key: 'eico_speeder', w: 24, h: 24,
    draw: (g: G) => {
      g.fillStyle(0xa3e635)
      g.fillTriangle(4, 6, 4, 18, 20, 12)
      g.lineStyle(1, 0xd9f99d)
      g.strokeTriangle(4, 6, 4, 18, 20, 12)
    },
  },
  {
    key: 'eico_tank', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(3, 0x7c3aed)
      g.strokeRect(4, 4, 16, 16)
      g.fillStyle(0x7c3aed).fillRect(8, 8, 8, 8)
    },
  },
  {
    key: 'eico_elite', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2, 0xfbbf24)
      g.strokeCircle(12, 12, 8)
      g.fillStyle(0xfbbf24).fillCircle(12, 12, 3)
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2
        g.fillCircle(12 + Math.cos(a) * 8, 12 + Math.sin(a) * 8, 2)
      }
    },
  },
  {
    key: 'eico_charger', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2, 0xff4500)
      g.beginPath()
      g.moveTo(8, 4)
      g.lineTo(20, 12)
      g.lineTo(8, 20)
      g.strokePath()
      g.lineBetween(16, 8, 20, 4)
      g.lineBetween(16, 16, 20, 20)
    },
  },
  {
    key: 'eico_ghost', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2, 0xe0e0ff)
      g.beginPath()
      g.arc(14, 12, 7, -Math.PI / 2, Math.PI / 2, false)
      g.lineTo(4, 19)
      g.lineTo(7, 15)
      g.lineTo(4, 12)
      g.lineTo(7, 9)
      g.lineTo(4, 5)
      g.closePath()
      g.strokePath()
    },
  },
  {
    key: 'eico_bomber', w: 24, h: 24,
    draw: (g: G) => {
      g.fillStyle(0xcc2200)
      g.fillCircle(11, 12, 8)
      g.fillRect(17, 10, 4, 4)
      g.lineStyle(1.5, 0xff6644)
      g.lineBetween(21, 12, 23, 8)
    },
  },
  {
    key: 'eico_swarm', w: 24, h: 24,
    draw: (g: G) => {
      g.fillStyle(0xec4899)
      g.fillCircle(8, 8, 3)
      g.fillCircle(16, 8, 3)
      g.fillCircle(12, 16, 3)
      g.fillCircle(8, 14, 2)
      g.fillCircle(16, 14, 2)
    },
  },
  {
    key: 'eico_boss', w: 24, h: 24,
    draw: (g: G) => {
      g.lineStyle(2, 0xff0000)
      g.strokeRoundedRect(5, 5, 13, 14, 3)
      g.beginPath()
      g.moveTo(5, 5)
      g.lineTo(1, 5)
      g.lineTo(5, 8)
      g.lineTo(1, 12)
      g.lineTo(5, 16)
      g.lineTo(1, 19)
      g.lineTo(5, 19)
      g.strokePath()
      g.fillStyle(0xff0000)
      g.fillCircle(14, 9, 2)
      g.fillCircle(14, 15, 2)
      g.lineBetween(18, 10, 18, 14)
      g.lineBetween(18, 10, 16, 10)
      g.lineBetween(18, 12, 16, 12)
      g.lineBetween(18, 14, 16, 14)
    },
  },
]
