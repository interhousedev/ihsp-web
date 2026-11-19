"use client"

import { useT } from "@ihsp/i18n"
import { Tabs, TabsContent, TabsTrigger } from "@ihsp/ui"
import type { ReactNode } from "react"
import { ScrollTabsList } from "../scroll-tabs-list"

export const TOOL_TABS = ["plan", "check", "refine", "versions", "ideas"] as const
export type ToolTab = (typeof TOOL_TABS)[number]

/** Plan, check, refine, versions and ideas: the writing tools that used to sit in the right column. */
export function ToolsPanel({
  tab,
  onTab,
  panes,
}: {
  tab: ToolTab
  onTab: (tab: ToolTab) => void
  panes: Record<ToolTab, ReactNode>
}) {
  const t = useT("essays")
  const tc = useT("essayCheck")
  const label = (key: ToolTab) => (key === "check" ? tc("tab") : t(`tabs.${key}`))
  return (
    <Tabs value={tab} onValueChange={(value) => onTab(value as ToolTab)} className="flex flex-col gap-3">
      <ScrollTabsList>
        {TOOL_TABS.map((key) => (
          <TabsTrigger key={key} value={key} className="shrink-0 flex-none font-medium">
            {label(key)}
          </TabsTrigger>
        ))}
      </ScrollTabsList>
      {TOOL_TABS.map((key) => (
        <TabsContent key={key} value={key}>
          {panes[key]}
        </TabsContent>
      ))}
    </Tabs>
  )
}
