"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton } from "@ihsp/ui"
import type { WorkspaceLayout } from "./use-workspace-layout"

function PaneSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <Skeleton className="h-6 w-1/3" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  )
}

/** The workspace while the notebook loads: the header bar and the panes of the current layout, as grey blocks. */
export function WorkspaceSkeleton({ layout }: { layout: WorkspaceLayout }) {
  const t = useT("state")
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t("loadingTitle")}
      className="flex h-[calc(100dvh-3.5rem-var(--safe-top))] min-h-0 flex-col"
    >
      <div className="flex h-14 shrink-0 items-center gap-3 border-b px-3">
        <Skeleton className="size-9 rounded-lg" />
        <Skeleton className="size-9 rounded-lg" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="flex min-h-0 flex-1">
        {layout === "desktop" ? (
          <>
            <div className="flex w-80 shrink-0 flex-col border-e">
              <PaneSkeleton rows={4} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <PaneSkeleton rows={3} />
            </div>
            <div className="flex w-[22.5rem] shrink-0 flex-col border-s">
              <PaneSkeleton rows={4} />
            </div>
          </>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col">
            <PaneSkeleton rows={4} />
          </div>
        )}
      </div>
      {layout === "phone" ? <Skeleton className="h-14 shrink-0 rounded-none" /> : null}
    </div>
  )
}
