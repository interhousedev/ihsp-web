"use client"

import { useT } from "@ihsp/i18n"
import { cn, Icons } from "@ihsp/ui"
import Link from "next/link"

const FIXED = ["my_day", "essay_idea"] as const
const ROTATING = ["five_senses", "overheard", "tomorrow", "thanks"] as const
const ROTATING_SHOWN = 2
const DAY_MS = 86_400_000

/** Prompt keys for a day: the two fixed ones, then two of the rest that change daily. */
export function creativeKeys(now = new Date()): string[] {
  const day = Math.floor(now.getTime() / DAY_MS)
  const first = day % ROTATING.length
  return [...FIXED, ...Array.from({ length: ROTATING_SHOWN }, (_, i) => ROTATING[(first + i) % ROTATING.length]!)]
}

/** Shown instead of the next-action card when every action is done or pushed back: a few writing prompts for the practice writer. */
export function CreativePractice({ className }: { className?: string }) {
  const t = useT("today")
  return (
    <section
      aria-label={t("creative.title")}
      className={cn("bg-card rounded-card flex min-w-0 flex-col gap-3 border p-3.5 md:p-5", className)}
    >
      <div>
        <h2 className="text-lg leading-tight font-semibold tracking-tight md:text-2xl">{t("creative.title")}</h2>
        <p className="text-muted-foreground text-sm">{t("creative.subtitle")}</p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {creativeKeys().map((key) => (
          <li key={key}>
            <Link
              href={`/essays/practice/?theme=${key}`}
              className="hover:bg-muted flex min-h-11 h-full min-w-0 items-start gap-2.5 rounded-lg border p-3"
            >
              <Icons.edit aria-hidden className="text-primary mt-0.5 size-4 shrink-0" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">{t(`creative.prompt.${key}.title`)}</span>
                <span className="text-muted-foreground text-xs">{t(`creative.prompt.${key}.text`)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
