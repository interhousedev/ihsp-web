"use client"

import { RequireAuth } from "@ihsp/auth"
import { AppShell, OfflineBadge } from "@ihsp/ui"
import { Suspense, type ReactNode } from "react"
import { useNav } from "../../../config/nav"
import { LmsBrand } from "./lms-brand"
import { PageLoading } from "./page-loading"
import { ProfileMenu } from "./profile-menu"

/**
 * The frame of every page of this app: login check, sidebar, phone bottom bar and the header with the profile menu.
 * Every page does `<LmsShell><YourPage /></LmsShell>`; the `Suspense` covers pages that read the address.
 */
export function LmsShell({ children }: { children: ReactNode }) {
  const nav = useNav()
  return (
    <RequireAuth>
      <AppShell
        nav={nav.groups}
        bottomNav={nav.bottom}
        brand={<LmsBrand />}
        header={
          <>
            <OfflineBadge />
            <ProfileMenu />
          </>
        }
      >
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
      </AppShell>
    </RequireAuth>
  )
}
