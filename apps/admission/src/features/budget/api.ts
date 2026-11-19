import { getApiClient } from "@ihsp/api"
import type { Budget } from "./types"

export function getBudget(signal?: AbortSignal) {
  return getApiClient().get<Budget>("/v1/admission/chooser/budget", { signal })
}
