import type { InfographicBlock } from "@ihsp/api"

/** Props of the renderer of one block type. */
export type BlockProps = {
  block: InfographicBlock
  index: number
  tones: readonly string[]
}
