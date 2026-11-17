"use client"

import { useT } from "@ihsp/i18n"
import { Label } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useEssays } from "../api"
import { useEssayLabel } from "./supp-label"

/** Switches between the student's essays without going back to the list. */
export function DraftSwitcher({ currentId }: { currentId: string }) {
  const t = useT("essays")
  const router = useRouter()
  const essays = useEssays().data?.items ?? []
  const { label } = useEssayLabel()
  if (essays.length < 2) return null
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="essay-switch" className="text-muted-foreground text-xs">
        {t("draft.label")}
      </Label>
      <select
        id="essay-switch"
        className="border-input bg-background h-9 max-w-56 rounded-md border px-3 text-sm"
        value={currentId}
        onChange={(e) => router.push(`/essays/edit/?id=${encodeURIComponent(e.target.value)}`)}
      >
        {essays.map((e) => (
          <option key={e.id} value={e.id}>
            {label(e)}
          </option>
        ))}
      </select>
    </div>
  )
}
