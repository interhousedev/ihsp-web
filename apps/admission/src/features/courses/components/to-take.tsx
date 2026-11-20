"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Icons, Pill, Skeleton, StateView, buttonVariants } from "@ihsp/ui"
import Link from "next/link"
import { useMemo } from "react"
import { toast } from "sonner"
import { ScrollFade } from "@/components/scroll-fade"
import { useOpportunities, usePlan, useRemoveFromPlan, useSaveToPlan, type Opportunity } from "../../opportunities/api"
import { OpportunityCard, SaveButton } from "../../opportunities/components/opportunity-card"

const DELIVERIES = ["local", "external"] as const

/** Courses and certifications worth taking, apart from events (Ideas) and the academic list above. */
export function ToTake() {
  const t = useT("courses")
  const errorMessage = useErrorMessage()
  const courses = useOpportunities({ kind: "course", sort: "relevance" })
  const certs = useOpportunities({ kind: "certification", sort: "relevance" })
  const plan = usePlan()
  const save = useSaveToPlan()
  const remove = useRemoveFromPlan()
  const saved = useMemo(() => new Set(plan.data?.entries.map((e) => e.opportunity_id)), [plan.data])
  const onError = (error: unknown) => toast.error(errorMessage(error))
  const pending = courses.isPending || certs.isPending
  const items: Opportunity[] = [...(courses.data?.items ?? []), ...(certs.data?.items ?? [])]

  function card(item: Opportunity) {
    return (
      <OpportunityCard
        key={item.id}
        item={item}
        action={
          <SaveButton
            saved={saved.has(item.id)}
            busy={save.isPending || remove.isPending}
            onClick={() =>
              saved.has(item.id)
                ? remove.mutate(item.id, { onError })
                : save.mutate({ id: item.id, planned_grade: item.fields.grades?.[0] ?? null }, { onError })
            }
          />
        }
      />
    )
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="courses-to-take">
      <div>
        <h2 id="courses-to-take" className="text-lg font-semibold">
          {t("toTake.title")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("toTake.hint")}</p>
      </div>
      {pending ? (
        <Skeleton className="h-40 w-full" />
      ) : courses.isError || certs.isError ? (
        <StateView
          state="error"
          onRetry={() => {
            void courses.refetch()
            void certs.refetch()
          }}
        />
      ) : (
        DELIVERIES.map((delivery) => {
          const group = items.filter((o) => o.delivery === delivery)
          return (
            <div key={delivery} className="flex flex-col gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                {t(`toTake.${delivery}`)}
                <Pill>{group.length}</Pill>
              </h3>
              <p className="text-muted-foreground text-xs">{t(`toTake.${delivery}Hint`)}</p>
              {group.length === 0 ? (
                <p className="text-muted-foreground rounded-card border border-dashed p-3 text-sm">
                  {t(`toTake.${delivery}Empty`)}
                </p>
              ) : (
                <ScrollFade className="max-h-[22rem] lg:max-h-[15rem]">
                  <ul className="grid gap-3 p-1 md:grid-cols-2">{group.map(card)}</ul>
                </ScrollFade>
              )}
            </div>
          )
        })
      )}
    </section>
  )
}

/** Where events and competitions live: they are not courses, so they stay in Ideas. */
export function EventsPointer() {
  const t = useT("courses")
  return (
    <section className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-card border p-4">
      <div className="min-w-0 flex-1 basis-60">
        <h2 className="flex items-center gap-2 font-semibold">
          <Icons.calendarEvent aria-hidden className="size-4" />
          {t("events.title")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("events.text")}</p>
      </div>
      <Link href="/opportunities/?kind=event" className={buttonVariants({ variant: "outline" })}>
        {t("events.cta")}
      </Link>
    </section>
  )
}
