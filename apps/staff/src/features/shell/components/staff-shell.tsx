"use client"

import { RequireAuth, RequireRole } from "@ihsp/auth"
import { HistoryButtons } from "@ihsp/features-core"
import { AppShell } from "@ihsp/ui"
import { Suspense, type ReactNode } from "react"
import { useNav } from "../../../config/nav"
import { PageLoading } from "./page-loading"
import { ShellHeader } from "./shell-header"
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
  return (
    <AppShell headerLeading={<HistoryButtons />} nav={nav.groups} bottomNav={nav.bottom} brand={<StaffBrand />} header={<ShellHeader nav={nav.groups} />}>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </AppShell>
  )
}
