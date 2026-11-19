"use client"

import { ApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Input,
  Label,
  LoadingButton,
  ResponsiveDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { useInstitutionSearch, type InstitutionHit } from "../../deadlines/api"
import {
  OUTCOME_PLANS,
  OUTCOME_STATUSES,
  useCreateOutcome,
  useUpdateOutcome,
  type Outcome,
  type OutcomePlan,
  type OutcomeStatus,
  type OutcomeTally,
} from "../api"

type Preset = { institution: InstitutionHit; cycle?: number }

function defaultCycle(): number {
  const now = new Date()
  return now.getFullYear() + (now.getMonth() >= 8 ? 1 : 0)
}

/** Report where you applied and what happened (create), or change a report (edit `outcome`). */
export function OutcomeDialog({
  open,
  onOpenChange,
  outcome,
  institutionName,
  logo,
  preset,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  outcome?: Outcome
  institutionName?: string
  logo?: OutcomeTally
  preset?: Preset
}) {
  const t = useT("outcomes")
  const errorMessage = useErrorMessage()
  const create = useCreateOutcome()
  const update = useUpdateOutcome()
  const [q, setQ] = useState("")
  const [picked, setPicked] = useState<InstitutionHit | null>(preset?.institution ?? null)
  const [cycle, setCycle] = useState(String(outcome?.cycle ?? preset?.cycle ?? defaultCycle()))
  const [plan, setPlan] = useState<OutcomePlan>((outcome?.plan as OutcomePlan | undefined) ?? "rd")
  const [status, setStatus] = useState<OutcomeStatus>((outcome?.status as OutcomeStatus | undefined) ?? "applied")
  const [share, setShare] = useState(outcome?.share_name ?? false)
  const [duplicate, setDuplicate] = useState(false)
  const hits = useInstitutionSearch(picked || outcome ? "" : q)
  const cycleNumber = Number(cycle)
  const validCycle = Number.isInteger(cycleNumber) && cycleNumber >= 2000 && cycleNumber <= 2100
  const pending = create.isPending || update.isPending

  async function submit(event: FormEvent) {
    event.preventDefault()
    setDuplicate(false)
    try {
      if (outcome) {
        await update.mutateAsync({
          id: outcome.id,
          lock_version: outcome.lock_version,
          plan,
          status,
          share_name: share,
        })
      } else if (picked) {
        await create.mutateAsync({ institution_id: picked.id, cycle: cycleNumber, plan, status, share_name: share })
      }
      onOpenChange(false)
    } catch (error) {
      if (!outcome && error instanceof ApiError && error.status === 409) setDuplicate(true)
      else toast.error(errorMessage(error))
    }
  }

  const name = outcome ? institutionName : picked?.name
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={outcome ? t("editTitle") : t("addTitle")}
      onSubmit={submit}
      footer={
        <LoadingButton type="submit" disabled={(!outcome && !picked) || !validCycle} loading={pending}>
          {t("save")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-5">
        {name || picked ? (
          <div className="rounded-card flex items-center justify-between gap-2 border p-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-medium">
              {name ? (
                <LogoAvatar
                  name={name}
                  src={outcome ? logo?.logo_url : picked?.logo_url}
                  fit={outcome ? logo?.logo_fit : picked?.logo_fit}
                  zoom={outcome ? logo?.logo_zoom : picked?.logo_zoom}
                  className="size-8 ring-0"
                />
              ) : null}
              {name}
            </span>
            {outcome ? null : (
              <Button type="button" variant="ghost" size="sm" onClick={() => setPicked(null)}>
                {t("change")}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Input
              aria-label={t("searchLabel")}
              placeholder={t("searchLabel")}
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
            {hits.data && hits.data.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("noResults")}</p>
            ) : null}
            <ul className="flex flex-col gap-1">
              {hits.data?.map((hit) => (
                <li key={hit.id}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11 w-full justify-start md:min-h-8"
                    onClick={() => setPicked(hit)}
                  >
                    {hit.name}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="outcome-cycle">{t("cycle")}</Label>
            <Input
              id="outcome-cycle"
              type="number"
              inputMode="numeric"
              disabled={!!outcome}
              value={cycle ?? ""}
              onChange={(event) => {
                setCycle(event.target.value)
                setDuplicate(false)
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("plan.label")}</Label>
            <Select value={plan} onValueChange={(value) => value && setPlan(value as OutcomePlan)}>
              <SelectTrigger aria-label={t("plan.label")} className="min-h-11 w-full md:min-h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOME_PLANS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`plan.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("statusLabel")}</Label>
            <Select value={status} onValueChange={(value) => value && setStatus(value as OutcomeStatus)}>
              <SelectTrigger aria-label={t("statusLabel")} className="min-h-11 w-full md:min-h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOME_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`status.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="outcome-share" className="flex-1 leading-snug">
            {t("shareName")}
          </Label>
          <Switch id="outcome-share" checked={share} onCheckedChange={setShare} />
        </div>
        {duplicate ? (
          <p role="alert" className="text-destructive text-sm">
            {t("duplicate")}
          </p>
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}
