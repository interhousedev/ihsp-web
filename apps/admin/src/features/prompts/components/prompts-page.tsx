"use client"

import { getAdminPromptsQuery } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { parseSlotKey } from "../utils"
import { PromptAnalytics } from "./prompt-analytics"
import { PromptCalls } from "./prompt-calls"
import { PromptEditor } from "./prompt-editor"
import { PromptList } from "./prompt-list"

/** AI prompts: the slots by task, an editor with history and a diff, and how each version performs. */
export function PromptsPage() {
  const t = useT("prompts")
  const query = useQuery(getAdminPromptsQuery())
  const [slot, setSlot] = useQueryState("slot", parseAsString)
  const selected = parseSlotKey(slot)
  return (
    <PageContainer title={t("title")}>
      <p className="text-muted-foreground text-sm">{t("description")}</p>
      <div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
        <QueryState query={query} rows={5} isEmpty={(data) => data.items.length === 0} emptyText={t("list.empty")}>
          {({ items }) => <PromptList slots={items} selected={slot} onSelect={(key) => void setSlot(key)} />}
        </QueryState>
        {selected ? (
          <PromptEditor key={slot} task={selected.task} name={selected.name} />
        ) : (
          <p className="text-muted-foreground text-sm">{t("editor.choose")}</p>
        )}
      </div>
      <PromptAnalytics task={selected?.task} />
      {selected ? <PromptCalls task={selected.task} /> : null}
    </PageContainer>
  )
}
