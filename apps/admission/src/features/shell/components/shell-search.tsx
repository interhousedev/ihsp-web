"use client"

import { getApiClient } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { CommandPalette, type CommandPaletteResult, type NavGroup } from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { getList, searchInstitutionsByText } from "@/features/chooser/api"
import type { ListEntry } from "@/features/chooser/types"
import type { EssaySummary } from "@/features/essays/api"
import type { TasksOut } from "@/features/tasks/api"

/** Deep pages that are not top-level nav items but are worth jumping to. */
const PAGES = [
  ["practice", "/essays/practice/"],
  ["byUniversity", "/essays/?lens=uni"],
  ["professions", "/profile/professions/"],
  ["weights", "/profile/"],
  ["catalog", "/chooser/?step=match&view=list"],
  ["graph", "/chooser/?step=list&view=graph"],
  ["gantt", "/tasks/?view=gantt"],
  ["opportunities", "/opportunities/"],
] as const

const fold = (text: string) => text.toLocaleLowerCase().normalize("NFKD")

/**
 * The applicant's search (Ctrl/Cmd+K): the navigation plus their own universities, essays and tasks, the deep pages,
 * and catalogue universities they have not added yet. Data comes from the query cache when it is warm.
 */
export function ShellSearch({ nav }: { nav: NavGroup[] }) {
  const t = useT("shellSearch")
  const locale = useLocale()
  const client = useQueryClient()

  const search = useCallback(
    async (query: string): Promise<CommandPaletteResult[]> => {
      const q = fold(query.trim())
      const hit = (text: string | null | undefined) => !!text && fold(text).includes(q)
      const cached = <T,>(key: readonly unknown[], fn: () => Promise<T>) =>
        client.fetchQuery({ queryKey: key, queryFn: fn, staleTime: 60_000 })
      const [list, essays, tasks, catalog] = await Promise.all([
        cached(["admission", "list"], () => getList()).catch(() => [] as ListEntry[]),
        cached(["admission", "essays"], () =>
          getApiClient().get<{ items: EssaySummary[] }>("/v1/admission/essays"),
        ).catch(() => ({ items: [] as EssaySummary[] })),
        cached(["admission", "tasks", "search"], () => getApiClient().get<TasksOut>("/v1/admission/tasks")).catch(
          () => ({ items: [] }) as unknown as TasksOut,
        ),
        searchInstitutionsByText(query.trim(), 5, locale).catch(() => ({ items: [] })),
      ])
      const listed = new Set(list.map((entry) => entry.institution.id))
      const results: CommandPaletteResult[] = []
      for (const [key, url] of PAGES)
        if (hit(t(`pages.${key}`))) results.push({ id: `page:${key}`, title: t(`pages.${key}`), section: t("sections.pages"), url })
      for (const entry of list)
        if (hit(entry.institution.name))
          results.push({
            id: `uni:${entry.id}`,
            title: entry.institution.name,
            subtitle: t("onList"),
            section: t("sections.universities"),
            url: `/chooser/institution/?id=${encodeURIComponent(entry.institution.id)}`,
          })
      for (const item of catalog.items ?? [])
        if (!listed.has(item.id))
          results.push({
            id: `cat:${item.id}`,
            title: item.name,
            subtitle: t("inCatalog"),
            section: t("sections.universities"),
            url: `/chooser/institution/?id=${encodeURIComponent(item.id)}`,
          })
      for (const essay of essays.items)
        if (hit(essay.title) || essay.targets.some((target) => hit(target.prompt)))
          results.push({
            id: `essay:${essay.id}`,
            title: essay.title || t("untitled"),
            section: t("sections.essays"),
            url: `/essays/edit/?id=${encodeURIComponent(essay.id)}`,
          })
      for (const task of tasks.items ?? [])
        if (hit(task.title))
          results.push({ id: `task:${task.id}`, title: task.title, section: t("sections.tasks"), url: `/tasks/?task=${encodeURIComponent(task.id)}` })
      return results
    },
    [client, locale, t],
  )

  return <CommandPalette nav={nav} search={search} />
}
