"use client"

import { getApiClient } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Card,
  CardContent,
  LoadingButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ADMISSION_CONFIG_KEY, useSchoolGrades } from "../../../lib/config"

const ALL = Array.from({ length: 12 }, (_, i) => i + 1)

/** Administrators choose the first and last school grade the admission app plans for. */
export function SchoolGradesCard() {
  const t = useT("settingsHub.schoolGrades")
  const errorMessage = useErrorMessage()
  const qc = useQueryClient()
  const current = useSchoolGrades()
  const [from, setFrom] = useState(current[0] ?? 9)
  const [to, setTo] = useState(current[current.length - 1] ?? 12)
  useEffect(() => {
    setFrom(current[0] ?? 9)
    setTo(current[current.length - 1] ?? 12)
  }, [current])
  const save = useMutation({
    mutationFn: () =>
      getApiClient().put("/v1/admission/settings/school-grades", {
        grades: ALL.filter((g) => g >= from && g <= to),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ADMISSION_CONFIG_KEY })
      toast.success(t("saved"))
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold">{t("title")}</h3>
          <p className="text-muted-foreground text-sm">{t("text")}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 text-sm">
            <span id="grades-from">{t("from")}</span>
            <Select
              value={String(from)}
              onValueChange={(value) => {
                if (!value) return
                const v = Number(value)
                setFrom(v)
                if (v > to) setTo(v)
              }}
            >
              <SelectTrigger aria-labelledby="grades-from" className="w-24">
                <SelectValue>{String(from)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ALL.map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span id="grades-to">{t("to")}</span>
            <Select
              value={String(to)}
              onValueChange={(value) => {
                if (!value) return
                const v = Number(value)
                setTo(v)
                if (v < from) setFrom(v)
              }}
            >
              <SelectTrigger aria-labelledby="grades-to" className="w-24">
                <SelectValue>{String(to)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ALL.map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <LoadingButton type="button" loading={save.isPending} onClick={() => save.mutate()}>
            {t("save")}
          </LoadingButton>
        </div>
      </CardContent>
    </Card>
  )
}
