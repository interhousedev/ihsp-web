import type { ReactNode } from "react"

/** One label and value of a profile card. */
export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2 text-sm font-medium break-words">{children}</dd>
    </div>
  )
}
