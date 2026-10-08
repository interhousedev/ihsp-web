"use client"

import { RequireAuth, RequireRole } from "@ihsp/auth"
import { AppShell } from "@ihsp/ui"
import { Suspense, type ReactNode } from "react"
import { useNav } from "../../../config/nav"
import { QueryPersistence } from "../../offline/components/query-persistence"
import { PageLoading } from "./page-loading"
import { ShellHeader } from "./shell-header"
import { SpBrand } from "./sp-brand"

/**
 * The frame of every page of this app: login check, student role check, offline cache, sidebar and phone bottom bar
 * (Today, Timetable, Grades, Homework, More), header with search, bell and profile menu (WEB-2, GEN-9).
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
            bottomNav={hideBottomNav ? undefined : nav.bottom}
            brand={<SpBrand />}
            header={<ShellHeader nav={nav.groups} />}
          >
            <Suspense fallback={<PageLoading />}>{children}</Suspense>
          </AppShell>
        </QueryPersistence>
      </RequireRole>
    </RequireAuth>
  )
}
