"use client"

import { keys, postAdminSyncMaterials, type Term } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Checkbox, ConfirmDialog } from "@ihsp/ui"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { useTerms } from "../../shared/hooks/use-lookups"
import { TOUCH } from "../../shared/utils/touch"

const termKey = (term: Pick<Term, "academic_year" | "half">) => `${term.academic_year}/${term.half}`

/**
 * Re-sync of the EMIS materials (ACA-9): the worker deletes every EMIS file of the chosen terms and downloads them
 * fresh. The administrator picks academic years and halves; the current term is chosen until they change it.
 */
export function MaterialsResync() {
  const t = useT("monitoring.sync.materials")
  const terms = useTerms()
  const [picked, setPicked] = useState<Set<string> | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const list = terms.data ?? []
  const chosen = picked ?? new Set(list.filter((term) => term.is_current).map(termKey))
  const selected = list.filter((term) => chosen.has(termKey(term)))

  const run = useAdminMutation({
    mutationFn: () =>
      postAdminSyncMaterials({ terms: selected.map(({ academic_year, half }) => ({ academic_year, half })) }),
    invalidate: [keys.admin.syncRuns()],
    success: t("started"),
    onSuccess: () => setConfirmOpen(false),
  })

  function toggle(term: Term, on: boolean) {
    const next = new Set(chosen)
    if (on) next.add(termKey(term))
    else next.delete(termKey(term))
    setPicked(next)
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4" aria-labelledby="materials-resync-title">
      <div>
        <h2 id="materials-resync-title" className="font-medium">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{t("terms")}</legend>
        {list.map((term) => {
          const label = t("termLabel", { year: term.academic_year, half: term.half })
          return (
            <div key={term.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                id={`resync-term-${term.id}`}
                aria-label={label}
                checked={chosen.has(termKey(term))}
                onCheckedChange={(checked) => toggle(term, checked === true)}
              />
              <label htmlFor={`resync-term-${term.id}`}>{label}</label>
            </div>
          )
        })}
      </fieldset>
      <div>
        <Button
          type="button"
          variant="outline"
          className={TOUCH}
          disabled={selected.length === 0}
          onClick={() => setConfirmOpen(true)}
        >
          {t("run")}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("confirmTitle")}
        description={t("confirmDescription", { count: selected.length })}
        confirmLabel={t("confirm")}
        loading={run.isPending}
        onConfirm={() => run.mutate()}
      />
    </section>
  )
}
