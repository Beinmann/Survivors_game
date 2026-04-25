# Survivors — 2D Browser Game

2026.04.19

Phaser 4 top-down survivor. Pick a starting weapon, kill enemies, collect XP orbs, level up, unlock more weapons, survive as long as possible.

**Route:** `/projects/survivors_game`  
**Source:** `src/app/projects/survivors_game/` (Modular structure)

---

## Controls

| Input | Action |
|-------|--------|
| WASD / Arrow keys | Move |
| Space | Start game (title screen) |
| ESC | Pause / resume |
| L | Force level-up *(debug)* |
| O | Skip +10s of game time *(debug)* |
| U | Open debug menu *(debug)* |

Movement is normalized on diagonals (×0.707). Auto-shooting targets the nearest enemy.

---

## Weapons

Pick one starting weapon; up to two more can be unlocked through the level-up menu (max 3 active weapons). Each weapon has an 8-step upgrade path (levels 2–9).

| Weapon | Base stats | Upgrade path focus |
|--------|-----------|-------------------|
| **Shotgun** | 6 pellets · 950ms cooldown · 220px range | More pellets, damage, range, rear shot |
| **Sniper Rifle** | 2 pierce · 1400ms cooldown · 680px/s bullets | Pierce, damage multipliers, bullet speed, rear shot |
| **Shock Aura** | 110px radius · 500ms pulse · omnidirectional | Radius, damage, cooldown |
| **Machine Gun** | 1 bullet · 200ms cooldown · 520px/s bullets | Damage, pierce, 2–3 round burst, rear shot |
| **Spectral Scythes** | 1 blade · 100px orbit · continuous | Blade count, radius, damage, lifesteal |
| **Tesla Chain** | 2 jumps · 1400ms cooldown · 85px jump range | Jumps, damage, stun, arc-back |
| **Ricochet Boomerang** | 1 projectile · 1000ms cooldown · 250px range | Range, count, pierce, speed |
| **Homing Rockets** | 1 rocket · 1500ms cooldown · 40px blast | Radius, burst count, damage, split |
| **Incendiary Trail** | 20px patch · 100ms tick · 3s duration | Duration, size, burn, explode on expiry |
| **Laser Beam** | Pierces 3 · 250ms pulse · 340px range | Pierce, range, beam width, damage |
| **Sentry Turret** | 8s duration · 400ms fire rate · 2 max | Duration, fire rate, max turrets, damage |
| **Orbital Strike** | 1 strike · 110px radius · 1s telegraph | Strike count, radius, cooldown, damage |
| **Black Hole** | 150px pull · 2.5s duration · tick damage | Radius, duration, pull strength, damage |
| **Cryo Shards** | 3 shards · 1.5s slow · 900ms cooldown | Shards, slow duration, damage |
| **Plasma Lance** | 1.5s charge · 900ms sustained beam · pierces all · ticks every 150ms | Charge time, beam width, damage |
| **Swarm Drones** | 1 drone · 8s target lock · homes onto a target and zooms past on contact; pass-through damages any enemy en route | Drone count, damage, respawn cooldown |
| **Crescent Cleave** | 80 dmg · 1800ms cooldown · 140° forward arc · 150px reach | Damage, radius, arc width, extra slashes |

---

## Weapon evolutions

Once a weapon reaches **level 9** and you hold the right **passive at a required level**, an **Evolution** card can appear in the level-up menu (purple/gold border). Picking it upgrades the weapon in place — the slot stays the same, but firing, damage, and the HUD icon all change.

