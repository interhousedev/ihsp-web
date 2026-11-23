"use client"

import { Suspense } from "react"
import { CountryPage } from "../../../features/countries/components/country-page"

export default function Page() {
  return (
    <Suspense>
      <CountryPage />
    </Suspense>
  )
}
