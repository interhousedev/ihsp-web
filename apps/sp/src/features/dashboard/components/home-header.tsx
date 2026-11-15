"use client"

import { TeacherAvatar } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import Link from "next/link"
import { useScrolled } from "../../today/dashboard/use-scrolled"
import { useHomeStudent } from "../hooks/use-home-student"

const PROFILE_HREF = "/profile/"
const LINK_RING = "focus-visible:ring-ring rounded-full outline-none focus-visible:ring-2"

/**
 * The brand-coloured top of Home: just the student's face, a link to the profile. It scrolls away with the page; once
 * it is out of view an opaque compact bar (small face and name, one link to the profile) sticks to the top. The bar is a
 * zero-height sticky anchor with an absolutely placed, opaque bar, so showing it never moves the content and nothing
 * shows through it. It keeps its end clear of the shell's floating controls.
 */
export function HomeHeader() {
  const t = useT("home")
  const student = useHomeStudent()
  const compact = useScrolled(24)

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
          {/* Below md the shell's floating controls sit centred: only the face, on the start side, keeps the centre clear. */}
          <Link
            href={PROFILE_HREF}
            aria-label={t("openProfile")}
            className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-current md:flex-1"
          >
            <TeacherAvatar name={student.name} photoUrl={student.photoUrl} size="default" decorative />
            <span className="hidden min-w-0 flex-1 truncate text-base font-semibold md:block">{student.name}</span>
          </Link>
          <span aria-hidden className="hidden w-(--shell-controls-width,0px) shrink-0 md:block" />
        </div>
      </div>
      <header
        data-testid="home-header"
        className="bg-primary text-primary-foreground flex justify-center rounded-b-3xl px-4 pt-(--shell-top-reserve) pb-5"
      >
        <Link href={PROFILE_HREF} aria-label={t("openProfile")} className={LINK_RING}>
          <TeacherAvatar name={student.name} photoUrl={student.photoUrl} size="lg" decorative />
        </Link>
      </header>
    </>
  )
}
