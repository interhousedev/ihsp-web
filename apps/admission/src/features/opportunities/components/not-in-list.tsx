"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, Input, LoadingButton } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { LOOKUP_MAX, useOpportunityLookup, type IntakeDraft } from "../api"

/**
 * "New opportunity / not in the list": one line (a link, or a name and an
 * organization) is researched; the student picks a similar catalog entry or
 * proposes the draft, which goes to moderation.
 */
export function NotInList({
  onPick,
  onPropose,
  busy = false,
  proposeLabel,
}: {
  onPick: (opportunityId: string) => void
  onPropose: (draft: IntakeDraft) => void
  busy?: boolean
  /** The button under the found draft; the default says the draft goes to the profile. */
  proposeLabel?: string
}) {
  const t = useT("opportunities")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const lookup = useOpportunityLookup()
  const [query, setQuery] = useState("")
  const result = lookup.data

  async function research() {
    try {
      await lookup.mutateAsync({ query: query.trim(), locale })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <section aria-label={t("notInList.title")} className="flex flex-col gap-2 rounded-md border p-3">
      <p className="text-sm font-medium">{t("notInList.title")}</p>
      <p className="text-muted-foreground text-xs">{t("notInList.hint")}</p>
      <div className="flex gap-2">
        <Input
          value={query}
          maxLength={LOOKUP_MAX}
          aria-label={t("notInList.inputLabel")}
          placeholder={t("notInList.placeholder")}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              if (query.trim().length >= 2) void research()
            }
          }}
        />
        <LoadingButton
          type="button"
          disabled={query.trim().length < 2}
          loading={lookup.isPending}
          onClick={() => void research()}
        >
          {t("notInList.research")}
        </LoadingButton>
      </div>
      {result && (
        <div className="flex flex-col gap-2">
          {result.matches.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium">{t("notInList.matches")}</p>
              {result.matches.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">
                    {m.title}
                    {m.provider ? ` · ${m.provider}` : ""}
                  </span>
                  <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onPick(m.id)}>
                    {t("notInList.pick")}
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-2 text-sm">
            <p className="font-medium">{result.draft.title || t("notInList.untitled")}</p>
            {result.draft.provider && <p className="text-muted-foreground text-xs">{result.draft.provider}</p>}
            {result.draft.summary && <p className="text-xs">{result.draft.summary}</p>}
            {result.pending_submission_id && (
              <p className="text-muted-foreground text-xs">{t("notInList.pendingTwin")}</p>
            )}
            <Button
              type="button"
              size="sm"
              className="self-start"
              disabled={busy || result.draft.title.trim() === ""}
              onClick={() => onPropose(result.draft)}
            >
              {proposeLabel ?? t("notInList.propose")}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
