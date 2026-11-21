"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn, Icons } from "@ihsp/ui"
import { useState } from "react"
import { DueText, LedgerRowButton } from "./ledger-row"
import type { LedgerSection } from "./ledger-model"

const SHOWN_OF_PERSONAL = 2

/** One essay type: a sticky header with the filled/needed count, then its rows; the header folds the section. */
export function LedgerSectionBlock({
  section,
  collapsed,
  onToggle,
  onOpen,
  forceOpen,
}: {
  section: LedgerSection
  collapsed: boolean
  onToggle: () => void
  onOpen: (key: string) => void
  /** A search is active: matches stay visible whatever was folded. */
  forceOpen: boolean
}) {
  const t = useT("essayLedger")
  const [more, setMore] = useState(false)
  const folded = collapsed && !forceOpen
  const limited = section.pickOne !== null && !more && !forceOpen
  const rows = limited ? section.rows.slice(0, SHOWN_OF_PERSONAL) : section.rows
  const hidden = section.rows.length - rows.length
  const done = section.filled >= section.needed
  return (
    <section data-testid={`ledger-section-${section.type}`} className="flex flex-col">
      <h2 className="bg-background sticky top-0 z-10 m-0">
        <button
          type="button"
          aria-expanded={!folded}
          onClick={onToggle}
          className="hover:bg-accent/40 focus-visible:ring-ring border-hairline flex w-full min-w-0 items-center gap-2 border-b px-2 py-2 text-left focus-visible:ring-2 focus-visible:outline-none md:px-3"
        >
          <Icons.chevronDown aria-hidden className={cn("text-muted-foreground size-4 shrink-0 transition-transform", folded && "-rotate-90")} />
          <span className="min-w-0 truncate text-xs font-semibold tracking-wide uppercase">{t(`type.${section.type}`)}</span>
          {section.pickOne !== null ? (
            <span className="text-muted-foreground hidden min-w-0 truncate text-xs font-normal normal-case sm:inline">· {t("pickOne", { count: section.pickOne })}</span>
          ) : null}
          {section.due && section.pickOne === null ? (
            <span className="text-muted-foreground ml-auto hidden text-xs font-normal sm:inline">
              <DueText due={section.due} />
            </span>
          ) : null}
          <span className={cn("ml-auto shrink-0 text-xs font-semibold tabular-nums", done ? "text-success" : "text-muted-foreground", section.due && section.pickOne === null && "sm:ml-3")}>
            {section.filled}/{section.needed}
          </span>
        </button>
      </h2>
      {folded ? null : (
        <ul className="flex flex-col py-1">
          {rows.map((row) => (
            <LedgerRowButton key={row.group.key} row={row} onOpen={() => onOpen(row.group.key)} />
          ))}
          {hidden > 0 || (more && section.pickOne !== null) ? (
            <li className="px-2 py-1 md:px-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => setMore((v) => !v)} className="text-muted-foreground h-8 px-2">
                {more ? t("showFewer") : t("showMore", { count: hidden })}
              </Button>
            </li>
          ) : null}
        </ul>
      )}
    </section>
  )
}
