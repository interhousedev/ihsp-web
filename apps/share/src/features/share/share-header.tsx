"use client"

import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { LanguageSwitcher, ThemeToggle } from "@ihsp/ui"
import type { ReactNode } from "react"
import { ShareAccountMenu } from "./share-account-menu"

/** Page frame of every share state: skip link, brand (a link to the student app), language and theme on top, the content below. */
export function ShareFrame({ children }: { children: ReactNode }) {
  const t = useT("share")
  const tCommon = useT("common")
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <a
        href="#main-content"
        className="bg-background text-foreground focus:ring-ring sr-only z-50 rounded-md px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:ring-2"
      >
        {tCommon("skipToContent")}
      </a>
      <header className="flex items-center justify-between gap-3">
        <a href={getConfig().SP_URL} className="text-lg font-semibold tracking-tight">
          {t("brand")}
        </a>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="min-h-11 md:min-h-9" />
          <ThemeToggle />
          <ShareAccountMenu />
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col gap-6 outline-none">
        {children}
      </main>
    </div>
  )
}
