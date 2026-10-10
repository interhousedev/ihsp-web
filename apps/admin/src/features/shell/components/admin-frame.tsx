"use client"

import { RequireAuth, RequireRole } from "@ihsp/auth"
import { HistoryButtons } from "@ihsp/features-core"
import { AppShell, StateView, ThemeToggle } from "@ihsp/ui"
import { Suspense, type ReactNode } from "react"
import { useNav } from "../../../config/nav"
import { AdminBrand } from "./admin-brand"
import { ProfileMenu } from "./profile-menu"

function PageLoading() {
  return (
    <div className="p-4 md:p-6">
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
  return (
    <RequireAuth>
      <RequireRole role="admin">
        <AppShell
          nav={nav.groups}
          brand={<AdminBrand />}
          headerLeading={<HistoryButtons />}
          header={
            <>
              <ThemeToggle />
              <ProfileMenu />
            </>
          }
        >
          <Suspense fallback={<PageLoading />}>{children}</Suspense>
        </AppShell>
      </RequireRole>
    </RequireAuth>
  )
}
