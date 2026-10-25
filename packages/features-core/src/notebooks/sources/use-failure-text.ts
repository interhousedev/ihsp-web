"use client"

import type { SourceFailure } from "@ihsp/api"
import { useT } from "@ihsp/i18n"

type LooseTranslator = { (key: string): string; has: (key: string) => boolean }

/** Text for a failure code of a source (`notebooks.failure.*`); empty for an unknown or missing code. */
export function useFailureText(): (failure: SourceFailure | null) => string {
  const t = useT("notebooks") as unknown as LooseTranslator
  return (failure) => (failure && t.has(`failure.${failure}`) ? t(`failure.${failure}`) : "")
}
