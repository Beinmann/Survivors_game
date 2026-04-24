# Weapon evolutions — implementation plan

## System rules (shape)

- **Cap per run**: all 3 active weapons can evolve.
- **Passive requirement**: linked passive at **L3** (or **L2** for Multishot — that's its max).
- **Lvl-9 interaction**: evolution **replaces** the lvl-9 upgrade. Eligibility triggers the moment the weapon hits lvl 9 AND the linked passive is at required level.
- **Card weight**: 4 (same as rocket).
- **Card visual**: purple/gold border — already implemented in `_progression.ts` via `isEvolution` branch.

## Evolution table

| # | Base | Evolution | Linked passive | Mechanic |
|---|---|---|---|---|
| 0 | Homing Rockets | **Swarm Barrage** ✅ shipped | Power Core L3 | 5-rocket salvo @ 60ms stagger, +150% dmg, −400ms cd, always splits into 6 homing shards at 70% dmg |
| 1 | Shotgun | **Thunder Hail** | Multishot L2 | Each pellet is a lightning bolt; chains to nearest enemy within 120px at 60% dmg. Cone +30°, range +40% |
| 2 | Sniper Rifle | **Crit Cascade** | Arcane Reach L3 | Bullet ricochets between enemies within 240px, up to 6 ricochets at full damage. Replaces pierce with ricochet |
| 3 | Shock Aura | **Thunderdome** | Arcane Reach L3 | Radius ×2, pulse rate ×2. Each hit chains a bolt to enemy's nearest neighbor at +50% dmg |
| 4 | Machine Gun | **Flak Cannon** | Power Core L3 | Each bullet explodes in a 40px AoE. Fire rate −30%, per-hit dmg +80% |
| 5 | Spectral Scythes | **Death Coil** | Arcane Reach L3 | Second counter-rotating ring at ×1.6 radius. Inner ring +2 blades. Lifesteal always on |
| 6 | Tesla Chain | **Voltaic Lance** | Power Core L3 | 1s sustained beam player→target; all enemies inside the line take continuous damage every 100ms |
| 7 | Ricochet Boomerang | **Star Fan** | Multishot L2 | 5 boomerangs in a star; all pierce; return paths seek nearest enemy rather than returning to player |
| 8 | Incendiary Trail | **Hellfire Path** | Arcane Reach L3 | Every 1s each trail patch erupts in an 80px fire explosion. Burn always on and doubled. Patch duration +50% |
| 9 | Laser Beam | **Prism Array** | Multishot L2 | 4 beams in a + pattern around the player each pulse. Independent pierce per beam |
| 10 | Sentry Turret | **Mortar Squad** | Power Core L3 | Turrets fire mini rockets (40px AoE) instead of bullets. Fire rate ×0.5, damage ×3 |
| 11 | Orbital Strike | **Meteor Shower** | Multishot L2 | Each cast spawns 5 strikes over a 450px spread. Telegraph 0.6s (from 1s) |
| 12 | Black Hole | **Supermassive** | Arcane Reach L3 | Radius ×2, pull ×3, duration ×2, tick damage ×2 |
| 13 | Cryo Shards | **Glacial Volley** | Multishot L2 | 8 shards per volley (from 3). Slow duration ×2. On hit, each fragments into 2 smaller shards at 50% dmg |
| 14 | Plasma Lance | **Starbreaker** | Arcane Reach L3 | During the 900ms sustain, beam sweeps 360° around the player. Lighthouse |
| 15 | Swarm Drones | **Hornet Swarm** | Multishot L2 | Drone count +4, attack rate ×2, each attack fires a homing micro-rocket (small AoE) |

## Linked-passive distribution

Final counts across all 16 evolutions:

- **Power Core**: 4 (Rockets, MG, Tesla, Turret)
- **Arcane Reach**: 6 (Sniper, Aura, Scythes, Trail, Black Hole, Plasma Lance)
- **Multishot**: 6 (Shotgun, Boomerang, Laser, Orbital, Cryo, Drones)
- **Overclock, Vital Surge, Swift Feet, Bounty Magnet**: 0 each

A run built into those four passives won't see any evolution. Design call:
- (a) Rebalance a few links to Overclock/Vital Surge later
- (b) Retune those passives so they have other meta appeal
- (c) Accept that evolution-unlocking passives become the "meta" ones on purpose

## Implementation recipe (same pattern as rocket)

For each evolution:

1. **`_components/_types.ts`** — add entry to `WEAPON_EVOLUTIONS` with `name`, `desc`, `icon`, `linkedPassive`, `linkedPassiveMinLevel`.
2. **`_components/_scene.ts` → `recalculateStats()`** — if the evolution touches damage/cooldown/bullet speed, branch on `weaponEvolutions[wt]` for that weapon's formula.
3. **`_components/_combat.ts` → `fireX`** — branch on evolution flag for firing behavior (count, spread, bullet type). For homing/ricochet/chain logic, extend the relevant branch in `onBulletHitEnemy`.
4. **`_components/_textures.ts`** — add evolved bullet texture if visually distinct.
5. **`_components/iconDefs.ts`** — add `wico_{weapon}_evolved` icon with a gold ring (mirror the rocket pattern).
6. **`_components/_ui.ts` → `rebuildWeaponHUDTexts`** — already swaps to evolved icon when `weaponEvolutions[wt]` is set; no change needed.
7. **`_components/_progression.ts`** — no change; `getEvolutionOptions()` already handles all entries in `WEAPON_EVOLUTIONS`.
8. **`README.md`** — add a row to the evolutions table.

## Complexity ranking (easiest → hardest)

Trivial — stat multipliers only:
- **Supermassive** (Black Hole) — radius/pull/duration/dmg multipliers
- **Glacial Volley** (Cryo) — shard count + slow + fragment-on-hit
- **Death Coil** (Scythes) — second orbit ring (copy existing orbit, flip rotation)

Moderate — compose existing primitives:
- **Thunder Hail** (Shotgun) — tesla-style chain from pellets (reuse tesla chain code)
- **Flak Cannon** (MG) — each bullet = tiny rocket on impact (reuse rocket AoE)
- **Hellfire Path** (Trail) — pulse-explode each patch (extend `updateTrailSprites`)
- **Prism Array** (Laser) — 4 simultaneous beams (call `fireLaser` 4× with offset angles)
- **Meteor Shower** (Orbital) — 5 strikes in a spread
- **Mortar Squad** (Turret) — turret bullets become rockets (swap texture + AoE on hit)

Non-trivial — new behaviors:
- **Crit Cascade** (Sniper) — ricochet to nearest (replaces pierce; needs target memory)
- **Thunderdome** (Aura) — chain bolts from each aura hit
- **Voltaic Lance** (Tesla) — 1s sustained beam (beam object + tick loop)
- **Star Fan** (Boomerang) — return path seeks enemy rather than player
- **Starbreaker** (Plasma Lance) — 360° sweep during sustain (rotate beam angle over time)
- **Hornet Swarm** (Drones) — drone attacks spawn homing micro-rockets

No option is architecturally risky. Everything composes from primitives already in the codebase.

## Suggested implementation order

1. All three "trivial" ones first (Black Hole, Cryo, Scythes) — validates the end-to-end pattern beyond the rocket prototype with minimal new code.
2. The six "moderate" ones.
3. The six "non-trivial" ones last.

Each evolution should build + visual-verify independently before moving to the next.
