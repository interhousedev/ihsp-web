"use client"

import type { SourceDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger, Markdown } from "@ihsp/ui"
import { IconChevronDown, IconCornerDownRight, IconLoader2, IconSparkles } from "@tabler/icons-react"
import { useWorkspace } from "../workspace-context"
import { hasGuideKind } from "./source-rules"

/**
 * The source guide: a collapsible card with the summary, the key topics and the questions the guide proposes. A topic
 * chip asks the chat "Tell me about <topic>", a question asks it as written; both with only this source selected.
 * While the guide is being built it says "Summarizing…".
 */
export function SourceGuide({ source }: { source: SourceDetail }) {
  const t = useT("notebooks")
  const { ask } = useWorkspace()
  const guide = source.guide
  const building = guide === null && source.status === "ready" && hasGuideKind(source.kind)
  if (!guide && !building) return null

  return (
    <Collapsible defaultOpen className="bg-card rounded-xl border">
      <CollapsibleTrigger className="focus-visible:ring-ring group/guide flex min-h-11 w-full items-center gap-2 rounded-xl px-4 text-start text-sm font-medium outline-hidden focus-visible:ring-2">
        <IconSparkles aria-hidden className="text-primary size-4 shrink-0" />
        <span className="flex-1">{t("viewer.guide")}</span>
        <IconChevronDown
          aria-hidden
          className="size-4 shrink-0 -rotate-90 transition-transform group-data-panel-open/guide:rotate-0 motion-reduce:transition-none"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-3 px-4 pb-4">
          {guide ? (
            <>
              <Markdown className="text-sm">{guide.summary}</Markdown>
              {guide.key_topics.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <h3 className="text-muted-foreground text-xs font-medium">{t("viewer.topics")}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {guide.key_topics.map((topic) => (
                      <li key={topic}>
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-11 rounded-full px-3 md:min-h-8"
                          onClick={() => ask({ text: t("viewer.topicQuestion", { topic }), sourceIds: [source.id] })}
                        >
                          {topic}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {guide.questions.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <h3 className="text-muted-foreground text-xs font-medium">{t("viewer.questions")}</h3>
                  <ul className="flex flex-col">
                    {guide.questions.map((question) => (
                      <li key={question}>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto min-h-11 w-full justify-start gap-2 px-2 py-2 text-start font-normal whitespace-normal md:min-h-8 md:py-1.5"
                          onClick={() => ask({ text: question, sourceIds: [source.id] })}
                        >
                          <IconCornerDownRight
                            aria-hidden
                            className="text-muted-foreground mt-0.5 shrink-0 self-start"
                          />
                          <span>{question}</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <p role="status" className="text-muted-foreground flex items-center gap-2 text-sm">
              <IconLoader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
              {t("viewer.building")}
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
