"use client"

import type { Role } from "@ihsp/api"
import { RequireAuth, RequireRole } from "@ihsp/auth"
import { MaintenanceBanner, PageLoading, ShellNavControls, usePlatformLinks } from "@ihsp/features-core"
import { AppShell, OfflineBadge } from "@ihsp/ui"
import { Suspense, type ReactNode } from "react"
import { useNav } from "../../../config/nav"
import { AdmissionBrand } from "./admission-brand"
import { AdmissionConsentGate } from "../../consent/components/consent-gate"
import { ProfileMenu } from "./profile-menu"

function Frame({ children }: { children: ReactNode }) {
  const nav = useNav()
  const platforms = usePlatformLinks()
  return (
    <AppShell
      controlsLeading={<ShellNavControls />}
      nav={nav.groups}
      bottomNav={nav.bottom}
      platforms={platforms}
      brand={<AdmissionBrand />}
      sidebarFooter={<ProfileMenu variant="row" />}
      controls={<OfflineBadge />}
    >
      <MaintenanceBanner />
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
      <AdmissionConsentGate />
    </AppShell>
  )
}

/**
 * The frame of every page: sign-in is required; `roles` additionally limits the page (the staff area).
 * The `Suspense` covers pages that read the address.
 */
export function AdmissionShell({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  return (
    <RequireAuth>
      <Frame>{roles ? <RequireRole role={roles}>{children}</RequireRole> : children}</Frame>
    </RequireAuth>
  )
}
