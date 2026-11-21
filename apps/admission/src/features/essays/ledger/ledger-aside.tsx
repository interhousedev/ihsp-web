"use client"

import { useT } from "@ihsp/i18n"
import { Button, buttonVariants, cn, Icons, Pill, Skeleton } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { useExemplars, useIdeas } from "../api"
import { usePracticeToday } from "../flow/api"
import { useGallery } from "../flow/steps-api"

function AsideCard({
  icon,
  title,
  action,
  children,
  className,
  testId,
}: {
  icon: ReactNode
  title: string
  action: ReactNode
  children: ReactNode
  className?: string
  testId: string
}) {
  return (
    <section data-testid={testId} className={cn("bg-card rounded-card flex min-w-0 flex-col gap-2 border p-3 md:p-4", className)}>
      <header className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">{icon}</span>
        <h2 className="min-w-[8rem] flex-1 text-sm leading-tight font-semibold break-words">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

/** The sum of the four practice criteria, out of 20; null while today is not evaluated. */
export function practiceTotal(scores: { score: number }[] | undefined): number | null {
  return scores && scores.length > 0 ? scores.reduce((n, s) => n + s.score, 0) : null
}

/** Today's writing practice: the theme, the streak, the total and the link to the practice page. */
export function PracticeCard() {
  const t = useT("essayLedger")
  const query = usePracticeToday()
  const today = query.data
  const written = (today?.entry?.word_count ?? 0) > 0
  const total = practiceTotal(today?.entry?.evaluation?.scores)
  return (
    <AsideCard
      testId="practice-card"
      icon={<Icons.today aria-hidden className="size-4" />}
      title={t("practiceTitle")}
      action={
        <Link href="/essays/practice/" className={buttonVariants({ size: "sm", variant: written ? "outline" : "default" })}>
          {t(written ? "practiceOpen" : "practiceWrite")}
        </Link>
      }
    >
      {query.isPending ? (
        <Skeleton className="h-10 w-full" />
      ) : today ? (
        <>
          <p className="text-sm">
            <span className="font-medium">{today.theme}</span>
            <span className="text-muted-foreground"> · {today.prompt}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={today.streak > 0 ? "primary" : "neutral"}>{t("streak", { count: today.streak })}</Pill>
            <Pill tone={total !== null ? "success" : written ? "warning" : "neutral"}>
              {total !== null ? t("practiceScore", { total }) : t(written ? "practiceWritten" : "practiceTodo")}
            </Pill>
          </div>
        </>
      ) : null}
    </AsideCard>
  )
}

/** The idea bank in one line: how many ideas and the newest two. */
export function IdeasCard({ onOpen }: { onOpen: () => void }) {
  const t = useT("essayLedger")
  const query = useIdeas()
  const ideas = (query.data?.items ?? []).filter((i) => i.status !== "drop")
  return (
    <AsideCard
      testId="ideas-card"
      icon={<Icons.sparkles aria-hidden className="size-4" />}
      title={t("ideasTitle", { count: ideas.length })}
      action={
        <Button type="button" size="sm" variant="outline" onClick={onOpen}>
          {t(ideas.length ? "ideasOpen" : "ideasAdd")}
        </Button>
      }
    >
      {query.isPending ? (
        <Skeleton className="h-8 w-full" />
      ) : ideas.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("ideasEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {ideas.slice(0, 2).map((i) => (
            <li key={i.id} className="text-muted-foreground line-clamp-1 text-sm">
              {i.body}
            </li>
          ))}
        </ul>
      )}
    </AsideCard>
  )
}

/** Examples in one line: admitted essays from the staff library and what lyceum peers shared. */
export function ExamplesCard({ onOpen }: { onOpen: () => void }) {
  const t = useT("essayLedger")
  const exemplars = useExemplars(null)
  const gallery = useGallery()
  const admitted = exemplars.data?.total ?? 0
  const peers = gallery.data?.items.length ?? 0
  return (
    <AsideCard
      testId="examples-card"
      icon={<Icons.library aria-hidden className="size-4" />}
      title={t("examplesTitle")}
      action={
        <Button type="button" size="sm" variant="outline" onClick={onOpen}>
          {t("examplesOpen")}
        </Button>
      }
    >
      {exemplars.isPending || gallery.isPending ? (
        <Skeleton className="h-6 w-full" />
      ) : (
        <p className="text-muted-foreground text-sm">{t("examplesCounts", { admitted, peers })}</p>
      )}
    </AsideCard>
  )
}
