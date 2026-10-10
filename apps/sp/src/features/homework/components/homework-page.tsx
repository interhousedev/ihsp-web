"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { QueryState } from "../../shared/components/query-state"
import { useHomeworkList } from "../hooks/use-homework"
import { HomeworkItemCard } from "./homework-item-card"
import { OverdueSection } from "./overdue-section"

const TABS = ["upcoming", "later", "done"] as const

/**
 * Homework (WEB-18–20, UF-WEB-13): the highlighted Overdue group first, then the Upcoming, Later and Done lists with
 * tick boxes and private notes.
 */
export function HomeworkPage() {
  const t = useT("homework")
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("upcoming"))
  const query = useHomeworkList(tab)

  return (
    <PageContainer title={t("title")}>
      <OverdueSection />
      <Tabs value={tab} onValueChange={(value) => void setTab(TABS.find((item) => item === value) ?? "upcoming")}>
        <TabsList className="h-auto min-h-11 w-full md:w-fit">
          {TABS.map((value) => (
            <TabsTrigger key={value} value={value} className="min-h-11 px-3">
              {t(`tabs.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <QueryState query={query} isEmpty={(items) => items.length === 0} emptyText={t(`empty.${tab}`)}>
        {(items) => (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <HomeworkItemCard key={item.lesson_id} item={item} />
            ))}
          </ul>
        )}
      </QueryState>
    </PageContainer>
  )
}
