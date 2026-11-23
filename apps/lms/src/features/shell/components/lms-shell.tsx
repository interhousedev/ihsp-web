"use client"

import { useSession } from "@ihsp/auth"
import {
  AssistantEntry,
  LegalGate,
  MaintenanceBanner,
  PageLoading,
  ShellNavControls,
  usePlatformLinks,
} from "@ihsp/features-core"
import { AppShell, CommandPalette, OfflineBadge } from "@ihsp/ui"
import { Suspense, type ReactNode } from "react"
import { useNav } from "../../../config/nav"
import { AccessGate, type Access } from "./access-gate"
import { LmsBrand } from "./lms-brand"
import { ProfileMenu } from "./profile-menu"
import { HeaderXp } from "../../engagement/components/header-xp"
import { BadgeAwardDialog } from "../../badges/components/badge-award-dialog"
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
        history={<ShellNavControls />}
        search={<CommandPalette nav={nav.groups} />}
        ai={<AssistantEntry />}
        profile={status === "anonymous" ? null : <ProfileMenu />}
        tools={
          <>
            {status === "anonymous" ? <SignInButton /> : null}
            {status === "authenticated" ? <HeaderXp /> : null}
            <OfflineBadge />
          </>
        }
      >
        <MaintenanceBanner />
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
        <LegalGate />
        {status === "authenticated" ? <BadgeAwardDialog /> : null}
      </AppShell>
    </AccessGate>
  )
}
