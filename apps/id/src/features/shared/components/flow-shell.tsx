"use client"

import { BRAND } from "@ihsp/config/brand"
import { LanguageSwitcher, ThemeToggle } from "@ihsp/ui"
import type { ReactNode } from "react"
import { useTr } from "@ihsp/features-core/id-account"
import { CampusPanel } from "./campus-panel"
import { SecurityContactButton } from "./security-contact-button"

/**
 * Page frame of the login, registration, recovery and mini app pages: the form on the left and, from `lg` up, a
 * campus photo on the right (sign-in-split layout of the component library). Below `lg` only the form shows (360 px).
 */
export function FlowShell({ children }: { children: ReactNode }) {
  const t = useTr()
  return (
    <div
      className="bg-muted/40 grid min-h-dvh lg:grid-cols-2"
      style={{
        paddingTop: "max(env(safe-area-inset-top), var(--tg-safe-area-inset-top, 0px))",
        paddingBottom: "max(env(safe-area-inset-bottom), var(--tg-safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-base font-semibold tracking-tight">
            {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file of /public */}
            <img src={BRAND.logos.svg} alt="" width={28} height={28} className="size-7 rounded-md" />
            {t("idCommon.brand")}
          </span>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-6">{children}</main>
        <footer className="flex flex-col items-center gap-1 px-4 py-3">
          <SecurityContactButton />
        </footer>
      </div>
      <CampusPanel />
    </div>
  )
}
