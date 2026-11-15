"use client"

import { Dashboard } from "../../today/dashboard/dashboard"
import { HomeHeader } from "./home-header"

/**
 * Home, the landing page (`/`): the student's face (it opens the profile) and the widget grid. Pages of the app are
 * reached from the shell's navigation, so nothing else repeats them here. The page is flush: the header runs under the
 * shell's floating controls and reserves their row itself.
 */
export function DashboardPage() {
  return (
    <div data-shell-flush className="flex min-w-0 flex-1 flex-col gap-5 pb-24 max-md:-mt-(--shell-top-reserve)">
      <HomeHeader />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 md:px-6">
        <Dashboard />
      </div>
    </div>
  )
}
