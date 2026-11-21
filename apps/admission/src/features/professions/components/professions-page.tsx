"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Icons, ResponsiveDialog } from "@ihsp/ui"
import { useState } from "react"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useStudyFields } from "../../chooser/hooks"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { myProfessionsQuery, professionKeys, putMyProfessions, type MyProfession, type Profession } from "../api"
import { addPick, MAX_PICKS } from "../model"
import { careerPlanQuery } from "../../career/api"
import { CareerQuizButton } from "../../career/components/career-quiz-dialog"
import { FitImpact } from "./fit-impact"
import { IkigaiRow } from "./ikigai-row"
import { SuggestedRow } from "./suggested-row"
import { MyProfessions } from "./my-professions"
import { ProfessionSearch } from "./profession-search"

export function ProfessionsPage() {
  const t = useT("professions")
  const locale = useLocale()
  const client = useQueryClient()
  const [sheet, setSheet] = useState(false)
  const plan = useQuery(careerPlanQuery())
  const mine = useQuery(myProfessionsQuery(locale))
  const { groups } = useStudyFields()
  const labels = new Map(groups.flatMap((g) => g.items.map((i) => [i.id, i.label] as const)))
  const picks: MyProfession[] = [...(mine.data?.items ?? [])].sort((a, b) => a.rank - b.rank)
  const save = useMutation({
    mutationFn: (next: Profession[]) => putMyProfessions(next.map((p) => p.id), locale),
    // The list shows the choice at once; the server answer replaces it, a failure restores the stored one.
    onMutate: (next) => {
      client.setQueryData(professionKeys.mine(locale), { items: next.map((p, i) => ({ ...p, rank: i + 1 })) })
    },
    onSuccess: (data) => client.setQueryData(professionKeys.mine(locale), data),
    onError: () => void client.invalidateQueries({ queryKey: professionKeys.mine(locale) }),
    onSettled: () => void client.invalidateQueries({ queryKey: professionKeys.fit() }),
  })

  const add = (p: Profession) => {
    if (picks.some((x) => x.id === p.id) || picks.length >= MAX_PICKS) return
    const ids = addPick(picks.map((x) => x.id), p.id)
    if (ids.length > picks.length) save.mutate([...picks, p])
  }
  const ranking = (
    <div className="flex flex-col gap-3">
      <MyProfessions
        picks={picks}
        saving={save.isPending}
        error={save.isError}
        onReorder={(next) => save.mutate(next)}
        onRemove={(id) => save.mutate(picks.filter((p) => p.id !== id))}
      />
      <FitImpact picks={picks.length} />
    </div>
  )
  return (
    <AdmissionShell>
      <div className={pageClass("gap-3 md:gap-3.5")}>
        <AppPageHeader icon="user2" title={t("title")} meta={t("subtitle")} />
        <section className="bg-card rounded-card flex min-w-0 flex-col gap-2.5 border p-3 md:px-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <IkigaiRow />
            <CareerQuizButton />
          </div>
          <SuggestedRow pickedIds={picks.map((p) => p.id)} pickedFull={picks.length >= MAX_PICKS} onAdd={add} />
        </section>
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section aria-labelledby="prof-browse" className="flex min-w-0 flex-col gap-2">
            <h2 id="prof-browse" className="text-base font-semibold">
              {t("step.browse.title")}
            </h2>
            <ProfessionSearch
              pickedIds={picks.map((p) => p.id)}
              full={picks.length >= MAX_PICKS}
              fieldIds={plan.data?.study_focus?.field_ids ?? []}
              fieldLabel={(key) => labels.get(key) ?? key}
              onAdd={add}
            />
          </section>
          <section aria-labelledby="prof-mine" className="hidden min-w-0 flex-col gap-2 lg:sticky lg:top-3 lg:flex">
            <h2 id="prof-mine" className="text-base font-semibold">
              {t("step.mine.title")}
            </h2>
            <p className="text-muted-foreground -mt-1 text-xs">{t("step.mine.hint", { max: MAX_PICKS })}</p>
            {ranking}
          </section>
        </div>
      </div>
      <div className="bg-background/95 fixed inset-x-0 bottom-[calc(var(--safe-bottom)+4.75rem)] z-20 border-t px-4 py-2 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="focus-visible:ring-ring flex min-h-11 w-full items-center justify-between gap-2 rounded-xl text-sm font-semibold outline-none focus-visible:ring-2"
        >
          {t("mine.bar", { n: picks.length, max: MAX_PICKS })}
          <Icons.chevronUp aria-hidden className="size-4" />
        </button>
      </div>
      <ResponsiveDialog open={sheet} onOpenChange={setSheet} title={t("step.mine.title")} description={t("step.mine.hint", { max: MAX_PICKS })} size="md">
        {ranking}
      </ResponsiveDialog>
    </AdmissionShell>
  )
}
