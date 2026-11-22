"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icons,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@ihsp/ui"
import type { ReactNode } from "react"

export const DOCK_TABS = ["read", "plan", "versions"] as const
export const DOCK_MORE = ["examples", "ideas", "comments"] as const
export type DockTab = (typeof DOCK_TABS)[number]
export type DockMore = (typeof DOCK_MORE)[number]
/** `review` is the detailed per-university review: it opens from the Read tab and has a back button. */
export type DockView = DockTab | DockMore | "review"

export const isDockView = (value: string | null): value is DockView =>
  value !== null && ([...DOCK_TABS, ...DOCK_MORE, "review"] as readonly string[]).includes(value)

const isMore = (view: DockView): view is DockMore => (DOCK_MORE as readonly string[]).includes(view)

/** The one tab row of the panel: exactly one entry is active, "More" holds the rest and shows the one that is open. */
function TabStrip({
  view,
  onView,
  className,
}: {
  view: DockView
  onView: (view: DockView) => void
  className?: string
}) {
  const t = useT("essayEditor")
  const active = view === "review" ? "read" : isMore(view) ? "more" : view
  return (
    <Tabs value={active} onValueChange={(next) => onView(next as DockTab)} className={className}>
      <TabsList aria-label={t("tabsLabel")} className="w-full">
        {DOCK_TABS.map((key) => (
          <TabsTrigger key={key} value={key} className="min-w-0 flex-1 px-2 font-medium">
            {t(`tab.${key}`)}
          </TabsTrigger>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger
            data-testid="dock-more"
            aria-label={t("tab.more")}
            className={cn(
              "press relative inline-flex h-full min-h-7 min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-sm font-medium whitespace-nowrap",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
              active === "more"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground",
            )}
          >
            <span className="truncate">{isMore(view) ? t(`tab.${view}`) : t("tab.more")}</span>
            <Icons.chevronDown aria-hidden className="size-3.5 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {DOCK_MORE.map((key) => (
              <DropdownMenuItem key={key} onClick={() => onView(key)}>
                {t(`tab.${key}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TabsList>
    </Tabs>
  )
}

/**
 * The side of the editor. One tab row (Разбор, Вузы, План, Версии, Ещё) switches the panel; the buttons of the top bar
 * select the matching tab. From 768 up it sits beside the text and scrolls inside; on a phone the same row floats above
 * the bottom navigation and opens the panes in a bottom drawer.
 */
export function Dock({
  split,
  view,
  onView,
  onClose,
  title,
  panes,
}: {
  split: boolean
  view: DockView | null
  onView: (view: DockView) => void
  onClose: () => void
  title: string
  panes: Record<DockView, ReactNode>
}) {
  const t = useT("essayEditor")
  const current: DockView = view ?? "read"
  const body = (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <TabStrip view={current} onView={onView} />
      {current === "review" ? (
        <div className="flex items-center gap-1">
          <Button type="button" size="sm" variant="ghost" onClick={() => onView("read")}>
            <Icons.chevronLeft aria-hidden />
            {t("tab.read")}
          </Button>
          <h2 className="min-w-0 flex-1 truncate font-medium">{title}</h2>
        </div>
      ) : null}
      <div
        className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1 [scrollbar-gutter:stable]"
        data-testid={`dock-${current}`}
      >
        {panes[current]}
      </div>
    </div>
  )
  if (split)
    return (
      <aside
        aria-label={t("dockLabel")}
        className="bg-background border-hairline rounded-card flex h-full min-h-0 w-[22rem] shrink-0 flex-col border p-3 lg:w-[26rem]"
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
        <TabStrip view={view ?? "read"} onView={onView} />
      </nav>
      <Sheet open={view !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="flex data-[side=bottom]:h-[78dvh] flex-col gap-3 p-3"
        >
          <div aria-hidden className="bg-muted-foreground/40 mx-auto h-1 w-10 shrink-0 rounded-full" />
          <SheetHeader className="sr-only">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    </>
  )
}
