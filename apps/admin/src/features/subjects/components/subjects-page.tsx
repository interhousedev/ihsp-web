"use client"

import { getAdminSubjectMaterialGroupsQuery, getAdminSubjectsQuery, patchAdminSubject, type Subject } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"
import { ListToolbar, type ToolbarFilter } from "../../shared/components/list-toolbar"
import { PagedTable } from "../../shared/components/paged-table"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { useArrayList } from "../../shared/hooks/use-paged-list"
import { actionsCol, col } from "../../shared/utils/columns"
import { TOUCH, TOUCH_ICON } from "../../shared/utils/touch"
import { DefaultMaterialsDialog } from "./default-materials-dialog"
import { MaterialsByEmisId } from "./materials-by-emis-id"
import { SubjectDialog } from "./subject-dialog"

const FILTER_KEYS = ["query"] as const

/** The EMIS subject id whose default materials the dialog shows, and what to call it (a subject name or typed text). */
type MaterialsTarget = { eduSubjectId: number; label?: string }

/** Subjects with names in three languages, the EMIS link and "can be divided" (ADM-7). */
export function SubjectsPage() {
  const t = useT("subjects")
  const filters = useFilterState(FILTER_KEYS)
  const [dialogSubject, setDialogSubject] = useState<Subject | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const query = filters.values.query ?? undefined
  const subjects = useQuery(getAdminSubjectsQuery({ query }))
  const source = useArrayList<Subject>(subjects)
  const [materialsTarget, setMaterialsTarget] = useState<MaterialsTarget | null>(null)
  const [materialsOpen, setMaterialsOpen] = useState(false)
  const materialGroups = useQuery(getAdminSubjectMaterialGroupsQuery())
  const materialCounts = useMemo(
    () => new Map((materialGroups.data ?? []).map((group) => [group.edu_subject_id, group.materials.length])),
    [materialGroups.data],
  )

  const openMaterials = useCallback((target: MaterialsTarget) => {
    setMaterialsTarget(target)
    setMaterialsOpen(true)
  }, [])

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
      col<Subject>("materials", t("columns.materials"), (subject) => {
        const eduSubjectId = subject.emis_subject_id
        if (!eduSubjectId) {
          // Default materials are keyed by the EMIS subject id, so a subject without one has none.
          return (
            <span className="inline-flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className={TOUCH}
                disabled
                aria-label={t("materials.openNoEmis", { name: subject.name.en })}
              >
                —
              </Button>
              <span className="text-muted-foreground text-xs">{t("materials.needEmis")}</span>
            </span>
          )
        }
        const count = materialCounts.get(eduSubjectId) ?? 0
        return (
          <Button
            type="button"
            variant="outline"
            className={TOUCH}
            aria-label={t("materials.open", { name: subject.name.en, count })}
            onClick={() => openMaterials({ eduSubjectId, label: subject.name.en })}
          >
            <Icons.paperclip aria-hidden />
            {materialGroups.data ? count : "…"}
          </Button>
        )
      }),
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
    [t, toggleDivided, materialCounts, materialGroups.data, openMaterials],
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
      <MaterialsByEmisId onOpen={(eduSubjectId, label) => openMaterials({ eduSubjectId, label })} />
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
      <DefaultMaterialsDialog
        eduSubjectId={materialsTarget?.eduSubjectId ?? null}
        label={materialsTarget?.label}
        open={materialsOpen}
        onOpenChange={setMaterialsOpen}
      />
    </PageContainer>
  )
}
