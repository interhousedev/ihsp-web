"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Skeleton } from "@ihsp/ui"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import type { CountryFact, FactKey } from "../../countries/api"
import { useCountryName } from "../../countries/components/country-facts-view"
import { usePutCountry, useStoredCountry } from "../api"
import { EDIT_KEYS, buildFact, toDraft, type Draft, type EditKey } from "../country-values"
import { FactEditor } from "./country-fact-editor"

const AS_OF = /^\d{4}-(0[1-9]|1[0-2])$/

type StoredFacts = Record<string, Parameters<typeof toDraft>[1]>

function Form({
  code,
  initial,
  asOf,
  onDone,
}: {
  code: string
  initial: Record<EditKey, Draft>
  asOf: string
  onDone: () => void
}) {
  const t = useT("countries")
  const u = useT("settingsUx")
  const errorMessage = useErrorMessage()
  const put = usePutCountry(code)
  const [drafts, setDrafts] = useState(initial)
  const [opened] = useState(() => new Set(EDIT_KEYS.filter((k) => buildFact(k, initial[k]).fact !== null)))
  const [date, setDate] = useState(asOf)
  const [submitted, setSubmitted] = useState(false)
  const built = useMemo(
    () => Object.fromEntries(EDIT_KEYS.map((k) => [k, buildFact(k, drafts[k])])),
    [drafts],
  ) as Record<EditKey, ReturnType<typeof buildFact>>
  const dateOk = AS_OF.test(date)
  const blocking = (k: EditKey) => built[k].problems.filter((p) => submitted || p !== "sourceRequired")

  function save(verified: boolean) {
    setSubmitted(true)
    if (!dateOk || EDIT_KEYS.some((k) => built[k].problems.length > 0)) {
      toast.error(u("fixErrors"))
      return
    }
    const facts: Partial<Record<FactKey, CountryFact>> = {}
    for (const k of EDIT_KEYS) {
      const f = built[k].fact
      if (f) (facts as Record<string, unknown>)[k] = f
    }
    put.mutate(
      { as_of: date, verified, facts },
      {
        onSuccess: () => {
          toast.success(t("staff.saved"))
          onDone()
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {t("staff.asOf")}
        <Input
          type="month"
          pattern="\d{4}-\d{2}"
          className="min-h-11 md:min-h-8"
          value={date}
          aria-invalid={submitted && !dateOk ? true : undefined}
          onChange={(e) => setDate(e.target.value)}
        />
        {submitted && !dateOk ? (
          <span role="alert" className="text-destructive text-xs">
            {u("asOfRequired")}
          </span>
        ) : null}
      </label>
      {EDIT_KEYS.map((k) => {
        const b = { ...built[k], problems: blocking(k) }
        const filled = built[k].fact !== null
        return (
          <details key={k} open={opened.has(k) || undefined} className="rounded-card border p-3">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-sm font-semibold md:min-h-8">
              {u(`title.${k}`)}
              <span className="text-muted-foreground text-xs font-normal">{filled ? u("filled") : u("empty")}</span>
            </summary>
            <div className="pt-3">
              <FactEditor
                k={k}
                draft={drafts[k]}
                built={b}
                onChange={(next) => setDrafts((d) => ({ ...d, [k]: next }))}
              />
            </div>
          </details>
        )
      })}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={put.isPending}
          onClick={() => save(false)}
        >
          {t("staff.saveDraft")}
        </Button>
        <Button type="button" className="min-h-11" disabled={put.isPending} onClick={() => save(true)}>
          {t("staff.saveVerified")}
        </Button>
      </div>
    </div>
  )
}

export function CountryEditDialog({ code, onClose }: { code: string; onClose: () => void }) {
  const name = useCountryName()
  const stored = useStoredCountry(code)
  const facts = (stored.data?.facts ?? {}) as StoredFacts
  const initial = Object.fromEntries(EDIT_KEYS.map((k) => [k, toDraft(k, facts[k])])) as Record<EditKey, Draft>
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{name(code)}</DialogTitle>
        </DialogHeader>
        {stored.isPending ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <Form code={code} initial={initial} asOf={stored.data?.as_of ?? ""} onDone={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
