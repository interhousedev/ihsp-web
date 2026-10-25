"use client"

import { patchPreferences } from "@ihsp/api"
import { logout, useSession } from "@ihsp/auth"
import { usePlatformLinks } from "@ihsp/features-core"
import { AppShell, UserMenu } from "@ihsp/ui"
import type { ReactNode } from "react"
import { useTr } from "../../shared/hooks/use-tr"
import { useIdNav } from "../hooks/use-id-nav"

/** Frame of the security pages: sidebar (a sheet on phones), account menu with language, theme and log out. */
export function AccountShell({ children }: { children: ReactNode }) {
  const t = useTr()
  const { session } = useSession()
  const user = session?.user
  const nav = useIdNav(user?.roles ?? [])
  const platforms = usePlatformLinks()

  return (
    <AppShell
      nav={nav}
      brand={<span className="px-2 text-base font-semibold">{t("idCommon.brand")}</span>}
      header={
        user ? (
          <UserMenu
            name={`${user.first_name} ${user.last_name}`}
            subtitle={user.login}
            platforms={platforms}
            onLogout={() => void logout()}
            onLocaleChange={(locale) => void patchPreferences({ locale }).catch(() => undefined)}
          />
        ) : null
      }
    >
      {children}
    </AppShell>
  )
}
