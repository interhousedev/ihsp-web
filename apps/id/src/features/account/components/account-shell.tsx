"use client"
import { patchPreferences } from "@ihsp/api"
import { logout, useSession } from "@ihsp/auth"
import {
  LegalGate,
  MaintenanceBanner,
  ShellNavControls,
  fullName,
  useLicenseMenu,
  usePlatformLinks,
} from "@ihsp/features-core"
import { AppShell, CommandPalette, SidebarBrand, UserMenu } from "@ihsp/ui"
import type { ReactNode } from "react"
import { useTr } from "@ihsp/features-core/id-account"
import { useIdBottom, useIdNav } from "../hooks/use-id-nav"

/** Frame of the security pages: sidebar (a sheet on phones) with the account menu: license, language, theme and log out. */
export function AccountShell({ children }: { children: ReactNode }) {
  const t = useTr()
  const { session } = useSession()
  const user = session?.user
  const nav = useIdNav(user?.roles ?? [])
  const bottom = useIdBottom()
  const platforms = usePlatformLinks()
  const license = useLicenseMenu()

  return (
    <AppShell
      nav={nav}
      bottomNav={bottom}
      platforms={platforms}
      brand={
        <SidebarBrand
          name={t("idCommon.brand")}
          platform="id"
        />
      }
      history={<ShellNavControls home="/security/" />}
      search={<CommandPalette nav={nav} />}
      sidebarFooter={
        user ? (
          <>
            <UserMenu
              variant="row"
              name={fullName(user)}
              subtitle={user.login}
              items={license.items}
              platforms={platforms}
              onLogout={() => void logout()}
              onLocaleChange={(locale) => void patchPreferences({ locale }).catch(() => undefined)}
            />
            {license.dialog}
          </>
        ) : null
      }
    >
      <MaintenanceBanner />
      {children}
      <LegalGate />
    </AppShell>
  )
}
