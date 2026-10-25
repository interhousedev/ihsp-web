"use client"

import { UpdateWatcher as SharedUpdateWatcher } from "@ihsp/features-core/pwa"
import { clearPersistedQueries } from "../../offline/utils/persisted-queries"

/** The shared update watcher; a reload also drops the stored query cache of the student app. */
export function UpdateWatcher() {
  return <SharedUpdateWatcher clearStored={clearPersistedQueries} />
}
