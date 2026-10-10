"use client"

import { getAdminSubjectsQuery, patchAdminSubject, type Subject } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { ListToolbar, type ToolbarFilter } from "../../shared/components/list-toolbar"
import { PagedTable } from "../../shared/components/paged-table"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { useArrayList } from "../../shared/hooks/use-paged-list"
import { actionsCol, col } from "../../shared/utils/columns"
import { TOUCH, TOUCH_ICON } from "../../shared/utils/touch"
import { SubjectDialog } from "./subject-dialog"

const FILTER_KEYS = ["query"] as const

/** Subjects with names in three languages, the EMIS link and "can be divided" (ADM-7). */
export function SubjectsPage() {
  const t = useT("subjects")
  const filters = useFilterState(FILTER_KEYS)
  const [dialogSubject, setDialogSubject] = useState<Subject | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const query = filters.values.query ?? undefined
  const subjects = useQuery(getAdminSubjectsQuery({ query }))
  const source = useArrayList<Subject>(subjects)

  const toggleDivided = useAdminMutation({
    mutationFn: ({ subject, value }: { subject: Subject; value: boolean }) =>
      patchAdminSubject(subject.id, { can_be_divided: value }),
    invalidate: [["admin", "subjects"]],
  })

  const toolbarFilters = useMemo<ToolbarFilter[]>(
    () => [{ kind: "search", key: "query", label: t("filters.query"), placeholder: t("filters.queryPlaceholder") }],
    [t],
  )

  const columns = useMemo(
    () => [
      col<Subject>("name_en", t("columns.nameEn"), (subject) => <span className="font-medium">{subject.name.en}</span>),
      col<Subject>("name_ru", t("columns.nameRu"), (subject) => subject.name.ru),
      col<Subject>("name_uz", t("columns.nameUz"), (subject) => subject.name.uz),
      col<Subject>("short", t("columns.shortName"), (subject) => subject.short_name ?? "—"),
      col<Subject>("emis", t("columns.emis"), (subject) => subject.emis_subject_id ?? t("notInEmis")),
      col<Subject>("divided", t("columns.canBeDivided"), (subject) => (
        <input
          type="checkbox"
          className="accent-primary size-5"
          checked={subject.can_be_divided}
          aria-label={t("dividedFor", { name: subject.name.en })}
          disabled={toggleDivided.isPending}
          onChange={(event) => toggleDivided.mutate({ subject, value: event.target.checked })}
        />
      )),
      actionsCol<Subject>(t("columns.actions"), (subject) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={TOUCH_ICON}
          aria-label={t("edit", { name: subject.name.en })}
          onClick={() => {
            setDialogSubject(subject)
            setDialogOpen(true)
          }}
        >
          <Icons.edit aria-hidden />
        </Button>
      )),
    ],
    [t, toggleDivided],
  )

  return (
    <PageContainer
      title={t("title")}
      actions={
        <Button
          type="button"
          className={TOUCH}
          onClick={() => {
            setDialogSubject(null)
            setDialogOpen(true)
          }}
        >
          <Icons.add aria-hidden />
          {t("new")}
        </Button>
      }
    >
      <PagedTable
        source={source}
        columns={columns}
        getRowId={(subject) => subject.id}
        emptyText={t("empty")}
        toolbar={
          <ListToolbar
            filters={toolbarFilters}
            values={filters.values}
            onChange={(key, value) => filters.set(key as (typeof FILTER_KEYS)[number], value)}
            onReset={filters.reset}
            active={filters.active}
          />
        }
      />
      <SubjectDialog subject={dialogSubject} open={dialogOpen} onOpenChange={setDialogOpen} />
    </PageContainer>
  )
}
