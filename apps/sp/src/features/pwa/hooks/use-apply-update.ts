"use client"

import { useApplyUpdate as useSharedApplyUpdate } from "@ihsp/features-core/pwa"
import { clearPersistedQueries } from "../../offline/utils/persisted-queries"

/** The shared `applyUpdate`, which also forgets the stored query cache of the student app. */
export function useApplyUpdate(): () => Promise<void> {
  return useSharedApplyUpdate({ clearStored: clearPersistedQueries })
}
