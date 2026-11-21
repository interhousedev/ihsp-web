"use client"

import { useMemo } from "react"
import { useList } from "../chooser/hooks"
import { MOCK_UNIS, type MockUniId } from "../fit/mock-fit"

export type MockLogo = { src: string | null; fit: "circle" | "contain"; zoom: number }

/** Real logos from the student's own list where the demo university matches one by name; otherwise a monogram. */
export function useMockLogos(): Record<MockUniId, MockLogo> {
  const list = useList()
  return useMemo(() => {
    const entries = list.data ?? []
    return Object.fromEntries(
      MOCK_UNIS.map((uni) => {
        const found = entries.find((entry) => uni.logoMatch.test(entry.institution.name))?.institution
        return [uni.id, { src: found?.logo_url ?? null, fit: found?.logo_fit ?? "circle", zoom: found?.logo_zoom ?? 1 }]
      }),
    ) as Record<MockUniId, MockLogo>
  }, [list.data])
}
