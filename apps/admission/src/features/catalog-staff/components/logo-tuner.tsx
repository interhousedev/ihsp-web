"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, LoadingButton, ResponsiveDialog } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { LogoAvatar, type LogoFit } from "../../../components/lib/photo-header"
import { useInstitution } from "../../chooser/hooks"
import { usePatchLogo, useInstitutionSearch, type InstitutionHit } from "../api"

const FITS: LogoFit[] = ["circle", "contain"]

/** Pick a university, tune how its logo is shown (zoom, circle or whole logo) and send the change for review. */
export function LogoTuner({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("catalogStaff")
  const errorMessage = useErrorMessage()
  const create = usePatchLogo()
  const [q, setQ] = useState("")
  const [target, setTarget] = useState<InstitutionHit | null>(null)
  const [zoom, setZoom] = useState<number | null>(null)
  const [fit, setFit] = useState<LogoFit | null>(null)
  const hits = useInstitutionSearch(target ? "" : q)
  const detail = useInstitution(target?.id ?? null).data
  const shownZoom = zoom ?? detail?.logo_zoom ?? 1
  const shownFit = fit ?? detail?.logo_fit ?? "circle"
  const ready = target !== null

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!target) return
    try {
      await create.mutateAsync({ id: target.id, logo_zoom: shownZoom, logo_fit: shownFit })
      toast.success(t("logoSent"))
      onOpenChange(false)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("logoTitle")}
      onSubmit={submit}
      footer={
        <LoadingButton type="submit" disabled={!ready} loading={create.isPending}>
          {t("submit")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-4">
        {target ? (
          <div className="flex items-center justify-between gap-2 rounded-card border p-2 text-sm">
            <span>{target.name}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setTarget(null)}>
              {t("clear")}
            </Button>
          </div>
        ) : (
          <>
            <Input
              aria-label={t("universityLabel")}
              placeholder={t("universityLabel")}
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
                    onClick={() => setTarget(hit)}
                  >
                    {hit.name}
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
        {target ? (
          <>
            <div className="flex flex-col items-center gap-2 overflow-hidden" aria-label={t("logoPreview")}>
              <LogoAvatar
                name={target.name}
                src={detail?.logo_url}
                fit={shownFit}
                zoom={shownZoom}
                className="size-24"
              />
            </div>
            <label className="flex flex-col gap-1 text-sm">
              {t("logoZoom")} ({shownZoom.toFixed(2)})
              <input
                type="range"
                min={0.5}
                max={3}
                step="any"
                value={shownZoom}
                onChange={(e) => setZoom(Math.round(Number(e.target.value) * 20) / 20)}
              />
            </label>
            <div role="group" aria-label={t("logoFit")} className="flex gap-2">
              {FITS.map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={shownFit === value ? "default" : "outline"}
                  aria-pressed={shownFit === value}
                  onClick={() => setFit(value)}
                >
                  {t(value === "circle" ? "logoFitCircle" : "logoFitContain")}
                </Button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}
