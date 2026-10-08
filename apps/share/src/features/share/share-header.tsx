"use client"

import { useT } from "@ihsp/i18n"
import { LanguageSwitcher, ThemeToggle } from "@ihsp/ui"
import type { ReactNode } from "react"

/** Page frame of every share state: brand, language and theme on top, the content below. */
export function ShareFrame({ children }: { children: ReactNode }) {
  const t = useT("share")
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between gap-3">
        <span className="text-lg font-semibold tracking-tight">{t("brand")}</span>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="min-h-11 md:min-h-9" />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-6">{children}</main>
    </div>
  )
}
