# Survivors — 2D Browser Game

2026.04.19

Phaser 3 top-down survivor. Pick a starting weapon, kill enemies, collect XP orbs, level up, unlock more weapons, survive as long as possible.

**Route:** `/projects/survivors_game`  
**Source:** `src/app/projects/survivors_game/_components/Game.tsx`

---

## Controls

| Input | Action |
|-------|--------|
| WASD / Arrow keys | Move |
| Space | Start game (title screen) |
| ESC | Pause / resume |
| L | Force level-up *(debug)* |

Movement is normalized on diagonals (×0.707). Auto-shooting targets the nearest enemy.

---

## Weapons

Pick one starting weapon; up to two more can be unlocked through the level-up menu (max 3 active weapons). Each weapon has an 8-step upgrade path (levels 2–9).

| Weapon | Base stats | Upgrade path focus |
|--------|-----------|-------------------|
| **Shotgun** | 6 pellets · 550ms cooldown · 220px range | More pellets, damage, range, rear shot |
| **Sniper Rifle** | 2 pierce · 1400ms cooldown · 680px/s bullets | Pierce, damage multipliers, bullet speed, rear shot |
| **Shock Aura** | 110px radius · 500ms pulse · omnidirectional | Radius, damage, cooldown |
| **Machine Gun** | 1 bullet · 100ms cooldown · 520px/s bullets | Damage, pierce, 2–3 round burst, rear shot |

---

## Enemy types

Enemies spawn in waves off-screen (550–800px from the player). New types unlock as the run progresses. Enemies beyond 2000px from the player despawn silently (no orbs, no score).

| Enemy | Color | HP | Speed | Unlock | Weight | Orb bonus | Special |
|-------|-------|----|-------|--------|--------|-----------|---------|
| Grunt | Red | 30 | 70 | 0s | 1.0 | 0 | — |
| Brute | Orange | 110 | 52 | 30s | 0.3 | +4 | Rare, high orb yield |
| Speeder | Cyan | 28 | 140 | 60s | 1.0 | 0 | Fast |
| Charger | Orange-red | 80 | 55 | 75s | 0.7 | +1 | Telegraphs then dashes at 380px/s |
| Ghost | White | 45 | 110 | 90s | 0.9 | 0 | Semi-transparent, passes through obstacles |
| Tank | Purple | 300 | 36 | 100s | 0.5 | +2 | High HP |
| Bomber | Dark red | 90 | 38 | 130s | 0.4 | +2 | Explodes on death (80px radius) |
| Elite | Yellow | 170 | 108 | 150s | 0.8 | +1 | Fast and tanky |
| Swarm | Pink | 15 | 160 | 180s | 0.8 | 0 | Spawns 5 at once per wave slot |
| Boss | Red | 1500 | 47 | every 180s | — | +18 | Spawned separately; see Boss Waves |

Weight controls selection probability within the available pool. Lower weight = rarer.

### Charger behaviour

Charger cycles through three states: **idle** (drifts slowly toward player) → **telegraph** (stops and turns orange, 600ms) → **charging** (fixed-angle dash at 380px/s, 900ms) → idle again (2.5–4.5s gap).

### Boss Waves

Every 180 seconds a "⚠ BOSS INCOMING" warning appears, then a single Boss enemy spawns 620px from the player. Bosses are not part of the normal spawn pool — they arrive on top of regular waves.

---

## Difficulty scaling

Difficulty is time-based:

- **Global speed multiplier** = `1 + (gameTimeSecs / 300)` — all enemy movement speeds are multiplied each frame
- **Wave size** = `2 + floor(gameTimeSecs / 25) + floor(gameTimeSecs / 120)`
- **Spawn interval** starts at 2500ms, decreases by 30ms per wave, floors at 600ms
- **Contact damage** = `10 + floor(gameTimeSecs / 60) × 4` (scales every minute)
- **Spawn pressure** multiplier adjusts the interval based on current enemy count:

| Enemies on field | Multiplier | Effect |
|-----------------|-----------|--------|
| ≤ 4 | 0.1 | 10× faster |
| ≤ 12 | 0.3 | ~3× faster |
| ≤ 25 | 0.6 | ~1.7× faster |
| ≤ 45 | 1.0 | base |
| 46+ | 2.5 | 2.5× slower |

---

## Progression

- Kill enemies → XP orbs drop at kill location
- Walk near orbs (magnet radius) to pull them in, or collect XP Vacuum power-up
- XP fills the bar; on level-up, physics pauses and the upgrade menu appears
- XP needed per level scales ×1.25 each level
- **Level-up menu** shows 3 choices: passive upgrades, the next weapon upgrade (3× weight), or a weapon unlock option (2× weight, available until 3 weapons are active)

