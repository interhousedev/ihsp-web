"use client"

import { TeacherAvatar } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Icons, Skeleton } from "@ihsp/ui"
import { useState } from "react"
import { useScrolled } from "../../today/dashboard/use-scrolled"
import { StudentCardSheet } from "../../student-card/components/student-card-sheet"
import { useHomeStudent } from "../hooks/use-home-student"
import { HomeStatTiles } from "./home-stat-tiles"

const SQUARE_BUTTON =
  "bg-card text-primary focus-visible:ring-ring relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm outline-none focus-visible:ring-2"

function HeaderButtons({ onOpenCard }: { onOpenCard: () => void }) {
  const t = useT("home")
  return (
    <button type="button" className={SQUARE_BUTTON} aria-label={t("studentCard")} onClick={onOpenCard}>
      <Icons.qrCode className="size-5" aria-hidden />
    </button>
  )
}

/**
 * The brand-coloured top of Home: avatar, name, `group | N-course`, the student card and notification buttons and the
 * three stat tiles. It scrolls away with the page; once it is out of view an opaque compact bar (name and buttons) sticks
 * to the top. The bar is a zero-height sticky anchor with an absolutely placed, opaque bar, so showing it never moves
 * the content and nothing shows through it. It keeps its end clear of the shell's floating controls.
 */
export function HomeHeader() {
  const student = useHomeStudent()
  const compact = useScrolled(24)
  const [open, setOpen] = useState(false)
  const openCard = () => setOpen(true)

  return (
    <>
      <div className="sticky top-0 z-20 h-0">
        <div
          data-testid="home-compact-bar"
          data-compact={compact}
          aria-hidden={!compact}
          inert={!compact}
          className={`bg-primary text-primary-foreground absolute inset-x-0 top-0 flex h-[calc(var(--safe-top,0px)+3.5rem)] items-center gap-2 rounded-b-2xl px-4 pt-(--safe-top,0px) shadow-md transition-transform duration-200 motion-reduce:transition-none ${
            compact ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <p className="min-w-0 flex-1 truncate text-base font-semibold">{student.name}</p>
          <HeaderButtons onOpenCard={openCard} />
          <span aria-hidden className="w-(--shell-controls-width,0px) shrink-0" />
        </div>
      </div>
      <header
        data-testid="home-header"
        className="bg-primary text-primary-foreground flex flex-col gap-4 rounded-b-3xl px-4 pt-(--shell-top-reserve) pb-5"
      >
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
          <TeacherAvatar name={student.name} photoUrl={student.photoUrl} size="lg" decorative />
          <div className="flex min-w-0 flex-1 flex-col">
            {student.pending ? (
              <>
                <Skeleton className="h-6 w-40 max-w-full" />
                <Skeleton className="mt-1 h-4 w-28" />
              </>
            ) : (
              <>
                <h1 className="line-clamp-2 text-lg leading-tight font-semibold break-words">{student.name}</h1>
                {student.line ? <p className="truncate text-sm opacity-90">{student.line}</p> : null}
              </>
            )}
          </div>
          <HeaderButtons onOpenCard={openCard} />
        </div>
        <div className="mx-auto w-full max-w-4xl">
          <HomeStatTiles />
        </div>
      </header>
      <StudentCardSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
