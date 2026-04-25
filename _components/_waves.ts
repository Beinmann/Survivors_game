export interface WaveDef {
  name: string
  durationSec: number
  weights: Partial<Record<string, number>>
  isBoss?: boolean
}
