"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  StatusBadge,
} from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { CURATOR_ROLES } from "../../../config/nav"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { QueryError } from "../../shell/components/query-error"
import { useCountryName } from "../../countries/components/country-facts-view"
import { COUNTRY_STATUSES, useStaffCountries, useVerifyCountry, type CountryStatus } from "../api"
import { CountryEditDialog } from "./country-edit-dialog"

const TONES = { missing: "neutral", draft: "warning", verified: "success" } as const
const ANY = "any"

export function CountriesStaffBody() {
  const t = useT("countries")
  const name = useCountryName()
  const errorMessage = useErrorMessage()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<CountryStatus | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const query = useStaffCountries("", status)
  const needle = q.trim().toLowerCase()
  const items = query.data?.items.filter((item) => {
    if (!needle) return true
    const en = new Intl.DisplayNames(["en"], { type: "region" }).of(item.country) ?? ""
    return [item.country, name(item.country), en].some((v) => v.toLowerCase().includes(needle))
  })
  const verify = useVerifyCountry()

  let body
  if (query.isPending) body = <Skeleton className="h-32 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else
    body = (
      <ul className="flex flex-col gap-2">
        {(items ?? []).map((item) => (
          <li key={item.country} className="bg-card flex flex-wrap items-center gap-2 rounded-card border p-3">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium">{name(item.country)}</span>
              <span className="text-muted-foreground text-xs">
                {t("staff.coverage", { percent: item.coverage })}
                {item.as_of ? ` · ${item.as_of}` : ""}
              </span>
            </div>
            <div className="flex w-24 justify-end">
              <StatusBadge tone={TONES[item.status]} label={t(`staff.status.${item.status}`)} />
            </div>
            <div className="flex gap-2 sm:w-56 sm:justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 md:min-h-8"
                onClick={() => setEditing(item.country)}
              >
                {t("staff.edit")}
              </Button>
              {item.status === "draft" ? (
                <Button
                  type="button"
                  size="sm"
                  className="min-h-11 md:min-h-8"
                  disabled={verify.isPending}
                  onClick={() => verify.mutate(item.country, { onError: (e) => toast.error(errorMessage(e)) })}
                >
                  {t("staff.verify")}
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    )

  return (
    <div className={pageClass()}>
      <AppPageHeader icon="globe" title={t("staff.title")} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          type="search"
          aria-label={t("staff.search")}
          placeholder={t("staff.search")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select value={status ?? ANY} onValueChange={(v) => setStatus(v === ANY ? null : (v as CountryStatus))}>
          <SelectTrigger aria-label={t("staff.statusLabel")} className="min-h-11 w-full md:min-h-8">
            <SelectValue>{status ? t(`staff.status.${status}`) : t("staff.anyStatus")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t("staff.anyStatus")}</SelectItem>
            {COUNTRY_STATUSES.map((v) => (
              <SelectItem key={v} value={v}>
                {t(`staff.status.${v}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {editing ? <CountryEditDialog key={editing} code={editing} onClose={() => setEditing(null)} /> : null}
      {body}
    </div>
  )
}

export function CountriesStaffPage() {
  return (
    <AdmissionShell roles={[...CURATOR_ROLES]}>
      <CountriesStaffBody />
    </AdmissionShell>
  )
}
