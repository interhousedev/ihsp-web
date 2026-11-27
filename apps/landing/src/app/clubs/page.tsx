import { ClubsPublicPage } from "@/features/clubs-public/clubs-public-page"
import { Suspense } from "react"

export default function ClubsRoute() {
  return (
    <Suspense>
      <ClubsPublicPage />
    </Suspense>
  )
}
