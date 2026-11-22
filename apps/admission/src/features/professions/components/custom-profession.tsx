"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { fillCustomProfession, type Profession } from "../api"
import { ExposureNote, ProfessionCard } from "./profession-card"

/**
 * 'Add “<query>” as my profession' under a search with no good match. The model fills the card, the student
 * confirms it (Add) or throws it away; nothing is picked before that.
 */
export function CustomProfession({
  query,
  full,
  fieldLabel,
  onAdd,
  hideHint = false,
}: {
  query: string
  full: boolean
  fieldLabel: (key: string) => string
  onAdd: (profession: Profession) => void
  /** The caller already explains what to type (the add-another-profession panel). */
  hideHint?: boolean
}) {
  const t = useT("professions")
  const locale = useLocale()
  const fill = useMutation({ mutationFn: (title: string) => fillCustomProfession(title, locale) })
  const card = fill.data
  if (card) {
    return (
      <section aria-label={t("custom.badge")} className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs">{t("custom.confirm")}</p>
        <ul>
          <ProfessionCard
            profession={card}
            picked={false}
            full={full}
            fieldLabel={fieldLabel}
            onAdd={() => {
              onAdd(card)
              fill.reset()
            }}
          />
        </ul>
        <ExposureNote profession={card} />
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => fill.reset()}>
          {t("custom.discard")}
        </Button>
      </section>
    )
  }
  return (
    <div className="flex flex-col items-start gap-1.5">
      {hideHint ? null : <p className="text-muted-foreground text-xs">{t("search.addCustomHint")}</p>}
      <Button
        type="button"
        variant="outline"
        className="h-auto min-h-11 max-w-full text-start whitespace-normal"
        disabled={fill.isPending}
        onClick={() => fill.mutate(query)}
      >
        <Icons.sparkles aria-hidden />
        {fill.isPending ? t("search.filling") : t("search.addCustom", { query })}
      </Button>
      {fill.isError ? (
        <p role="alert" className="text-destructive text-xs">
          {t("search.fillError")}
        </p>
      ) : null}
    </div>
  )
}
