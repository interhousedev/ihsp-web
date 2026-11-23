"use client"

import { type AdmissionMapsUrl, getApiClient } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Card,
  CardContent,
  Input,
  Label,
  LoadingButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const KEY = ["admission", "maps-url"]
const PLACE = "{query}"
const PROVIDERS = {
  google: "https://www.google.com/maps/search/?api=1&query={query}",
  yandex: "https://yandex.com/maps/?text={query}",
  twogis: "https://2gis.uz/search/{query}",
  osm: "https://www.openstreetmap.org/search?query={query}",
} as const
type Provider = keyof typeof PROVIDERS | "custom"
const SAMPLE = "Tashkent, Amir Temur avenue 1"

const providerOf = (template: string): Provider =>
  (Object.keys(PROVIDERS) as (keyof typeof PROVIDERS)[]).find((k) => PROVIDERS[k] === template) ?? "custom"
const customOk = (v: string) => /^https:\/\/\S+$/.test(v) && v.split(PLACE).length === 2
const sampleUrl = (template: string) => template.replace(PLACE, encodeURIComponent(SAMPLE))

/** Administrators set the "open on a map" link template; `{query}` is replaced by the place. */
export function MapsUrlCard() {
  const t = useT("settingsHub.mapsUrl")
  const errorMessage = useErrorMessage()
  const qc = useQueryClient()
  const current = useQuery({
    queryKey: KEY,
    queryFn: () => getApiClient().get<AdmissionMapsUrl>("/v1/admission/settings/maps-url"),
  })
  const u = useT("settingsUx")
  const [value, setValue] = useState("")
  const [provider, setProvider] = useState<Provider>("google")
  useEffect(() => {
    const template = current.data?.template ?? ""
    setValue(template)
    setProvider(template === "" ? "google" : providerOf(template))
  }, [current.data])
  const template = provider === "custom" ? value.trim() : PROVIDERS[provider]
  const valid = provider !== "custom" || customOk(template)
  const save = useMutation({
    mutationFn: () =>
      getApiClient().put("/v1/admission/settings/maps-url", {
        template: provider === "google" ? null : template,
      }),
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
          <p className="text-muted-foreground text-sm">{u("mapsText")}</p>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="maps-provider">{u("mapsProvider")}</Label>
          <Select value={provider} onValueChange={(v) => v && setProvider(v as Provider)}>
            <SelectTrigger id="maps-provider" className="min-h-11 w-full md:min-h-8">
              <SelectValue>{u(`mapsProviders.${provider}`)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {([...Object.keys(PROVIDERS), "custom"] as Provider[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {u(`mapsProviders.${k}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {provider === "custom" ? (
          <div className="flex flex-col gap-1">
            <Label htmlFor="maps-custom">{u("mapsCustom")}</Label>
            <Input
              id="maps-custom"
              type="url"
              placeholder="https://"
              aria-invalid={!valid || undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            {!valid ? (
              <span role="alert" className="text-destructive text-xs">
                {u("mapsCustomInvalid")}
              </span>
            ) : null}
          </div>
        ) : null}
        {valid ? (
          <a
            href={sampleUrl(template)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex min-h-11 items-center text-sm underline md:min-h-8"
          >
            {u("mapsTest", { address: SAMPLE })}
          </a>
        ) : null}
        <div>
          <LoadingButton loading={save.isPending} disabled={!valid} onClick={() => save.mutate()}>
            {t("save")}
          </LoadingButton>
        </div>
      </CardContent>
    </Card>
  )
}
