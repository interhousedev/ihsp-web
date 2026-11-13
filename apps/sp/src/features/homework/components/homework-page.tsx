"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { QueryState } from "@ihsp/features-core"
import { useHomeworkList, useOpenWorkOffs } from "../hooks/use-homework"
import { HomeworkItemCard } from "./homework-item-card"
import { OverdueSection } from "./overdue-section"
import { HomeworkByDate } from "./homework-by-date"
import { HomeworkBySubject } from "./homework-by-subject"
import { WorkOffTodoItem } from "./work-off-todo-item"

const TABS = ["date", "upcoming", "later", "done", "subject"] as const

/**
 * Homework (WEB-18–20, UF-WEB-13): the highlighted Overdue group first, then the Upcoming, Later and Done lists with
 * tick boxes and private notes. The open work-off tasks lead the Upcoming list.
 */
export function HomeworkPage() {
  const t = useT("homework")
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("date"))
  const query = useHomeworkList(tab === "subject" || tab === "date" ? "upcoming" : tab)
  const workOffs = useOpenWorkOffs()
  const leadingWorkOffs = tab === "upcoming" ? (workOffs.data ?? []) : []

  return (
    <PageContainer title={t("title")}>
      <OverdueSection />
      <Tabs value={tab} onValueChange={(value) => void setTab(TABS.find((item) => item === value) ?? "date")}>
        <TabsList className="h-auto min-h-11 w-full md:w-fit">
          {TABS.map((value) => (
            <TabsTrigger key={value} value={value} className="min-h-11 px-3">
              {t(`tabs.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {tab === "date" ? (
        <HomeworkByDate />
      ) : tab === "subject" ? (
        <HomeworkBySubject />
      ) : (
        <QueryState
          query={query}
          isEmpty={(items) => items.length === 0 && leadingWorkOffs.length === 0}
          emptyText={t(`empty.${tab}`)}
        >
          {(items) => (
            <ul className="flex flex-col gap-2">
              {leadingWorkOffs.map((item) => (
                <WorkOffTodoItem key={`work-off-${item.id}`} item={item} />
              ))}
              {items.map((item) => (
                <HomeworkItemCard key={item.lesson_id} item={item} />
              ))}
            </ul>
          )}
        </QueryState>
      )}
    </PageContainer>
  )
}
