# Survivors Game — agent guide

This file is the authoritative guide for this directory. Read it **before** editing any file here. The repo-root `AGENTS.md` covers Next.js-wide rules; this file covers the game.

**Read order for any task:**
1. `README.md` (this dir) — mechanics, stats, architecture overview
2. This file — file map + invariants + recipes
3. The module you're about to edit

---

## File map

The scene class is assembled in `_components/_scene.ts` but most logic lives in sibling modules, called from thin delegating methods. To find code, start from the file listed here — don't grep blindly.

| Want to change… | Edit | Notes |
|---|---|---|
| React wrapper / Phaser boot | `Game.tsx` | Thin. `createGameScene(Phaser)` factory lives in `_scene.ts`. |
| Scene class, `create()`, `update()`, `resetState()`, `recalculateStats()`, `applyPassiveBoost()` | `_scene.ts` | Holds all state fields + top-level orchestration. |
| The scene's public surface (types for all fields & methods) | `_sceneInterface.ts` | **Must stay in sync with `_scene.ts`.** |
| Firing logic, collisions, damage, kill, orb-consolidation tint | `_combat.ts` | `fireX`, `onBulletHitEnemy`, `damageEnemy`, `killEnemy`, `autoShoot`. |
| XP, level-up, upgrade menu, weapon unlock, orb collection + pull | `_progression.ts` | `getUpgrades`, `getWeaponUpgrades`, `showUpgradeMenu`, `unlockWeapon`, `onCollectOrb`, `pullOrbs`. |
| Wave spawning, boss waves, obstacles, enemy movement | `_spawning.ts` | Honors `enemyWeights` from the selected map. |
| Title / mode / map / weapon selection / game-over screens | `_screens.ts` | Map-selection UI iterates `MAPS`. |
| HUD, weapon icons, stats panel | `_ui.ts` | |
| Procedural texture generation (player, enemies, bullets, orbs, power-ups, scythe) | `_textures.ts` | Enemy & power-up textures auto-derive from their data arrays. |
| Icon drawing definitions (weapon/passive cards, HUD icons) | `iconDefs.ts` | |
| Power-up types, spawn, pickup, effects | `_powerups.ts` | `PU_TYPES`, `applyPowerUp` (switch on `type`). |
| `WeaponType` / `PassiveType` unions, base stats, display names | `_types.ts` | **Source of truth for weapon & passive identifiers.** |
| Enemy catalogue | `_enemyTypes.ts` | `ENEMY_TYPES` array; textures auto-build from it. |
| Map catalogue, background drawing | `_maps.ts` | `MapKey`, `MAPS`, `bgPattern` union, `drawBackground`. |
| World size, spawn rate, orb caps, consolidation tuning | `_constants.ts` | |
| Debug menu (hotkey `U`), debug overlays, debug actions | `_debug.ts` | Toggles (invuln, radius rings, hitboxes, HP bars) and actions (evolve, +10 levels, spawn power-up, etc). |

---

## Golden rules (silent-breakage traps)

These are the invariants that TypeScript will *not* catch. Violating them produces bugs that compile clean and run quietly wrong.

### 1. Discriminated unions fan out across the codebase

`WeaponType`, `PassiveType`, `MapKey`, and `bgPattern` are all string-literal unions. Adding a member does **not** trigger a compile error at every consumer — most consumers use `if (wt === 'x')` chains or non-exhaustive `switch` statements that silently do nothing for the new value.

