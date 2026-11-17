"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Input,
  LoadingButton,
  ResponsiveDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useCreateDeadline, useInstitutionSearch, type InstitutionHit } from "../api"
import { useWorkflow } from "../../../lib/config"

/** POST /staff/deadlines: pick a university from the catalog search, then cycle, round, status and date. */
export function CreateDeadlineDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("deadlines")
  const errorMessage = useErrorMessage()
  const create = useCreateDeadline()
  const [q, setQ] = useState("")
  const [picked, setPicked] = useState<InstitutionHit | null>(null)
  const [cycle, setCycle] = useState(() => String(new Date().getFullYear() + 1))
  const [round, setRound] = useState("")
  const [status, setStatus] = useState("")
  const workflow = useWorkflow()
  const [localDate, setLocalDate] = useState("")
  const hits = useInstitutionSearch(picked ? "" : q)
  const roundItems = workflow.rounds.map(({ id }) => ({ value: id, label: t(`round.${id}`) }))
  const statusItems = workflow.deadline_statuses.map((id) => ({ value: id, label: t(`status.${id}`) }))
  // Controlled from the first render: "" until the workflow arrives, then the first option.
  const roundValue = round || workflow.rounds[0]?.id || ""
  const statusValue = status || workflow.deadline_statuses[0] || ""

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!picked) return
    try {
      await create.mutateAsync({
        institution_id: picked.id,
        cycle: Number(cycle),
        round: roundValue,
        status: statusValue,
        local_date: localDate || null,
      })
      onOpenChange(false)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("createTitle")}
      onSubmit={submit}
      footer={
        <LoadingButton type="submit" disabled={!picked || !Number(cycle)} loading={create.isPending}>
          {t("save")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        {picked ? (
          <div className="flex items-center justify-between gap-2 rounded-card border p-2 text-sm">
            <span>{picked.name}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setPicked(null)}>
              {t("edit")}
            </Button>
          </div>
        ) : (
          <>
            <Input
              aria-label={t("searchLabel")}
              placeholder={t("searchLabel")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {hits.data && hits.data.length === 0 && <p className="text-muted-foreground text-sm">{t("noResults")}</p>}
            <ul className="flex flex-col gap-1">
              {hits.data?.map((hit) => (
                <li key={hit.id}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setPicked(hit)}
                  >
                    {hit.name}
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
        <label className="flex flex-col gap-1 text-sm">
          {t("cycleLabel")}
          <Input type="number" value={cycle} onChange={(e) => setCycle(e.target.value)} />
        </label>
        <div className="flex flex-col gap-1 text-sm">
          <span id="deadline-round-label">{t("roundLabel")}</span>
          <Select items={roundItems} value={roundValue} onValueChange={(value) => value && setRound(value)}>
            <SelectTrigger aria-labelledby="deadline-round-label" className="min-h-11 w-full md:min-h-8">
              <SelectValue placeholder={t("selectPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {roundItems.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <span id="deadline-status-label">{t("statusLabel")}</span>
          <Select items={statusItems} value={statusValue} onValueChange={(value) => value && setStatus(value)}>
            <SelectTrigger aria-labelledby="deadline-status-label" className="min-h-11 w-full md:min-h-8">
              <SelectValue placeholder={t("selectPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {statusItems.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          {t("dateLabel")}
          <Input type="date" value={localDate} onChange={(e) => setLocalDate(e.target.value)} />
        </label>
      </div>
    </ResponsiveDialog>
  )
}
