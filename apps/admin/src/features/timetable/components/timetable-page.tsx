"use client"

import { getAdminTimetable, type AdminTimetableParams, type TimetableEntry } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, PageContainer, StateView, useIsMobile } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"
import { useMemo, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { QueryState } from "../../shared/components/query-state"
import { SelectField } from "../../shared/components/select-field"
import { useGroupOptions, useRoomOptions, useTeacherOptions, useTerms } from "../../shared/hooks/use-lookups"
import { fullName } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"
import { CopyTermDialog } from "./copy-term-dialog"
import type { TimetableView } from "./entry-chip"
import { EntryEditorDialog, type EntryDefaults } from "./entry-editor-dialog"
import { TimetableDayList } from "./timetable-day-list"
import { TimetableGrid } from "./timetable-grid"

const VIEWS = ["group", "teacher", "room"] as const

type Editor = { entry: TimetableEntry | null; defaults: EntryDefaults | null }

/**
 * Timetable editor (ADM-9, UF-ADM-06): pick a term and a view (group, teacher or room), see the weekday × period
 * grid, click a cell to add or edit an entry. Entries are checked for conflicts before they are saved.
 */
export function TimetablePage() {
  const t = useT("timetable")
  const isMobile = useIsMobile()
  const [state, setState] = useQueryStates({
    term: parseAsString,
    view: parseAsStringLiteral(VIEWS).withDefault("group"),
    entity: parseAsString,
  })
  const [editor, setEditor] = useState<Editor | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)

  const terms = useTerms()
  const groups = useGroupOptions()
  const teachers = useTeacherOptions()
  const rooms = useRoomOptions()

  const term =
    terms.data?.find((item) => item.id === state.term) ?? terms.data?.find((item) => item.is_current) ?? terms.data?.[0]
  const view: TimetableView = state.view

  const entities = useMemo(() => {
    if (view === "group") return (groups.data ?? []).map((group) => ({ value: group.id, label: group.name }))
    if (view === "teacher")
      return (teachers.data ?? []).map((teacher) => ({ value: teacher.id, label: fullName(teacher) }))
    return (rooms.data ?? []).map((room) => ({ value: room.id, label: room.name }))
  }, [view, groups.data, teachers.data, rooms.data])
  const entityId = entities.some((item) => item.value === state.entity) ? state.entity : (entities[0]?.value ?? null)
  const entityLabel = entities.find((item) => item.value === entityId)?.label ?? ""

  const params: AdminTimetableParams | null =
    term && entityId
      ? {
          term_id: term.id,
          ...(view === "group"
            ? { group_id: entityId }
            : view === "teacher"
              ? { teacher_id: entityId }
              : { room_id: entityId }),
        }
      : null
  const timetable = useQuery({
    queryKey: ["admin", "timetable", params],
    queryFn: ({ signal }) => getAdminTimetable(params as AdminTimetableParams, { signal }),
    enabled: params !== null,
  })

  function addAt(weekday: number, period: number) {
    if (!entityId) return
    const defaults: EntryDefaults = { weekday, period }
    if (view === "group") defaults.audience = [{ group_id: entityId, subgroup: null }]
    if (view === "teacher") defaults.teacher_id = entityId
    if (view === "room") defaults.room_name = entityLabel
    setEditor({ entry: null, defaults })
  }

  const layout = (entries: TimetableEntry[]) =>
    term ? (
      isMobile ? (
        <TimetableDayList
          term={term}
          entries={entries}
          view={view}
          onAdd={addAt}
          onOpen={(entry) => setEditor({ entry, defaults: null })}
        />
      ) : (
        <TimetableGrid
          term={term}
          entries={entries}
          view={view}
          onAdd={addAt}
          onOpen={(entry) => setEditor({ entry, defaults: null })}
        />
      )
    ) : null

  return (
    <PageContainer
      title={t("title")}
      actions={
        term ? (
          <Button type="button" variant="outline" className={TOUCH} onClick={() => setCopyOpen(true)}>
            {t("copyFromTerm")}
          </Button>
        ) : null
      }
    >
      <QueryState query={terms} isEmpty={(list) => list.length === 0} emptyText={t("noTerms")}>
        {(list) => (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <LabeledField label={t("term")} htmlFor="timetable-term">
                <SelectField
                  id="timetable-term"
                  value={term?.id ?? ""}
                  options={list.map((item) => ({
                    value: item.id,
                    label: t("termLabel", { year: item.academic_year, half: item.half }),
                  }))}
                  onChange={(value) => void setState({ term: value })}
                />
              </LabeledField>
              <div className="flex flex-col gap-2">
                <span className="text-sm leading-none font-medium">{t("view")}</span>
                <div role="group" aria-label={t("view")} className="flex gap-1">
                  {VIEWS.map((item) => (
                    <Button
                      key={item}
                      type="button"
                      variant={view === item ? "default" : "outline"}
                      aria-pressed={view === item}
                      className={`${TOUCH} flex-1`}
                      onClick={() => void setState({ view: item, entity: null })}
                    >
                      {t(`views.${item}`)}
                    </Button>
                  ))}
                </div>
              </div>
              <LabeledField label={t(`entity.${view}`)} htmlFor="timetable-entity">
                <SelectField
                  id="timetable-entity"
                  value={entityId ?? ""}
                  options={entities}
                  onChange={(value) => void setState({ entity: value })}
                />
              </LabeledField>
            </div>

            {entityId === null ? (
              <StateView state="empty" emptyText={t(`noEntities.${view}`)} />
            ) : (
              <QueryState query={timetable} rows={4}>
                {(entries) =>
                  entries.length === 0 ? (
                    <div className="flex flex-col gap-3">
                      <p className="text-muted-foreground text-sm">{t("emptyTimetable")}</p>
                      {layout(entries)}
                    </div>
                  ) : (
                    layout(entries)
                  )
                }
              </QueryState>
            )}
          </div>
        )}
      </QueryState>

      {term && editor ? (
        <EntryEditorDialog
          term={term}
          entry={editor.entry}
          defaults={editor.defaults}
          open
          onClose={() => setEditor(null)}
        />
      ) : null}
      {term ? (
        <CopyTermDialog target={term} terms={terms.data ?? []} open={copyOpen} onOpenChange={setCopyOpen} />
      ) : null}
    </PageContainer>
  )
}
