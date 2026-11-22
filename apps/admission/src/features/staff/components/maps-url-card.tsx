"use client"

import { type AdmissionMapsUrl, getApiClient } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Card, CardContent, Input, LoadingButton } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const KEY = ["admission", "maps-url"]

/** Administrators set the "open on a map" link template; `{query}` is replaced by the place. */
export function MapsUrlCard() {
  const t = useT("settingsHub.mapsUrl")
  const errorMessage = useErrorMessage()
  const qc = useQueryClient()
  const current = useQuery({
    queryKey: KEY,
    queryFn: () => getApiClient().get<AdmissionMapsUrl>("/v1/admission/settings/maps-url"),
  })
  const [value, setValue] = useState("")
  useEffect(() => setValue(current.data?.template ?? ""), [current.data])
  const save = useMutation({
    mutationFn: () => getApiClient().put("/v1/admission/settings/maps-url", { template: value.trim() || null }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY })
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
        <Input
          aria-label={t("title")}
          value={value}
          placeholder={current.data?.default}
          onChange={(e) => setValue(e.target.value)}
        />
        <div>
          <LoadingButton loading={save.isPending} onClick={() => save.mutate()}>
            {t("save")}
          </LoadingButton>
        </div>
      </CardContent>
    </Card>
  )
}
