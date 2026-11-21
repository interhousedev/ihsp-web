"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import Link from "next/link"
import { FitRingButton } from "../../fit/components/fit-ring-button"
import { RingLogo } from "../../fit/components/ring-logo"
import { usePatchEntry } from "../hooks"
import type { Institution, Round } from "../types"
import type { ListRow } from "../use-list-rows"
import { useWorkflow } from "../../../lib/config"
import { AddToListButton } from "./add-to-list-button"
import { VerifiedBadge } from "./fact-source"
import { InstitutionAskSheet } from "./institution-ask-sheet"
import { useOptionLabel } from "./option-label"

/** «В списке · RD ▾»: the round of this university on my list, changed in place. */
function ListRound({ row }: { row: ListRow }) {
  const t = useT("chooser")
  const roundLabel = useOptionLabel("round")
  const workflow = useWorkflow()
  const patch = usePatchEntry()
  const { entry } = row
  return (
    <select
      aria-label={t("detail.roundFor", { name: entry.institution.name })}
      className="border-input bg-background focus-visible:ring-ring/50 h-9 min-w-0 rounded-lg border px-2.5 text-sm font-medium focus-visible:ring-[3px] focus-visible:outline-none"
      value={entry.round}
      disabled={patch.isPending}
      onChange={(event) =>
        patch.mutate({ id: entry.id, body: { lock_version: entry.lock_version, round: event.target.value as Round } })
      }
    >
      {workflow.rounds.map(({ id }) => (
        <option key={id} value={id}>
          {t("detail.inListRound", { round: roundLabel(id) })}
        </option>
      ))}
    </select>
  )
}

/**
 * The top of a university page: a way back, the logo (inside its fit ring once the university is on my list), name,
 * place, the list and round control and «Спросить ИИ». No cover band: a cover image is not part of this page.
 */
export function InstitutionHeader({
  institution,
  place,
  row,
}: {
  institution: Institution
  place: string
  row: ListRow | undefined
}) {
  const t = useT("chooser")
  const { name } = institution
  return (
    <header className="flex flex-col gap-3">
      <Link
        href={row ? "/chooser/?step=list" : "/chooser/?step=match&view=list"}
        className="text-muted-foreground hover:text-foreground inline-flex min-h-9 w-fit items-center gap-1 text-sm"
      >
        <Icons.chevronLeft aria-hidden className="size-4" />
        {t(row ? "detail.backList" : "detail.backCatalog")}
      </Link>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {row ? (
          <FitRingButton name={name} fit={row.fit} size={64}>
            <RingLogo name={name} src={institution.logo_url} />
          </FitRingButton>
        ) : (
          <div className="size-14 shrink-0">
            <RingLogo name={name} src={institution.logo_url} />
          </div>
        )}
        <div className="min-w-0 flex-1 basis-48">
          <h1 className="text-xl leading-tight font-semibold md:text-2xl">{name}</h1>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-sm">
            {place ? <span>{place}</span> : null}
            <VerifiedBadge verified={institution.verified} />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {row ? <ListRound row={row} /> : <AddToListButton institutionId={institution.id} />}
          <InstitutionAskSheet institutionId={institution.id} name={name} />
        </div>
      </div>
    </header>
  )
}
