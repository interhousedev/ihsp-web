"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, LoadingButton, ResponsiveDialog } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { useScorecardAttach, useScorecardSearch, type ScorecardSchool } from "../scorecard-api"
import { useStaffInstitutionMutations } from "../universities-api"

function preview(s: ScorecardSchool): string {
  const f = s.facts as Record<string, { min?: number; amount?: number } | string>
  const rate = f.acceptance_rate as { min?: number } | undefined
  const coa = f.intl_coa_usd as { amount?: number } | undefined
  return [rate?.min !== undefined ? `${rate.min}%` : null, coa?.amount ? `$${coa.amount.toLocaleString()}` : null]
    .filter(Boolean)
    .join(" · ")
}

/** Search the College Scorecard, pick a school and attach it to `institutionId`, or create a US institution from it. */
export function ScorecardDialog({
  open,
  institutionId,
  initialQuery = "",
  onClose,
}: {
  open: boolean
  institutionId: string | null
  initialQuery?: string
  onClose: () => void
}) {
  const t = useT("universitiesManage")
  const errorMessage = useErrorMessage()
  const [q, setQ] = useState(initialQuery)
  const [picked, setPicked] = useState<ScorecardSchool | null>(null)
  const search = useScorecardSearch(q)
  const attach = useScorecardAttach()
  const { create } = useStaffInstitutionMutations()

  async function submit() {
    if (!picked) return
    try {
      const id =
        institutionId ??
        (
          await create.mutateAsync({
            name: picked.name,
            country: "US",
            city: [picked.city, picked.state].filter(Boolean).join(", ") || null,
            website_domain: picked.website_domain,
            kind: "university",
            status: "published",
          })
        ).id
      await attach.mutateAsync({ id, unitid: picked.unitid })
      toast.success(t("scorecard.done"))
      onClose()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const items = search.data?.items ?? []
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={t("scorecard.title")}
      size="md"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      footer={
        <LoadingButton type="submit" disabled={!picked} loading={attach.isPending || create.isPending}>
          {institutionId ? t("scorecard.attach") : t("scorecard.create")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          type="search"
          aria-label={t("scorecard.search")}
          placeholder={t("scorecard.search")}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPicked(null)
          }}
        />
        {search.isError && (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(search.error)}
          </p>
        )}
        {search.isSuccess && items.length === 0 && (
          <p className="text-muted-foreground text-sm">{t("scorecard.empty")}</p>
        )}
        <ul className="flex flex-col gap-2">
          {items.map((s) => (
            <li key={s.unitid}>
              <Button
                type="button"
                variant={picked?.unitid === s.unitid ? "default" : "outline"}
                className="h-auto w-full flex-col items-start gap-1 py-2 text-left"
                onClick={() => setPicked(s)}
              >
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-xs opacity-80">
                  {[s.city, s.state, `#${s.unitid}`, preview(s)].filter(Boolean).join(" · ")}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </ResponsiveDialog>
  )
}
