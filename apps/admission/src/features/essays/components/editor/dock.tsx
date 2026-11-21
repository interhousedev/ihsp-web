"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Sheet, SheetContent, SheetHeader, SheetTitle, Tabs, TabsTrigger } from "@ihsp/ui"
import type { ReactNode } from "react"
import { ScrollTabsList } from "../scroll-tabs-list"

export const DOCK_TABS = ["read", "unis", "examples", "ideas"] as const
export type DockTab = (typeof DOCK_TABS)[number]
export type DockView = DockTab | "tools" | "comments" | "review"

const isTab = (view: DockView | null): view is DockTab => view !== null && (DOCK_TABS as readonly string[]).includes(view)

function TabStrip({ view, onView, className }: { view: DockView | null; onView: (view: DockView) => void; className?: string }) {
  const t = useT("essayEditor")
  return (
    <Tabs value={isTab(view) ? view : ""} onValueChange={(next) => onView(next as DockTab)} className={className}>
      <ScrollTabsList aria-label={t("tabsLabel")}>
        {DOCK_TABS.map((key) => (
          <TabsTrigger key={key} value={key} className="shrink-0 flex-1 font-medium">
            {t(`tab.${key}`)}
          </TabsTrigger>
        ))}
      </ScrollTabsList>
    </Tabs>
  )
}

/**
 * The side of the editor: Разбор | Вузы | Образцы | Идеи as tabs beside the text on a desktop; on a phone a tab bar
 * above the bottom navigation opens the same panes in a bottom drawer. Tools, comments and the detailed review are
 * views of the same dock reached from buttons, not tabs.
 */
export function Dock({
  wide,
  view,
  onView,
  onClose,
  title,
  panes,
}: {
  wide: boolean
  view: DockView | null
  onView: (view: DockView | null) => void
  onClose: () => void
  title: string
  panes: Record<DockView, ReactNode>
}) {
  const t = useT("essayEditor")
  const tc = useT("essays")
  const current = view ?? (wide ? "read" : null)
  const body = (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <TabStrip view={current} onView={onView} />
      {current && !isTab(current) ? (
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium">{title}</h2>
          <Button type="button" size="icon-sm" variant="ghost" aria-label={tc("editor.close")} onClick={() => onView("read")}>
            <Icons.close aria-hidden />
          </Button>
        </div>
      ) : null}
      <div className="min-w-0 flex-1 overflow-y-auto" data-testid={`dock-${current ?? "none"}`}>
        {current ? panes[current] : null}
      </div>
    </div>
  )
  if (wide)
    return (
      <aside
        aria-label={t("dockLabel")}
        className="bg-background border-hairline rounded-card sticky top-[calc(var(--safe-top,0px)+4.5rem)] flex max-h-[calc(100dvh-6rem)] w-[26rem] shrink-0 flex-col border p-3"
      >
        {body}
      </aside>
    )
  return (
    <>
      <nav
        aria-label={t("dockLabel")}
        className="glass border-hairline fixed inset-x-3 bottom-[calc(var(--safe-bottom,0px)+4.75rem)] z-20 rounded-full border p-1"
      >
        <TabStrip view={null} onView={onView} />
      </nav>
      <Sheet open={view !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
        <SheetContent side="bottom" className="flex data-[side=bottom]:h-[78dvh] flex-col gap-3 p-3">
          <SheetHeader className="sr-only">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    </>
  )
}
