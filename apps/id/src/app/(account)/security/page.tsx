"use client"

import { SecurityPage } from "@ihsp/features-core/id-account"
import { PhotoCard } from "@/features/account/components/photo-card"

export default function Page() {
  return (
    <>
      <SecurityPage />
      <div className="px-4 pb-6 md:px-6">
        <PhotoCard />
      </div>
    </>
  )
}
