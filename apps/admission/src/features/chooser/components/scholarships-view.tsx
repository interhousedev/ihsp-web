"use client"

import { useT } from "@ihsp/i18n"
import { Label, StateView } from "@ihsp/ui"
import { useState } from "react"
import { configOptions } from "../config-options"
import { useScholarships } from "../hooks"
import { useAdmissionConfig } from "../../../lib/config"
import { useFacets } from "../hooks"
import { useOptionLabel } from "./option-label"
import { ScholarshipList } from "./scholarships-table"

const SELECT =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-sm md:h-9 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"

/** Scholarships of the catalog, filtered by country and basis (the basis list comes from the config). */
export function ScholarshipsView() {
  const t = useT("chooser")
  const config = useAdmissionConfig()
  const { facets } = useFacets()
  const basisLabel = useOptionLabel("scholarshipBasis")
  const countryLabel = useOptionLabel("country")
  const [country, setCountry] = useState("")
  const [basis, setBasis] = useState("")
  const query = useScholarships({ ...(country ? { country } : {}), ...(basis ? { basis } : {}) })
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="s-country">{t("filters.country")}</Label>
          <select
            id="s-country"
            className={SELECT}
            value={country}
            onChange={(event) => setCountry(event.target.value)}
          >
            <option value="">{t("filters.any")}</option>
            {(facets?.countries ?? []).map((value) => (
              <option key={value} value={value}>
                {countryLabel(value)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="s-basis">{t("scholarships.basis")}</Label>
          <select id="s-basis" className={SELECT} value={basis} onChange={(event) => setBasis(event.target.value)}>
            <option value="">{t("filters.any")}</option>
            {configOptions(config.data, "scholarship_basis").map((value) => (
              <option key={value} value={value}>
                {basisLabel(value)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {query.isLoading ? (
        <StateView state="loading" rows={3} />
      ) : query.isError ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <ScholarshipList items={query.data ?? []} />
      )}
    </div>
  )
}
