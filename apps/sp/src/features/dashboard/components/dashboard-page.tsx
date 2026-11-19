"use client"

import { useT } from "@ihsp/i18n"
import { NoStudentRecordNotice } from "../../shared/components/no-student-record-notice"
import { isRecordBlocked, useStudentRecordState } from "../../shared/hooks/use-student-record-state"
import { Dashboard } from "../../today/dashboard/dashboard"
import { HomeHeader } from "./home-header"

/**
 * Home, the landing page (`/`): the student's face (it opens the profile) and the widget grid. Pages of the app are
 * reached from the shell's navigation, so nothing else repeats them here. The page is flush: the header runs under the
 * shell's floating controls and reserves their row itself. Its one `h1` is visually hidden: the header shows the name.
 * A student without a usable record sees the explanation instead of widgets that cannot load.
 */
export function DashboardPage() {
  const nav = useT("nav")
  const record = useStudentRecordState()
  return (
    <div data-shell-flush className="flex min-w-0 flex-1 flex-col gap-5 pb-24 max-md:-mt-(--shell-top-reserve)">
      <h1 className="sr-only">{nav("dashboard")}</h1>
      <HomeHeader />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 md:px-6">
        {isRecordBlocked(record.status) ? <NoStudentRecordNotice reason={record.status} /> : <Dashboard />}
      </div>
    </div>
  )
}
