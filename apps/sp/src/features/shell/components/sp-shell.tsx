"use client"
import { LegalGate, MaintenanceBanner } from "@ihsp/features-core"

import { RequireAuth, RequireRole } from "@ihsp/auth"
import { ConnectAiDialogHost, HelpWidget, OnboardingTour, PageLoading, ShellNavControls } from "@ihsp/features-core"
import { isPwaMode } from "@ihsp/features-core/pwa"
import { getConfig } from "@ihsp/config"
import { AppShell } from "@ihsp/ui"
import { Suspense, type ReactNode } from "react"
import { useNav } from "../../../config/nav"
import { OnboardingGate } from "../../onboarding/components/onboarding-gate"
import { QueryPersistence } from "../../offline/components/query-persistence"
import { SpBottomNav } from "./sp-bottom-nav"
import { ProfileMenu } from "./profile-menu"
import { ShellHeader } from "./shell-header"
import { SpBrand } from "./sp-brand"

const TOUR_PLACES = [
  { key: "assistant", href: "/assistant/" },
  { key: "notebooks", href: "/notebooks/" },
  { key: "flashcards", href: "/flashcards/" },
  { key: "mail", href: "/mail/" },
  { key: "certificates", href: "/profile/#certificates-title" },
] as const

/**
 * The frame of every page of this app: login check, student role check, offline cache, sidebar and the phone bottom bar
 * (the pages chosen in Settings, More; in the installed app the phone has no sidebar), header with search, bell and profile menu (WEB-2, GEN-9).
 * Study-tools pages use it too: `<SpShell><YourPage /></SpShell>`.
 * `hideBottomNav` drops the phone bottom bar for pages that bring their own (the notebook workspace).
 */
export function SpShell({ children, hideBottomNav = false }: { children: ReactNode; hideBottomNav?: boolean }) {
  const nav = useNav()
  return (
    <RequireAuth>
      {/* oxlint-disable-next-line jsx-a11y/aria-role -- `role` is the IHSP role the user must have, not an ARIA role */}
      <RequireRole role="student">
        <QueryPersistence>
          <AppShell
            nav={nav.groups}
            bottomBar={hideBottomNav ? undefined : <SpBottomNav groups={nav.groups} />}
            mobileSidebar={!isPwaMode()}
            brand={<SpBrand />}
            sidebarFooter={<ProfileMenu variant="row" />}
            controlsLeading={<ShellNavControls />}
            controls={<ShellHeader nav={nav.groups} />}
            floating={hideBottomNav ? null : <HelpWidget />}
          >
            <MaintenanceBanner />
            <Suspense fallback={<PageLoading />}>{children}</Suspense>
            <LegalGate />
            <OnboardingTour
              variant="student"
              settingsHref="/settings/"
              connectAiHref={`${getConfig().ID_URL}/connectors/new/`}
              places={TOUR_PLACES}
            />
            <ConnectAiDialogHost />
            <OnboardingGate />
          </AppShell>
        </QueryPersistence>
      </RequireRole>
    </RequireAuth>
  )
}
