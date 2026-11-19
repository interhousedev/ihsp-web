"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton, StateView } from "@ihsp/ui"
import { useState } from "react"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { SplitLayout } from "../../../components/lib/split-layout"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { QueryError } from "../../shell/components/query-error"
import { useSlots } from "../api"
import { SlotEditor } from "./slot-editor"
import { SlotList, slotId } from "./slot-list"

export function PromptStudioBody() {
  const t = useT("promptStudio")
  const query = useSlots()
  const [selected, setSelected] = useState<string | null>(null)
  if (query.isPending) return <Skeleton className="h-60 w-full" />
  if (query.isError) return <QueryError error={query.error} onRetry={() => void query.refetch()} />
  const slots = query.data.items
  if (slots.length === 0) return <StateView state="empty" title={t("empty")} />
  const slot = slots.find((s) => slotId(s) === selected) ?? slots[0]
  return (
    <SplitLayout aside={<SlotList slots={slots} selected={slot ? slotId(slot) : null} onSelect={setSelected} />}>
      {slot ? <SlotEditor key={slotId(slot)} slot={slot} /> : null}
    </SplitLayout>
  )
}

export function PromptStudioPage() {
  const t = useT("promptStudio")
  return (
    <AdmissionShell>
      <div className={pageClass("narrow")}>
        <AppPageHeader icon="sparkles" title={t("title")} />
        <PromptStudioBody />
      </div>
    </AdmissionShell>
  )
}
