"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useStudyFields } from "../../chooser/hooks"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { myProfessionsQuery, professionKeys, putMyProfessions, type MyProfession, type Profession } from "../api"
import { addPick, MAX_PICKS } from "../model"
import { FitImpact } from "./fit-impact"
import { IkigaiStep } from "./ikigai-step"
import { MyProfessions } from "./my-professions"
import { ProfessionSearch } from "./profession-search"

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`prof-step-${n}`} className="flex min-w-0 flex-col gap-3">
      <div className="flex items-start gap-3">
        <span aria-hidden className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
          {n}
        </span>
        <div>
          <h2 id={`prof-step-${n}`} className="text-lg font-semibold leading-7">
            {title}
          </h2>
          {hint ? <p className="text-muted-foreground text-sm">{hint}</p> : null}
        </div>
      </div>
      {children}
    </section>
  )
}

export function ProfessionsPage() {
  const t = useT("professions")
  const locale = useLocale()
  const client = useQueryClient()
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
  return (
    <AdmissionShell>
      <div className={pageClass("gap-8 md:gap-10")}>
        <AppPageHeader icon="user2" title={t("title")} meta={t("subtitle")} />
        <Step n={1} title={t("step.ikigai.title")} hint={t("step.ikigai.hint")}>
          <IkigaiStep />
        </Step>
        <Step n={2} title={t("step.browse.title")} hint={t("step.browse.hint")}>
          <ProfessionSearch
            pickedIds={picks.map((p) => p.id)}
            full={picks.length >= MAX_PICKS}
            fieldLabel={(key) => labels.get(key) ?? key}
            onAdd={add}
          />
        </Step>
        <Step n={3} title={t("step.mine.title")} hint={t("step.mine.hint", { max: MAX_PICKS })}>
          <MyProfessions
            picks={picks}
            saving={save.isPending}
            error={save.isError}
            onReorder={(next) => save.mutate(next)}
            onRemove={(id) => save.mutate(picks.filter((p) => p.id !== id))}
          />
        </Step>
        <Step n={4} title={t("step.fit.title")}>
          <FitImpact picks={picks.length} />
        </Step>
      </div>
    </AdmissionShell>
  )
}
