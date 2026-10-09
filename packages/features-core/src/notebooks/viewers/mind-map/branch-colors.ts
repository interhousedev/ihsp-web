/** Number of `--chart-N` theme tokens the branches cycle through. */
export const BRANCH_COLOR_COUNT = 5

/** Index (1 to 5) of the `--chart-N` token of a first-level branch; the root has no branch. */
export function chartIndex(branch: number): number {
  return (((branch % BRANCH_COLOR_COUNT) + BRANCH_COLOR_COUNT) % BRANCH_COLOR_COUNT) + 1
}

/** CSS colour of a branch (a theme token, so light and dark themes both work). The root uses the primary colour. */
export function branchColor(branch: number | null): string {
  return branch === null ? "var(--primary)" : `var(--chart-${chartIndex(branch)})`
}
