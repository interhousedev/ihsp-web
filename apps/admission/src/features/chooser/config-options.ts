import type { AdmissionConfig } from "../../lib/config"

/** One option list of `GET /v1/admission/config` (`options.<group>`); empty when the backend sends none. */
export function configOptions(config: AdmissionConfig | undefined, group: string): string[] {
  const options = (config as { options?: Record<string, unknown> } | undefined)?.options
  const list = options?.[group]
  return Array.isArray(list) ? list.filter((item): item is string => typeof item === "string") : []
}
