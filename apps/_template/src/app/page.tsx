"use client"

import { RequireAuth, logout, useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { AppShell, Icons, PageContainer, ThemeToggle, UserMenu } from "@ihsp/ui"
import { useNav } from "../config/nav"

function Brand() {
  const t = useT()
  return (
    <div className="flex items-center gap-2 px-2 py-1 font-semibold">
      <Icons.logo aria-hidden />
      <span className="truncate group-data-[collapsible=icon]:hidden">{t("app.name")}</span>
    </div>
  )
}

function ProfileMenu() {
  const { session } = useSession()
  if (!session) return null
  const { first_name, last_name, login } = session.user
  return <UserMenu name={`${last_name} ${first_name}`} subtitle={login} onLogout={() => void logout()} />
}

/**
 * Example page: `RequireAuth` → `AppShell` (sidebar, phone bottom bar, top bar) → `PageContainer`.
 * Real pages replace the body; the frame stays the same.
 */
export default function HomePage() {
  const t = useT()
  const nav = useNav()
  return (
    <RequireAuth>
      <AppShell
        nav={nav.groups}
        bottomNav={nav.bottom}
        brand={<Brand />}
        header={
          <>
            <ThemeToggle />
            <ProfileMenu />
          </>
        }
      >
        <PageContainer title={t("home.title")} description={t("home.description")}>
          <p className="text-muted-foreground text-sm">{t("home.placeholder")}</p>
        </PageContainer>
      </AppShell>
    </RequireAuth>
  )
}
