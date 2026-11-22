"use client"

import { getApiClient, getAppMap, type AppMapResponse } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { CommandPalette, type CommandPaletteResult, type NavGroup } from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { getList, searchInstitutionsByText } from "@/features/chooser/api"
import type { ListEntry } from "@/features/chooser/types"
import type { EssaySummary } from "@/features/essays/api"
import type { TasksOut } from "@/features/tasks/api"

const fold = (text: string) =>
  text
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f'\u02bc\u02bb\u2019\u2018`]/g, "")
    .replace(/ё/g, "е")

type EssayHit = {
  essay_id: string
  title: string
  field: "title" | "prompt" | "body" | "notes"
  snippet: string
  match_start: number
  match_end: number
}

/**
 * The applicant's search (Ctrl/Cmd+K): every page and section of the app (from the role-filtered app map), their own
 * universities, essays (title, prompt and the words inside, searched on the server), activities and tasks, and
 * catalogue universities they have not added yet. Applicant-only sources are skipped for staff.
 */
export function ShellSearch({ nav, applicant = true }: { nav: NavGroup[]; applicant?: boolean }) {
  const t = useT("shellSearch")
  const locale = useLocale()
  const client = useQueryClient()

  const search = useCallback(
    async (query: string): Promise<CommandPaletteResult[]> => {
      const text = query.trim()
      const q = fold(text)
      const hit = (value: string | null | undefined) => !!value && fold(value).includes(q)
      const cached = <T,>(key: readonly unknown[], fn: () => Promise<T>) =>
        client.fetchQuery({ queryKey: key, queryFn: fn, staleTime: 60_000 })
      const mine = async <T,>(value: Promise<T>, empty: T) => (applicant ? value.catch(() => empty) : empty)
      const [map, list, essays, found, tasks, items, catalog] = await Promise.all([
        cached(["app-map"], () => getAppMap()).catch(() => ({ items: [] }) as AppMapResponse),
        mine(
          cached(["admission", "list"], () => getList()),
          [] as ListEntry[],
        ),
        mine(
          cached(["admission", "essays"], () => getApiClient().get<{ items: EssaySummary[] }>("/v1/admission/essays")),
          { items: [] as EssaySummary[] },
        ),
        mine(
          getApiClient().get<{ items: EssayHit[] }>("/v1/admission/essays/search", { query: { q: text, limit: 8 } }),
          { items: [] as EssayHit[] },
        ),
        mine(
          cached(["admission", "tasks", "search"], () => getApiClient().get<TasksOut>("/v1/admission/tasks")),
          { items: [] } as unknown as TasksOut,
        ),
        mine(
          cached(["admission", "items", "list", "all"], () =>
            getApiClient().get<{ items: { id: string; kind: string; title: string }[] }>("/v1/admission/me/items"),
          ),
          { items: [] as { id: string; kind: string; title: string }[] },
        ),
        mine(searchInstitutionsByText(text, 5, locale), { items: [], next_cursor: null }),
      ])
      const listed = new Set(list.map((entry) => entry.institution.id))
      const results: CommandPaletteResult[] = []
      for (const page of map.items) {
        if (page.app !== "admission") continue
        const title = page.title[locale] ?? page.title.en ?? Object.values(page.title)[0] ?? ""
        const words = [...Object.values(page.title), ...page.keywords]
        if (hit(title) || words.some(hit))
          results.push({ id: `page:${page.id}`, title, section: t("sections.pages"), url: page.path })
      }
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
      const inBody = new Set<string>()
      for (const match of found.items) {
        inBody.add(match.essay_id)
        results.push({
          id: `essay:${match.essay_id}`,
          title: match.title || t("untitled"),
          subtitle: t(`fields.${match.field}`),
          section: t("sections.essays"),
          url: `/essays/edit/?id=${encodeURIComponent(match.essay_id)}&q=${encodeURIComponent(text)}`,
          snippet: { text: match.snippet, start: match.match_start, end: match.match_end },
        })
      }
      for (const essay of essays.items)
        if (!inBody.has(essay.id) && (hit(essay.title) || essay.targets.some((target) => hit(target.prompt))))
          results.push({
            id: `essay:${essay.id}`,
            title: essay.title || t("untitled"),
            section: t("sections.essays"),
            url: `/essays/edit/?id=${encodeURIComponent(essay.id)}`,
          })
      for (const item of items.items)
        if (hit(item.title))
          results.push({
            id: `item:${item.id}`,
            title: item.title,
            section: t("sections.activities"),
            url: `/activities/?kind=${encodeURIComponent(item.kind)}&item=${encodeURIComponent(item.id)}`,
          })
      for (const task of tasks.items ?? [])
        if (hit(task.title))
          results.push({
            id: `task:${task.id}`,
            title: task.title,
            section: t("sections.tasks"),
            url: `/tasks/?task=${encodeURIComponent(task.id)}`,
          })
      return results
    },
    [applicant, client, locale, t],
  )

  return <CommandPalette nav={nav} search={search} />
}