| Base weapon | Evolution | Linked passive | Required level | What changes |
|---|---|---|---|---|
| Homing Rockets | Swarm Barrage | Power Core | 3 | 5-rocket salvo at 60ms stagger, +150% damage, −400ms cooldown, cluster always splits into 6 homing shards at 70% damage |
| Black Hole | Supermassive | Arcane Reach | 3 | Radius ×2, pull ×3, duration ×2, tick damage ×2 |
| Cryo Shards | Glacial Volley | Multishot | 2 | 8 shards per volley, ×2 slow duration, shards fracture into 2 child shards on hit |
| Spectral Scythes | Death Coil | Arcane Reach | 3 | Adds a counter-rotating outer ring at ×1.6 radius, +2 inner blades, life steal always on |
| Shotgun | Thunder Hail | Multishot | 2 | Wider cone (+30°), +40% range, each pellet chains a bolt to nearest enemy within 120px at 60% damage |
| Machine Gun | Flak Cannon | Power Core | 3 | Every bullet detonates in a 40px AoE, +80% damage, −30% fire rate |
| Laser Beam | Prism Array | Multishot | 2 | Fires 4 independent beams in a + pattern each pulse |
| Orbital Strike | Meteor Shower | Multishot | 2 | 5 strikes spread across 450px, telegraph shortened to 0.6s |
| Sentry Turret | Mortar Squad | Power Core | 3 | Turrets fire homing mortar shells with 40px AoE; ×3 damage, ×0.5 fire rate |
| Sniper | Crit Cascade | Arcane Reach | 3 | Shot ricochets up to 6 times between enemies within 240px at full damage (pierce replaced) |
| Shock Aura | Thunderdome | Arcane Reach | 3 | ×2 radius, ×2 pulse rate, each hit chains a bolt to nearest neighbor at +50% damage |
| Tesla Chain | Voltaic Lance | Power Core | 3 | 1s sustained beam player→target, ticks every 100ms on everything in the line |
| Ricochet Boomerang | Star Fan | Multishot | 2 | 5 piercing blades in a star; return paths seek nearest enemy instead of player |
| Plasma Lance | Starbreaker | Arcane Reach | 3 | During the 900ms sustain the beam sweeps 360° around the player (lighthouse) |
| Swarm Drones | Hornet Swarm | Multishot | 2 | +4 drones, ×2 attack rate, each attack fires a homing micro-rocket with small AoE |

Evolution cards have slightly higher pool weight than regular upgrades, so they are very likely but not guaranteed to show up right after eligibility. After evolving, no more level upgrades appear for that weapon.

---

## Enemy types

Enemies spawn in waves off-screen (550–800px from the player). New types unlock as the run progresses. Enemies beyond 2000px from the player despawn silently (no orbs, no score).

