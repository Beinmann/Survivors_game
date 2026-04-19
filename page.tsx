import Game from './_components/Game'

export default function TwoDGamePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">2D Survivor</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-6">
        Move with <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-xs font-mono">WASD</kbd> or arrow keys.
        You auto-shoot the nearest enemy. Collect XP orbs to level up.
      </p>
      <Game />
      <ul className="mt-4 text-sm text-zinc-500 space-y-1 list-disc list-inside">
        <li>Enemies spawn in waves and get faster as you level up</li>
        <li>Level 3: spread shot &nbsp;·&nbsp; Level 5: rear shot</li>
        <li>Leveling up restores 15 HP</li>
      </ul>
    </div>
  )
}
