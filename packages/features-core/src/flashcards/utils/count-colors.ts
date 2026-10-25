/** Anki's colours of the three queues: new is blue, learning is red, to review is green. */
export const COUNT_COLORS = {
  new: "text-blue-600 dark:text-blue-400",
  learning: "text-red-600 dark:text-red-400",
  review: "text-green-600 dark:text-green-400",
} as const

export type CountQueue = keyof typeof COUNT_COLORS