| Enemy | Color | HP | Speed | Unlock | Weight | Orb bonus | Maps | Special |
|-------|-------|----|-------|--------|--------|-----------|------|---------|
| Grunt | Red | 30 | 80 | 0s | 1.0 | 0 | all | — |
| Bomber | Dark red | 90 | 44 | 25s | 0.15 | +2 | all | Rare; explodes on death (80px radius), deals 150 dmg to nearby enemies |
| Brute | Orange | 110 | 60 | 30s | 0.3 | +4 | all | Rare, high orb yield |
| Speeder | Cyan | 28 | 160 | 60s | 1.0 | 0 | all | Fast |
| Charger | Orange-red | 80 | 63 | 75s | 0.7 | +1 | all | Telegraphs then dashes at 380px/s |
| Ghost | White | 45 | 126 | 90s | 0.9 | 0 | all | Semi-transparent, passes through obstacles |
| Tank | Purple | 300 | 42 | 100s | 0.5 | +2 | all | High HP |
| Elite | Yellow | 170 | 124 | 150s | 0.8 | +1 | all | Fast and tanky |
| Swarm | Pink | 15 | 184 | 180s | 0.8 | 0 | all | Spawns 5 at once per wave slot |
| Splitter | Teal | 120 | 70 | 140s | 0.35 | +3 | all | On death, spawns 3 Splitterlings (fast, 20 HP each) |
| Healer | Soft green | 60 | 55 | 180s | 0.35 | +2 | all | Pulses every 1.5s, heals all enemies within 140px by 12 HP |
| Plague | Sickly green | 55 | 70 | 60s | — | +1 | **swamp** | Drops a 65px poison puddle on death (4s, ticks 4 dmg/0.5s) |
| Nest | Mossy | 220 | 0 | 50s | — | +4 | **swamp** | Stationary; spawns 1 Grunt every 2s, max 3 children alive |
| Juggernaut | Dark grey | 650 | 35 | 110s | — | +6 | **fortress** | Massive HP; slams the player back on contact |
| Sapper | Brown/amber | 70 | 50 | 80s | — | +2 | **fortress** | Stops within 150px, telegraphs, detonates a 160px blast for 120 dmg to enemies |
| Berserker | Deep red | 110 | 75 → 150 | 100s | — | +2 | **fortress** | Under 30% HP, doubles speed and turns bright red |
| Lockdown | Indigo | 160 | 45 | 120s | — | +3 | **fortress** | 200px aura slows the player's move speed by 40% while inside |
| Hunter | Pink/magenta | 50 | 110 | 70s | — | +1 | **speedzone** | Orbits the player at ~140px instead of charging in |
| Dasher | Cyan | 60 | 60 | 90s | — | +1 | **speedzone** | Telegraphs then chains two dashes at 430px/s back-to-back |
| Blinker | Bright cyan | 45 | 90 | 90s | — | +1 | **speedzone** | Teleports ~140px toward the player every ~2s |
| Scavenger | Amber | 45 | 130 | 50s | — | 0 | **ruins** | Targets the nearest XP orb instead of the player; destroys orbs on reach |
| Ambusher | Stone grey | 55 | 120 | 70s | — | +1 | **ruins** | Spawns dormant (rubble); wakes up after 3s, when player gets within 120px, or when damaged |
| Boss | Red | 1500 | 54 | every 180s | — | +18 | all | Spawned separately; see Boss Waves |
| Mini-boss: Brute | Deep purple | 450 | 50 | 60s | — | +8 | all | Spawned separately; see Mini-Bosses. Drops a power-up on death |
| Mini-boss: Alpha | Hot magenta | 280 | 130 | 90s | — | +6 | all | Spawned separately; see Mini-Bosses. Drops a power-up on death |
| Mini-boss: Warden | Steel blue | 380 | 60 | 150s | — | +7 | all | Spawned separately; see Mini-Bosses. Knocks player back on contact; drops a power-up on death |

Weight controls selection probability within the available pool. Lower weight = rarer. Map-exclusive enemies have no base weight — they spawn only on the maps that explicitly opt them in.

### Charger behaviour

Charger cycles through three states: **idle** (drifts slowly toward player) → **telegraph** (stops and turns orange, 600ms) → **charging** (fixed-angle dash at 380px/s, 900ms) → idle again (2.5–4.5s gap).

### Boss Waves

Every 180 seconds a "⚠ BOSS INCOMING" warning appears, then a single Boss enemy spawns 620px from the player. Bosses are not part of the normal spawn pool — they arrive on top of regular waves.

### Mini-Bosses

Every 50–60 seconds a single mini-boss spawns 620px from the player — silently, with no warning text. They're visibly larger than regular enemies and drop a random power-up at their death location. Three types unlock at 60s, 90s, and 150s respectively. Mini-bosses are not part of the normal wave spawn pool.

---

## Difficulty scaling

Difficulty is time-based. Enemy movement speed is flat — only wave size, spawn rate, contact damage, and new enemy unlocks scale with time.

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

**Passive upgrades** *(snapshot — see `_components/_types.ts` `PASSIVE_DATA` for live values):*

| Name | Effect | Max |
|------|--------|-----|
| Swift Feet | Move 20% faster | 5 |
| Bounty Magnet | +35px pickup range and +15% XP per orb | 5 |
| Vital Surge | +25 max HP and +0.5 HP/s regen | 5 |
| Power Core | +15% damage for all active weapons | 5 |
| Overclock | All weapons fire 12% faster | 5 |
| Arcane Reach | +15% size to all weapons and shots | 5 |
| Multishot | +1 projectile per volley | 2 |

---

## Orb consolidation

