"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@ihsp/ui"
import { useState, type ReactNode } from "react"
import { CloseDrawerContext } from "./drawer-context"
import { LearnerTopBar } from "./learner-topbar"

/**
 * The full-screen layout of the lesson player, copied from Stepik: a dark top bar over a dark course sidebar and the
 * lesson. Below the `lg` breakpoint the sidebar is a drawer opened from the top bar; a lesson chosen in the drawer
 * closes it (`useCloseDrawer`).
 */
export function LearnerFrame({
  strip,
  sidebar,
  children,
}: {
  strip: ReactNode
  sidebar: ReactNode
  children: ReactNode
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  return (
    <div className="lms-stepik bg-background text-foreground flex h-dvh flex-col">
      <LearnerTopBar strip={strip} onOpenContents={() => setOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <aside className="lms-chrome hidden w-64 shrink-0 lg:block">{sidebar}</aside>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="lms-stepik lms-chrome w-4/5 max-w-sm gap-0 border-0 bg-(--stepik-sidebar) p-0"
        >
          <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/10 ps-4 pe-1">
            <SheetTitle className="text-base font-semibold text-white">{t("player.contents")}</SheetTitle>
            <SheetClose render={<Button variant="ghost" className="size-11" aria-label={t("common.close")} />}>
              <Icons.close aria-hidden className="size-5" />
            </SheetClose>
          </div>
          <SheetDescription className="sr-only">{t("player.contents")}</SheetDescription>
          <CloseDrawerContext value={() => setOpen(false)}>
            <div className="min-h-0 flex-1">{sidebar}</div>
          </CloseDrawerContext>
        </SheetContent>
      </Sheet>
    </div>
  )
}
