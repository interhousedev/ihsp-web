"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Textarea } from "@ihsp/ui"
import Link from "next/link"
import { useEffect, useState } from "react"
import { FeeDetails } from "../../budget/components/fee-details"
import type { BudgetRow } from "../../budget/types"
import { usePatchEntry, useRemoveEntry } from "../hooks"
import type { ListEntry } from "../types"
import { AffordabilityPanel } from "./affordability-panel"
import { EstimateView } from "./estimate-view"

/** Where an entry leads besides its university page: the essays and the documents of this university. */
const ENTRY_LINKS = [
  { key: "university", href: (e: ListEntry) => `/chooser/institution/?id=${encodeURIComponent(e.institution.id)}` },
  { key: "essays", href: (e: ListEntry) => `/essays/?tab=colleges&entry=${encodeURIComponent(e.id)}` },
  { key: "documents", href: (e: ListEntry) => `/documents/?entry=${encodeURIComponent(e.id)}` },
] as const

/**
 * What is behind a table row: the links, the student's own label, notes, the money (fee, aid forms, aid facts), the
 * estimate and the affordability check, and the way to take the university off the list.
 */
export function EntryDetails({ entry, budget }: { entry: ListEntry; budget: BudgetRow | undefined }) {
  const t = useT("chooser")
  const patch = usePatchEntry()
  const remove = useRemoveEntry()
  const [notes, setNotes] = useState(entry.notes ?? "")
  // Follow the server's value after a reload or another change instead of keeping a stale draft.
  useEffect(() => setNotes(entry.notes ?? ""), [entry.notes, entry.lock_version])
  const change = (body: { notes?: string }) =>
    patch.mutate({ id: entry.id, body: { lock_version: entry.lock_version, ...body } })
  return (
    <div className="bg-muted/40 flex flex-col gap-4 rounded-lg p-3 md:p-4">
      <nav aria-label={t("list.links.label", { name: entry.institution.name })} className="border-hairline flex flex-wrap gap-x-4 border-b">
        {ENTRY_LINKS.map(({ key, href }) => (
          <Link
            key={key}
            href={href(entry)}
            className="text-primary hover:border-primary -mb-px inline-flex min-h-11 items-center border-b-2 border-transparent px-1 text-sm font-medium md:min-h-9"
          >
            {t(`list.links.${key}`)}
          </Link>
        ))}
      </nav>
      <Textarea
        aria-label={t("list.notes")}
        placeholder={t("list.notes")}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        onBlur={() => notes !== (entry.notes ?? "") && change({ notes })}
      />
      {budget ? <FeeDetails row={budget} /> : null}
      <EstimateView estimate={entry.estimate} />
      <AffordabilityPanel entry={entry} />
      <Button
        type="button"
        variant="ghost"
        className="text-destructive w-fit"
        disabled={remove.isPending}
        onClick={() => remove.mutate(entry.id)}
      >
        <Icons.trash aria-hidden />
        {t("list.remove", { name: entry.institution.name })}
      </Button>
    </div>
  )
}
