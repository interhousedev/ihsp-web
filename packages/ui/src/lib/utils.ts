import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const

/**
 * The one file-size formatter of the platform: `1536` becomes `1.5 KB`, `20971520` becomes `20 MB` (binary units, at
 * most one decimal, whole bytes below 1 KB); units are the same in every language.
 */
export function formatBytes(bytes: number): string {
  let value = Math.max(0, bytes)
  let unit = 0
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  if (unit === 0) return `${Math.round(value)} ${BYTE_UNITS[0]}`
  const rounded = value.toFixed(1)
  return `${rounded.endsWith(".0") ? rounded.slice(0, -2) : rounded} ${BYTE_UNITS[unit]}`
}
