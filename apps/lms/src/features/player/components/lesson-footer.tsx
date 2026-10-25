"use client"

import { useT } from "@ihsp/i18n"
import { Icons, buttonVariants, cn } from "@ihsp/ui"
import Link from "next/link"
import { LinkButton } from "../../shared/components/link-button"
import type { NavTarget } from "../utils/block-nav"

/**
 * The bar under the open step: "Previous" on the left and the green "Next step" on the right. Inside a lesson the buttons
 * walk its steps; at the ends they lead to the neighbour lessons, and after the last lesson "Finish" returns to the
 * course page.
 */
export function LessonFooter({
  previous,
  next,
  hrefFor,
  finishHref,
}: {
  previous: NavTarget | null
  next: NavTarget | null
  hrefFor: (target: NavTarget) => string
  finishHref: string
}) {
  const t = useT("player")
  return (
    <nav
      aria-label={t("lessonNavigation")}
      className="bg-muted/40 flex items-center justify-between gap-3 border-t px-4 py-3 md:px-6"
    >
      {previous ? (
        <LinkButton href={hrefFor(previous)} rel="prev" variant="outline" className="min-h-11 md:min-h-9">
          <Icons.chevronLeft aria-hidden />
          {t("previous")}
        </LinkButton>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={hrefFor(next)}
          rel="next"
          className={cn(buttonVariants(), "min-h-11 px-5 text-sm font-semibold md:min-h-9")}
        >
          {next.kind === "step" ? t("nextStep") : t("nextLesson")}
          <Icons.chevronRight aria-hidden />
        </Link>
      ) : (
        <Link href={finishHref} className={cn(buttonVariants(), "min-h-11 px-5 text-sm font-semibold md:min-h-9")}>
          {t("finish")}
          <Icons.chevronRight aria-hidden />
        </Link>
      )}
    </nav>
  )
}
