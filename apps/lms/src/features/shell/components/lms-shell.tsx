"use client"
import { LegalGate, MaintenanceBanner } from "@ihsp/features-core"

import { useSession } from "@ihsp/auth"
import { AssistantEntry, PageLoading, ShellNavControls, usePlatformLinks } from "@ihsp/features-core"
import { AppHeaderActions, AppShell, OfflineBadge } from "@ihsp/ui"
import { Suspense, type ReactNode } from "react"
import { useNav } from "../../../config/nav"
import { AccessGate, type Access } from "./access-gate"
import { LmsBrand } from "./lms-brand"
import { ProfileMenu } from "./profile-menu"
import { SignInButton } from "./sign-in-button"

/**
 * The frame of every page of this app: login check, sidebar, phone bottom bar and the header with the profile menu.
 * Every page does `<LmsShell><YourPage /></LmsShell>`; the `Suspense` covers pages that read the address.
 */
export function LmsShell({ children, access = "auth" }: { children: ReactNode; access?: Access }) {
  const nav = useNav()
  const { status } = useSession()
  const platforms = usePlatformLinks()
  return (
    <AccessGate access={access}>
      <AppShell
        nav={nav.groups}
        bottomNav={nav.bottom}
        platforms={platforms}
        brand={<LmsBrand />}
        sidebarFooter={<ProfileMenu variant="row" />}
        controlsLeading={<ShellNavControls />}
        controls={
          <AppHeaderActions ai={<AssistantEntry />} profile={status === "anonymous" ? null : <ProfileMenu />}>
            {status === "anonymous" ? <SignInButton /> : null}
            <OfflineBadge />
          </AppHeaderActions>
        }
      >
        <MaintenanceBanner />
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
        <LegalGate />
      </AppShell>
    </AccessGate>
  )
}
