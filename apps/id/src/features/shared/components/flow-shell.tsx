"use client"

import { LanguageSwitcher, ThemeToggle } from "@ihsp/ui"
import type { ReactNode } from "react"
import { useTr } from "../hooks/use-tr"

/** Centered, sidebar-free page frame of the login, registration, recovery and mini app pages (works at 360 px). */
export function FlowShell({ children }: { children: ReactNode }) {
  const t = useTr()
  return (
    <div
      className="bg-muted/40 flex min-h-dvh flex-col"
      style={{
        paddingTop: "max(env(safe-area-inset-top), var(--tg-safe-area-inset-top, 0px))",
        paddingBottom: "max(env(safe-area-inset-bottom), var(--tg-safe-area-inset-bottom, 0px))",
      }}
    >
      <header className="flex items-center justify-between px-4 py-3">
        <span className="text-base font-semibold tracking-tight">{t("idCommon.brand")}</span>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-6">{children}</main>
    </div>
  )
}
