"use client"

import { TeacherAvatar } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import Link from "next/link"
import { useSession, hasRole } from "@ihsp/auth"
import { StudentCardButton } from "../../student-card/components/student-card-button"
import { useScrolled } from "../../today/dashboard/use-scrolled"
import { useHomeHeroObserver } from "../hooks/use-home-hero"
import { useHomeStudent } from "../hooks/use-home-student"
import { useRef } from "react"

const PROFILE_HREF = "/profile/"

/**
 * The brand-coloured top of Home: the student's photo and full name (one link to the profile), on a gradient of the theme's brand tokens with depth. It scrolls away with the page; once
 * it is out of view an opaque compact bar (small face and name, one link to the profile) sticks to the top. The bar is a
 * zero-height sticky anchor with an absolutely placed, opaque bar, so showing it never moves the content and nothing
 * shows through it. It keeps its end clear of the shell's floating controls.
 */
export function HomeHeader() {
  const t = useT("home")
  const student = useHomeStudent()
  const { session } = useSession()
  const isStudent = hasRole(session?.user.roles, "student")
  const heroRef = useRef<HTMLElement>(null)
  const heroGone = useHomeHeroObserver(heroRef)
  const scrolled = useScrolled(24)
  const compact = heroGone ?? scrolled
  const profileLabel = student.name ? t("openProfileNamed", { name: student.name }) : t("openProfile")

  return (
    <>
      {/* -mb-5 cancels the page's flex gap (gap-5) that would otherwise leave an empty strip above the header. */}
      <div className="sticky top-0 z-20 -mb-5 h-0">
        <div
          data-testid="home-compact-bar"
          data-compact={compact}
          aria-hidden={!compact}
          inert={!compact}
          className={`bg-(--brand-strong) text-(--brand-ink) absolute inset-x-0 top-0 flex h-[calc(var(--safe-top,0px)+3.5rem)] items-center gap-2 rounded-b-2xl px-4 pt-(--safe-top,0px) shadow-md transition-[translate,opacity] duration-200 motion-reduce:transition-none ${
            compact ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
          }`}
        >
          {/* Below md the shell's floating controls sit centred and already carry the face (hidden while the hero is
              on screen): the bar adds only the QR button of the student card, on the start side. */}
          {isStudent ? (
            <span className="md:hidden">
              <StudentCardButton iconOnly />
            </span>
          ) : null}
          <Link
            href={PROFILE_HREF}
            aria-label={profileLabel}
            className="hidden min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-current md:flex"
          >
            <TeacherAvatar name={student.name} photoUrl={student.photoUrl} size="default" decorative />
            <span className="min-w-0 flex-1 truncate text-base font-semibold">{student.name}</span>
          </Link>
          <span aria-hidden className="hidden w-(--shell-controls-width,0px) shrink-0 md:block" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
        <header
          ref={heroRef}
          data-testid="home-header"
          className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--brand-strong),var(--brand))] text-(--brand-ink) p-5 shadow-lg md:p-6"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -end-10 -top-16 size-56 rounded-full bg-[radial-gradient(circle,rgb(255_255_255/0.22),transparent_70%)]"
          />
          <Link
            href={PROFILE_HREF}
            aria-label={profileLabel}
            className="relative mx-auto flex min-h-11 w-full max-w-4xl items-center gap-4 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            <TeacherAvatar
              name={student.name}
              photoUrl={student.photoUrl}
              size="lg"
              decorative
              className="shadow-md ring-2 ring-white/60"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span data-testid="home-header-name" className="text-xl leading-tight font-semibold break-words">
                {student.name}
              </span>
              {student.line ? <span className="truncate text-sm">{student.line}</span> : null}
            </span>
          </Link>
          {isStudent ? (
            <div className="relative mx-auto mt-3 flex w-full max-w-4xl">
              <StudentCardButton onHero />
            </div>
          ) : null}
        </header>
      </div>
    </>
  )
}