Consolidation is vision-based. On-screen kills always drop individual orbs at the kill site (each `xpValue = 1`) so the player gets full kill feedback. Off-screen kills — those outside the camera view plus a 64px margin — instead drop a single consolidated orb at the kill location with `xpValue = 1 + orbBonus`. If another consolidated orb already exists within 300px of the kill site, the new drop merges into it (summing `xpValue`) instead of spawning a new orb. Consolidated orbs turn red and scale up with their stacked value. A hard cap of 180 active orbs is enforced globally.

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

The game logic is modularized across several files in `_components/` to maintain clean separation of concerns. `AGENTS.md` has the authoritative "which file do I edit for X" map — the table below is an overview.

| File | Responsibility |
|------|----------------|
| `Game.tsx` | React wrapper, Phaser initialization, dynamic imports |
| `_scene.ts` | Main `GameScene` class, state management, and main loop |
| `_sceneInterface.ts` | `IGameScene` interface — must stay in sync with `_scene.ts` |
| `_combat.ts` | Shooting logic, collision handlers, and damage calculation |
| `_progression.ts` | XP collection, level-up logic, and upgrade definitions |
| `_spawning.ts` | Enemy wave spawning and obstacle generation |
| `_textures.ts` | Procedural texture generation (Canvas-based) |
| `_ui.ts` | Heads-up display, weapon icons, stats panel |
| `_screens.ts` | Title, mode, map, weapon-selection, and game-over screens |
| `_powerups.ts` | `PU_TYPES`, `applyPowerUp` — power-up data and effects |
| `_types.ts` | `WeaponType` / `PassiveType` unions, base stats, display names |
| `_enemyTypes.ts` | `ENEMY_TYPES` catalogue — textures auto-derive from it |
| `_maps.ts` | `MapKey`, `MAPS`, `bgPattern` union, background drawing |
| `_constants.ts` | World size, spawn rate, orb caps, consolidation tuning |
| `iconDefs.ts` | Icon drawing definitions (weapon/passive cards, HUD) |
| `EVOLUTIONS_PLAN.md` | Design notes for weapon evolutions (not code) |

Phaser must be dynamically imported as it is a browser-only ESM. The `createGameScene` factory in `_scene.ts` allows passing the `Phaser` instance into the scene class.

### Key methods (implemented in modules)

| Method | Module | What it does |
|--------|--------|-------------|
| `create()` | `_scene.ts` | Resets state, builds textures, registers colliders, spawns obstacles |
| `update()` | `_scene.ts` | Main loop: timer, movement, shooting, enemy/orb updates, UI draw |
| `buildTextures()` | `_textures.ts` | Generates all 20+ textures procedurally |
| `spawnWave()` | `_spawning.ts` | Weighted-random enemy spawn logic |
| `fireShotgun/Sniper/MG` | `_combat.ts` | Weapon-specific firing logic (pellets, pierce, burst) |
| `getUpgrades()` | `_progression.ts` | Builds the 3-card menu pool (passives, upgrades, unlocks) |
| `showUpgradeMenu()` | `_progression.ts` | Pauses physics, renders interactive upgrade cards |
| `applyPowerUp()` | `_powerups.ts` | Handles all 6 power-up effects |
| `addStatsPanel()` | `_ui.ts` | Renders the detailed stats overlay (pause/level-up) |

### Key constants

| Constant | Default | Controls |
|----------|---------|---------|
| `WORLD` | 12000 | World size in pixels (square) |
| `SPAWN_INTERVAL_MS` | 2500 | Initial enemy spawn interval |
| `MAX_ORBS` | 180 | Hard cap on active XP orb physics objects |
| `DESPAWN_DIST` | 2000 | Distance at which enemies silently despawn |
| `VISION_MARGIN` | 64 | Margin added to camera view rect when deciding on-screen vs. off-screen kills |
| `OFFSCREEN_MERGE_RADIUS` | 300 | Max distance between kill site and an existing consolidated orb for the new drop to merge into it |