**Before adding a member, grep for every consumer of the union.** Use the union name (type-safe — won't go stale as literals are added):
```bash
grep -rn "WeaponType\b" _components/
grep -rn "PassiveType\b" _components/
grep -rn "MapKey\b"     _components/
grep -rn "bgPattern\b"  _components/
```
For a spot-check of all current literals (source of truth: `_components/_types.ts`):
```bash
grep -rnE "'(shotgun|sniper|aura|machinegun|scythes|tesla|boomerang|rocket|trail|laser|turret|orbital|blackhole|cryo|railgun|drones)'" _components/
```
Count matches. Then verify each one handles your new value. There are ~90+ weapon-type branch sites alone. **Missing one = the feature is silently dead** (no firing, no icon, no upgrade card, etc.).

### 2. `resetState()` is the single source of truth for starting values

- Field declarations in `_scene.ts` are **type anchors only**: use `= 0`, `= false`, `= ''`, `= []`, `= {}`.
- The real initial value lives in `resetState()` — always.
- Never split a canonical starting value across the declaration and `create()`. Adding a non-zero starting value at the declaration will silently desync across restarts.

### 3. `IGameScene` (in `_sceneInterface.ts`) must stay in sync

Every new public field or method on `GameScene` must be added to `IGameScene`. The class declares `implements IGameScene`, so missing entries do error at build — but the error points at the class, not the interface. If build fails with "property X is missing", the fix is usually: add it to `_sceneInterface.ts`.

### 4. `recalculateStats()` owns derived damage, fire rate, bullet speed

Mutate the `bonus*` fields (`bonusDamage`, `bonusCooldown`, `bonusArea`, `bonusWeaponDmg[wt]`, `bonusWeaponBulletSpd[wt]`, `flatWeaponShootRateReductions[wt]`) and then call `recalculateStats()`. Never set `shotgunDmg`, `weaponShootRates[wt]`, etc. directly — they'll be overwritten on the next recalc.

When you add a new weapon, `recalculateStats()` must learn about its damage field.

### 5. Phaser is typed `any`

The dynamic ESM import returns `any`. Cast at call sites (`as Phaser.Physics.Arcade.Image` etc.). **Do not install `@types/phaser`** — it would cascade type errors through the `any`-typed interface surface.

### 6. Orb `xpValue` is required

Every orb must be created with `.setData('xpValue', n)`. Stacked-orb math reads it and produces `NaN` otherwise.

### 7. Sniper bullets carry their own damage

Always `b.setData('dmg', this.sniperDmg)` on sniper bullets. The pierce path reads `getData('dmg')` explicitly — the field value is not a fallback.

### 8. Pause must pause everything

`togglePause()` pauses `physics.world`, `tweens`, and `time.paused`. New systems that tick on `update()` delta already respect the early-return in `update()`, but anything driven by raw `setTimeout`, `Date.now()`, or independent tweens needs explicit pause handling.

---

## Recipes (terse checklists)

Each item says "touch file X to do Y". If you skip a step, the feature will compile but misbehave. After any recipe: run the build check at the bottom.

### Add an enemy type

1. `_enemyTypes.ts` — append to `ENEMY_TYPES` with `key`, `color`, `stroke`, `size`, `radius`, `hp`, `speed`, `unlockSecs`, `weight`, `orbBonus`. Texture auto-builds.
2. `_maps.ts` — if any map should *exclude* it, add to that map's `enemyWeights` with value `0`; if it should be weighted, add a number.
3. `README.md` — update the enemy table.

### Add a weapon

This is the most involved change. Checklist:

1. `_types.ts` — add literal to `WeaponType`, `ALL_WEAPON_TYPES`, `WEAPON_NAMES`, `WEAPON_BASE` (shootRate, bulletSpd, damage).
2. `_scene.ts`:
   - Declare state fields (damage, any weapon-specific stats) with type-anchor defaults.
   - Set real starting values in `resetState()`.
   - Add the damage line to `recalculateStats()`.
   - Add a `fireMyWeapon(...)` delegating method (mirror the existing `fireShotgun`).
3. `_sceneInterface.ts` — add the new fields and the `fireMyWeapon` method.
4. `_combat.ts` — implement `fireMyWeapon`. Add a branch in `autoShoot` (the per-weapon dispatch). If the weapon uses bullets, ensure `onBulletHitEnemy` handles it (pierce, damage lookup).
5. `_progression.ts` — add an entry to the `paths` record inside `getWeaponUpgrade()` (8 entries, levels 2–9). Add to `unlockWeapon` if it has custom unlock side effects (most don't).
6. `iconDefs.ts` — add the icon definition used by the upgrade card and HUD.
7. `_ui.ts` — add a case in `drawWeaponIcon` for the HUD.
8. `_textures.ts` — if the weapon needs a custom bullet/effect texture, add it here.
9. `README.md` — update the weapons table.
10. **Grep check:** `grep -n "shotgun\|sniper\|aura\|machinegun" _components/*.ts` — scan every hit, verify yours is handled or correctly excluded.

### Add a passive upgrade

1. `_types.ts` — add to `PassiveType`, `ALL_PASSIVE_TYPES`, `PASSIVE_DATA` (name, icon, desc).
2. `_scene.ts` — add a branch in `applyPassiveBoost()`. Mutate a `bonus*` field or base stat, then `recalculateStats()` if needed.
3. `iconDefs.ts` — add the icon if new.
4. `README.md` — update the passives table.

### Add an upgrade step to an existing weapon

`_progression.ts` → `getWeaponUpgrade()` → `paths[weapon]` array. Each array has exactly 8 entries (levels 2–9). Index = `weaponLevel - 1`. The entry mutates scene state in its `apply` function.

### Add a power-up

1. `_powerups.ts` — append to `PU_TYPES` (`key`, `name`, `color`, `stroke`, `desc`); add a branch in `applyPowerUp()`. Texture auto-builds from color/stroke.
2. `README.md` — update the power-ups table.

### Add a map

1. `_maps.ts` — extend `MapKey` union; append a `MapDef` entry to `MAPS` with all `bgBase/bgLine/bgDark/bgAccent/bgPattern` and `enemyWeights` (use `0` to exclude an enemy, a number to weight it).
2. `_screens.ts` — verify `showMapSelection` still fits the new count visually (it iterates `MAPS`; may need layout tweak if you pass 4 maps).
3. `README.md` — document the map.

### Add a new background pattern

This is what tripped agents up previously. The `bgPattern` field is a string union, and the switch in `drawBackground` is **not** exhaustive by TypeScript — a missing case is a silent black screen.

1. `_maps.ts`:
   - Extend the `bgPattern` union on `MapDef` (line ~15) with the new literal.
   - Write a `drawMyPattern(bg, map)` function following the signature of `drawHex` / `drawGrid` / `drawCircuit` / `drawWetland`. Use `map.bgBase/bgDark/bgLine/bgAccent` — do **not** hardcode colors. Respect the `WORLD` constant; the background covers the full 12000×12000 world.
   - Add a `case 'mypattern': drawMyPattern(bg, map); break` to the `switch` in `drawBackground`.
2. Assign the new pattern to at least one entry in `MAPS` (or the code is unreachable).
3. Build and verify: if the selected map shows solid `bgBase` with no pattern, you forgot the switch case.

**Common mistakes on this recipe:**
- Adding the `drawX` function but forgetting the switch case → pattern never renders.
- Adding the switch case but forgetting to extend the `bgPattern` union → type error.
- Hardcoding colors instead of reading from `map.bg*` → the pattern looks the same across all maps.
- Drawing in local (viewport) coordinates → pattern doesn't tile across the world.

### Add a constant

`_constants.ts`. Import where needed. Don't duplicate.

---

## Build & verify

From the **repo root** (`website_git/`), not this directory:

```bash
npm run build
```

Must complete with zero type errors before any task is considered done. A failing build is not "almost done" — fix it.

For UI / gameplay changes, you cannot verify correctness from a build alone. State explicitly that visual verification is required and the user should check it in the browser.
