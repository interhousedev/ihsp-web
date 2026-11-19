"use client"

import { AppPageHeader, pageClass } from "../../components/lib/page"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Card, CardContent, Input, Label, LoadingButton, StateView } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { AdmissionShell } from "../shell/components/admission-shell"
import { useReadinessWeights, useSaveReadinessWeights } from "./api"

function WeightsForm({ initial }: { initial: Record<string, number> }) {
  const t = useT("readinessWeights")
  const tc = useT("home.readiness")
  const errorMessage = useErrorMessage()
  const save = useSaveReadinessWeights()
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initial).map(([key, weight]) => [key, String(weight)])),
  )
  const total = Object.values(values).reduce((sum, value) => sum + (Number(value) || 0), 0)

  async function send(event: FormEvent) {
    event.preventDefault()
    try {
      await save.mutateAsync({
        weights: Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value) || 0])),
      })
      toast.success(t("saved"))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <form onSubmit={(event) => void send(event)}>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">{t("hint")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.keys(values).map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <Label htmlFor={`weight-${key}`}>{tc(`components.${key}`)}</Label>
                <Input
                  id={`weight-${key}`}
                  type="number"
                  min={0}
                  step="any"
                  value={values[key] ?? ""}
                  onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-sm">{t("total", { total })}</span>
            <LoadingButton type="submit" loading={save.isPending} disabled={total <= 0}>
              {t("save")}
            </LoadingButton>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

/** Admin editor of the readiness weights (stored by the backend as a runtime setting). */
export function ReadinessWeightsBody() {
  const t = useT("readinessWeights")
  const weights = useReadinessWeights()
  return (
    <div className="flex flex-col gap-6">
      <AppPageHeader icon="adjustments" title={t("title")} />
      {weights.isError ? (
        <StateView state="error" error={weights.error} onRetry={() => void weights.refetch()} />
      ) : !weights.data ? (
        <StateView state="loading" rows={3} />
      ) : (
        <WeightsForm initial={weights.data.weights} />
      )}
    </div>
  )
}

export function ReadinessWeightsPage() {
  return (
    <AdmissionShell roles={["admin", "counselor"]}>
      <div className={pageClass("narrow")}>
        <ReadinessWeightsBody />
      </div>
    </AdmissionShell>
  )
}
