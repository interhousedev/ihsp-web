"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Label, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { AiTabCard } from "@/components/ai-tab-card"
import { REFINE_ACTIONS, useRefine, type RefineAction } from "../api"
import { CoachError } from "./coach-error"

/** Hints for one passage: reword it, connect it to the next idea or merge two ideas. The coach never rewrites it. */
export function RefinePanel({ essayId }: { essayId: string }) {
  const t = useT("essays")
  const refine = useRefine(essayId)
  const [action, setAction] = useState<RefineAction>("reword")
  const [text, setText] = useState("")
  return (
    <AiTabCard label={t("refine.tab")} icon={<Icons.sparkles aria-hidden />} className="gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="refine-text">{t("refine.text")}</Label>
        <Textarea id="refine-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div role="radiogroup" aria-label={t("refine.actionLabel")} className="flex flex-wrap gap-2">
        {REFINE_ACTIONS.map((a) => (
          <Button
            key={a}
            type="button"
            size="sm"
            role="radio"
            aria-checked={action === a}
            variant={action === a ? "default" : "outline"}
            onClick={() => setAction(a)}
          >
            {t(`refine.action.${a}`)}
          </Button>
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        className="self-start"
        disabled={refine.isPending || !text.trim()}
        onClick={() => refine.mutate({ action, text })}
      >
        <Icons.sparkles aria-hidden />
        {t("refine.run")}
      </Button>
      <CoachError error={refine.error} />
      {refine.data ? (
        <ul className="list-disc pl-5 text-sm animate-in fade-in">
          {refine.data.hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      ) : null}
    </AiTabCard>
  )
}
