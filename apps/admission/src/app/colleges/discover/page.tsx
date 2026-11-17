"use client"

import { Skeleton } from "@ihsp/ui"
import { AlgorithmPage } from "../../../features/algorithm/components/algorithm-page"
import { useAlgorithmDone } from "../../../features/algorithm"
import { DiscoverPage } from "../../../features/discover/components/discover-page"
import { AdmissionShell } from "../../../features/shell/components/admission-shell"

/** The swipe deck needs the algorithm: until its quiz is complete the student answers it first. */
export default function Page() {
  const { done, isLoading, isError } = useAlgorithmDone()
  if (isLoading) {
    return (
      <AdmissionShell>
        <Skeleton className="m-6 h-80" />
      </AdmissionShell>
    )
  }
  // A failed status check must not lock the deck.
  return done || isError ? <DiscoverPage /> : <AlgorithmPage />
}
