"use client"

import type { ReactNode } from "react"
import { AdminFrame } from "@/features/shell/components/admin-frame"

/** Route group: every page except the OAuth callback lives inside the same shell, which stays mounted between pages. */
export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>
}
