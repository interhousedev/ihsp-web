"use client"

import { RequireAuth, RequireRole } from "@ihsp/auth"
import { AssistantEntry, LegalGate, MaintenanceBanner, ShellNavControls, usePlatformLinks } from "@ihsp/features-core"
import { AppShell, CommandPalette, StateView, ThemeToggle } from "@ihsp/ui"
import { Suspense, type ReactNode } from "react"
import { useNav } from "../../../config/nav"
import { AdminBrand } from "./admin-brand"
import { ProfileMenu } from "./profile-menu"
import { VaultSealedBanner } from "../../vault/components/vault-sealed-banner"

function PageLoading() {
  return (
    <div data-shell-flush className="p-4 md:p-6">
      <StateView state="loading" rows={4} />
    </div>
  )
}

/**
 * The frame of every page: login check, Administration role check (ID-11: there is no Telegram auto login here),
 * sidebar and top bar. Pages use `useSearchParams` through nuqs, so the content sits inside `<Suspense>`.
 */
export function AdminFrame({ children }: { children: ReactNode }) {
  const nav = useNav()
  const platforms = usePlatformLinks()
  return (
    <RequireAuth>
      <RequireRole role="admin">
        <AppShell
          nav={nav.groups}
          brand={<AdminBrand />}
          platforms={platforms}
          history={<ShellNavControls />}
          search={<CommandPalette nav={nav.groups} />}
          ai={<AssistantEntry href="/assistant/" />}
          tools={<ThemeToggle />}
          settingsHref="/settings/"
          profile={<ProfileMenu />}
          sidebarFooter={<ProfileMenu variant="row" />}
        >
          <div className="p-4 pb-0 md:px-6 md:pt-6" data-shell-flush>
            <VaultSealedBanner />
            <MaintenanceBanner className="m-0" />
          </div>
          <Suspense fallback={<PageLoading />}>{children}</Suspense>
          <LegalGate />
        </AppShell>
      </RequireRole>
    </RequireAuth>
  )
}
