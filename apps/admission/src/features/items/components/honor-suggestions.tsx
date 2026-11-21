"use client"

import { formatDate, useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { toast } from "sonner"
import {
  HONOR_CATEGORIES,
  useCreateItem,
  useDismissSuggestion,
  useHonorSuggestions,
  type HonorSuggestion,
  type Item,
} from "../api"

/** The honor fields a certificate prefills, as the create body. */
export function suggestionInput(s: HonorSuggestion) {
  return {
    kind: "honor" as const,
    status: "draft" as const,
    title: s.title,
    description: s.description,
    category: s.category,
    level: s.level,
    certificate_entry_id: s.entry_id,
  }
}

/** A horizontal row of certificates that can become honors: + creates a linked draft, the cross hides it. */
export function HonorSuggestionsRow() {
  const t = useT("items")
  const tc = useT("honorCategory")
  const errorMessage = useErrorMessage()
  const suggestions = useHonorSuggestions()
  const create = useCreateItem()
  const dismiss = useDismissSuggestion()
  const rows = suggestions.data?.suggested ?? []
  if (rows.length === 0) return null
  return (
    <section aria-label={t("suggestions.title")} className="flex flex-col gap-1.5">
      <h2 title={t("suggestions.hint")} className="flex items-center gap-2 text-sm font-medium">
        <Icons.certificates aria-hidden className="text-primary size-4" />
        {t("suggestions.title")}
      </h2>
      <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {rows.map((s) => (
          <li
            key={s.entry_id}
            className="border-hairline bg-card rounded-card flex w-72 shrink-0 snap-start items-center gap-1 border py-1 pr-1 pl-3"
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{s.title}</span>
              <span className="text-muted-foreground line-clamp-2 text-xs">
                {tc(s.category)}
                {s.issued_at ? ` · ${t("suggestions.issued", { date: formatDate(s.issued_at) })}` : ""}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("suggestions.add")}
              title={t("suggestions.add")}
              className="size-11 md:size-9"
              disabled={create.isPending}
              onClick={() =>
                create.mutate(suggestionInput(s), {
                  onSuccess: () => toast.success(t("suggestions.added", { name: s.name })),
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            >
              <Icons.add aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("suggestions.dismiss")}
              className="size-11 md:size-9"
              disabled={dismiss.isPending}
              onClick={() =>
                dismiss.mutate(s.entry_id, {
                  onSuccess: () => toast.message(t("suggestions.dismissed")),
                  onError: (error) => toast.error(errorMessage(error)),
                })
              }
            >
              <Icons.close aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Every certificate not yet used for an honor, dismissed ones included; picking one prefills the form. */
export function CertificatePicker({ onPick }: { onPick: (s: HonorSuggestion) => void }) {
  const t = useT("items")
  const tc = useT("honorCategory")
  const suggestions = useHonorSuggestions()
  const rows = suggestions.data?.available ?? []
  return (
    <section
      aria-label={t("suggestions.pickTitle")}
      className="border-hairline rounded-card flex flex-col gap-2 border p-3"
    >
      <h3 className="text-sm font-medium">{t("suggestions.pickTitle")}</h3>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("suggestions.pickEmpty")}</p>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">{t("suggestions.pickHint")}</p>
          <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
            {rows.map((s) => (
              <li key={s.entry_id}>
                <button
                  type="button"
                  className="hover:bg-muted/60 flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-sm"
                  onClick={() => onPick(s)}
                >
                  <span className="truncate">{s.title}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">{tc(s.category)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

/** Honors by category: how the profile reads. Ready honors count in full, drafts are shown faint. */
export function HonorDistribution({ items }: { items: Item[] }) {
  const t = useT("items")
  const tc = useT("honorCategory")
  const honors = items.filter((i) => i.kind === "honor")
  const known = new Set<string>(HONOR_CATEGORIES)
  const rows = [...HONOR_CATEGORIES, "other"]
    .filter((c, i, all) => all.indexOf(c) === i)
    .map((c) => ({
      category: c,
      ready: honors.filter((i) => i.status === "ready" && (known.has(i.category ?? "") ? i.category : "other") === c)
        .length,
      draft: honors.filter((i) => i.status === "draft" && (known.has(i.category ?? "") ? i.category : "other") === c)
        .length,
    }))
    .filter((r) => r.ready + r.draft > 0)
  const max = Math.max(1, ...rows.map((r) => r.ready + r.draft))
  return (
    <section
      aria-label={t("distribution.title")}
      className="border-hairline bg-card rounded-card flex flex-col gap-2 border px-4 py-3"
    >
      <h2 title={t("distribution.hint")} className="text-sm font-medium">
        {t("distribution.title")}
      </h2>
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("distribution.none")}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((r) => (
            <li key={r.category} className="grid grid-cols-[minmax(0,13rem)_1fr_auto] items-center gap-2 text-sm">
              <span className="break-words">{tc(r.category)}</span>
              <span className="bg-muted flex h-2.5 overflow-hidden rounded-full" aria-hidden>
                <span className="bg-primary h-full" style={{ width: `${(r.ready / max) * 100}%` }} />
                <span className="bg-primary/35 h-full" style={{ width: `${(r.draft / max) * 100}%` }} />
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {r.ready} {t("distribution.ready")}
                {r.draft ? ` · ${r.draft} ${t("distribution.draft")}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