**Passive upgrades:**

| Name | Effect |
|------|--------|
| Swift Feet | +25% move speed |
| XP Magnet | +80px magnet radius |
| Bounty Hunter | +35% XP per orb collected |
| Vital Surge | +20 max HP, restore 40 HP |
| Power Core | +20% damage to all active weapons |
| Overclock | −15% cooldown on all active weapons |

---

## Orb consolidation

When 24+ XP orbs are within 400px of the player (crowded), new orbs from kills spawn as a single consolidated orb at the screen edge (260–420px from the player) rather than dropping at the kill site. The consolidated orb's `xpValue` equals the full drop count (1 + orbBonus). It turns red and scales up to reflect its stacked value. A hard cap of 180 active orbs is enforced globally.

---

## Power-ups

Power-ups spawn 15–45s after run start, then every 10–50s, at 350–700px from the player. They float with a pulse animation and show a label. Six types:

| Key | Name | Effect |
|-----|------|--------|
| `pu_vacuum` | XP Vacuum | Pulls all active orbs toward the player at 520px/s |
| `pu_frenzy` | Frenzy | 2× fire rate for 15 seconds |
| `pu_nuke` | Nuke | Kills all enemies visible on screen |
| `pu_freeze` | Time Freeze | Freezes all enemies for 5 seconds |
| `pu_heal` | Full Heal | Restores HP to max |
| `pu_orbs` | Orb Shower | Spawns 25 XP orbs in a ring around the player |

---

## Obstacles

The 12000×12000px world contains three obstacle types, all generated procedurally:

| Key | Shape | Count | Notes |
|-----|-------|-------|-------|
| `obs_pillar` | 48×48 square | 260 | Blocks everything |
| `obs_hwall` | 160×40 horizontal wall | 130 | Blocks everything |
| `obs_vwall` | 40×160 vertical wall | 130 | Blocks everything |

Obstacles spawn at least 700px from the world center (player start). Ghosts ignore obstacle collisions.

---

## Code architecture

All game logic lives in a single file: `_components/Game.tsx` (~1400 lines).

**Why one file:** Phaser must be dynamically imported (browser-only ESM). `GameScene` extends `Phaser.Scene`, so it must be defined inside the `async init()` closure. This prevents `import GameScene from './GameScene'` without a factory-function refactor.

### Key methods

| Method | What it does |
|--------|-------------|
| `create()` | Resets state, builds textures, creates physics groups, registers colliders, spawns obstacles, shows title screen |
| `resetState()` | Canonical initial values for all fields |
| `update(time, delta)` | Main loop: timer, global speed mult, boss check, movement, shooting, enemy movement, orb pulling, power-up tick, bullet cleanup, UI draw |
| `buildTextures()` | Generates all textures procedurally — player, 10 enemy types, 6 power-up types, 3 obstacle types, 3 bullet types, orb |
| `spawnWave()` | Weighted-random enemy spawn; Swarm type spawns 5-at-once |
| `spawnBossWave()` | Warning flash + delayed Boss spawn every 180s |
| `killEnemy()` | Drops orbs or consolidated orb; triggers bomber explosion |
| `getWeaponUpgrades()` | Returns next upgrade step for each active weapon |
| `getUpgrades()` | Builds the 3-card menu pool (passives + weapon upgrades 3× + unlocks 2×) |
| `showWeaponSelection()` | Initial weapon pick screen |
| `showUpgradeMenu()` | Pauses physics, renders interactive upgrade cards with stats panel |
| `applyPowerUp()` | Switch on power-up key string; handles all 6 effects |
| `addStatsPanel()` | Renders the stats overlay (shown during pause and level-up) |

### Key constants

| Constant | Default | Controls |
|----------|---------|---------|
| `WORLD` | 12000 | World size in pixels (square) |
| `SPAWN_INTERVAL_MS` | 2500 | Initial enemy spawn interval |
| `MAX_ORBS` | 180 | Hard cap on active XP orb physics objects |
| `DESPAWN_DIST` | 2000 | Distance at which enemies silently despawn |
| `CONSOLIDATE_NEARBY_RADIUS` | 400 | Radius for "crowded" orb check |
| `CONSOLIDATE_THRESHOLD` | 24 | Nearby orb count that triggers consolidation |
| `CONSOLIDATE_EDGE_MIN/MAX` | 260 / 420 | Target distance band for consolidated orb |
