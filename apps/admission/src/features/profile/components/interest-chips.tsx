"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Pill, Skeleton } from "@ihsp/ui"
import { ChipsField, type StepQuestion } from "../../../components/stepper"
import { INTEREST_FIELDS, SERVICE_INTERESTS, useProfileDetails, useSaveInterests } from "../details-api"

type Kind = "fields" | "services"

/**
 * Fields of interest (or service interests) as toggle chips. Every toggle is saved at once with
 * PUT /me/profile/interests (which replaces both lists, so the other list is sent along) and shows "Autosaved".
 */
export function InterestChips({ kind = "fields" }: { kind?: Kind }) {
  const t = useT("profilePage")
  const details = useProfileDetails()
  const save = useSaveInterests()
  const interests = details.data?.interests

  if (details.isError) {
    return (
      <Button type="button" variant="outline" onClick={() => void details.refetch()}>
        {t("retry")}
      </Button>
    )
  }
  if (!interests) return <Skeleton className="h-24 w-full" />

  const vocabulary = kind === "fields" ? INTEREST_FIELDS : SERVICE_INTERESTS
  const question: StepQuestion = {
    id: kind,
    section: "interests",
    sectionLabel: t(`interests.${kind}`),
    title: t(`interests.${kind}`),
    kind: "multi",
    options: vocabulary.map((key) => ({ value: key, label: t(`${kind === "fields" ? "field" : "service"}.${key}`) })),
  }
  const picked = save.isPending && save.variables ? save.variables[kind] : interests[kind]

  function change(value: unknown) {
    const next = Array.isArray(value) ? (value as string[]) : []
    save.mutate({ ...interests!, [kind]: next })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-6 items-center gap-3 text-sm">
        <span className="text-muted-foreground tabular-nums">{t("selected", { count: picked.length })}</span>
        <span role="status" aria-live="polite">
          {save.isPending ? <Pill>{t("saving")}</Pill> : null}
          {save.isSuccess && !save.isPending ? (
            <Pill tone="success">
              <Icons.check className="size-3" aria-hidden />
              {t("autosaved")}
            </Pill>
          ) : null}
          {save.isError ? <Pill tone="danger">{t("notSaved")}</Pill> : null}
        </span>
      </div>
      <ChipsField question={question} value={picked} onChange={change} />
    </div>
  )
}
