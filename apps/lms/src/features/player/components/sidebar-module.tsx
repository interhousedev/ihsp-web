"use client"

import type { ReactNode } from "react"

/** A module (section) of the course sidebar: its number and title in bold, then its lessons. */
export function SidebarModule({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <li>
      <h2 className="flex gap-2 px-4 pt-5 pb-2 text-sm leading-snug font-bold">
        <span className="tabular-nums">{number}</span>
        <span className="min-w-0 break-words">{title}</span>
      </h2>
      <ol>{children}</ol>
    </li>
  )
}
