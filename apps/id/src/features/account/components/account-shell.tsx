"use client"

import { patchPreferences } from "@ihsp/api"
import { logout, useSession } from "@ihsp/auth"
import { ShellNavControls, useLicenseMenu, usePlatformLinks } from "@ihsp/features-core"
import { AppShell, SidebarBrand, UserMenu } from "@ihsp/ui"
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
          // oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file of /public
          logo={<img src="/icons/logo.svg" alt="" width={24} height={24} className="rounded-md" />}
        />
      }
      controlsLeading={<ShellNavControls home="/security/" />}
      sidebarFooter={
        user ? (
          <>
            <UserMenu
              variant="row"
              name={`${user.first_name} ${user.last_name}`}
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
      {children}
    </AppShell>
  )
}
