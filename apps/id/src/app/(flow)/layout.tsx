"use client"

import type { ReactNode } from "react"
import { FlowShell } from "@/features/shared/components/flow-shell"

/** Login, registration, recovery and mini app pages: a centered card, no sidebar. */
export default function FlowLayout({ children }: { children: ReactNode }) {
  return <FlowShell>{children}</FlowShell>
}
