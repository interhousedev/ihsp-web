"use client"

import { RequireAuth } from "@ihsp/auth"
import { PageLoading, ShellNavControls, usePlatformLinks } from "@ihsp/features-core"
import { AppShell, OfflineBadge } from "@ihsp/ui"
import { Suspense, type ReactNode } from "react"
import { useNav } from "../../../config/nav"
import { LmsBrand } from "./lms-brand"
import { ProfileMenu } from "./profile-menu"

/**
 * The frame of every page of this app: login check, sidebar, phone bottom bar and the header with the profile menu.
 * Every page does `<LmsShell><YourPage /></LmsShell>`; the `Suspense` covers pages that read the address.
 */
export function LmsShell({ children }: { children: ReactNode }) {
  const nav = useNav()
  const platforms = usePlatformLinks()
  return (
    <RequireAuth>
      <AppShell
        nav={nav.groups}
        bottomNav={nav.bottom}
        platforms={platforms}
        brand={<LmsBrand />}
        sidebarFooter={<ProfileMenu variant="row" />}
        controlsLeading={<ShellNavControls />}
        controls={<OfflineBadge />}
      >
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
      </AppShell>
    </RequireAuth>
  )
}
