"use client"
import { RequireAuth, RequireRole } from "@ihsp/auth"
import {
  AssistantEntry,
  HelpWidget,
  LegalGate,
  MaintenanceBanner,
  NotificationBell,
  OnboardingTour,
  PageLoading,
  ShellNavControls,
  usePlatformLinks,
} from "@ihsp/features-core"
import { getConfig } from "@ihsp/config"
import { AppShell, OfflineBadge } from "@ihsp/ui"
import { Suspense, type ReactNode } from "react"
import { useNav } from "../../../config/nav"
import { CuratedGroupsError } from "./curated-groups-error"
import { ProfileMenu } from "./profile-menu"
import { ShellSearch } from "./shell-search"
import { StaffBrand } from "./staff-brand"

/**
 * The frame of every page of this app: login check, teacher role check, sidebar and phone bottom bar (Today,
 * Timetable, Journal, My group, More), header with the notification bell and the profile menu (STF-1).
 */
export function StaffShell({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <RequireRole role="teacher">
        <StaffFrame>{children}</StaffFrame>
      </RequireRole>
    </RequireAuth>
  )
}

/**
 * Sidebar, bottom bar and header. The navigation asks the API which groups the teacher curates, so it must be built
 * inside the login and role checks: an anonymous visitor would otherwise send an unauthorized request first.
 */
function StaffFrame({ children }: { children: ReactNode }) {
  const nav = useNav()
  const platforms = usePlatformLinks()
  return (
    <AppShell
      history={<ShellNavControls />}
      search={<ShellSearch nav={nav.groups} />}
      ai={<AssistantEntry href="/assistant/" />}
      bell={<NotificationBell />}
      tools={<OfflineBadge />}
      settingsHref="/settings/"
      profile={<ProfileMenu />}
      nav={nav.groups}
      bottomNav={nav.bottom}
      platforms={platforms}
      brand={<StaffBrand />}
      sidebarFooter={<ProfileMenu variant="row" />}
    >
      <CuratedGroupsError />
      <MaintenanceBanner />
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
      <LegalGate />
      <OnboardingTour
        variant="staff"
        settingsHref="/settings/"
        connectAiHref={`${getConfig().ID_URL}/connectors/new/`}
      />
      <HelpWidget />
    </AppShell>
  )
}
