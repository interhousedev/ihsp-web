"use client"

import { Dashboard } from "../../today/dashboard/dashboard"
import { HomeHeader } from "./home-header"
import { HomeLessons } from "./home-lessons"
import { HomeTileGrid } from "./home-tile-grid"

/**
 * Home, the landing page (`/`), laid out like the EMIS app: the brand header with the stat tiles, today's lessons, the
 * grid of pages, and below it the student's own widget grid. The page is flush: the header runs under the shell's floating
 * controls and reserves their row itself.
 */
export function DashboardPage() {
  return (
    <div data-shell-flush className="flex min-w-0 flex-1 flex-col gap-5 pb-24 max-md:-mt-(--shell-top-reserve)">
      <HomeHeader />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 md:px-6">
        <HomeLessons />
        <HomeTileGrid />
        <Dashboard />
      </div>
    </div>
  )
}
