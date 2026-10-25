export type SaveStatus = "saved" | "dirty" | "saving" | "offline" | "error" | "conflict"

/** Autosave runs every 30 seconds (LMS-6). */
export const AUTOSAVE_INTERVAL_MS = 30_000
