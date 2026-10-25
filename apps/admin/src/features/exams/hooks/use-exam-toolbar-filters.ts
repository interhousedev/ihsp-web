"use client"

import type { ControlPeriods } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { useMemo } from "react"
import type { ToolbarFilter } from "../../shared/components/list-toolbar"
import { useControlLabel } from "../../shared/hooks/use-control-label"
import { useGroupOptions, useSubjectOptions } from "../../shared/hooks/use-lookups"
import { CONTROL_NAMES } from "../../shared/utils/controls"
import { formatPeriod } from "../../shared/utils/period"
import { EXAM_KINDS, EXAM_SOURCES, EXAM_STATUSES } from "../utils/exam-filters"

/** The toolbar of the exams list: dates, group, subject, kind, control week, status and source. */
export function useExamToolbarFilters(periods: ControlPeriods): ToolbarFilter[] {
  const t = useT("exams.filters")
  const tKind = useT("exams.kind")
  const tStatus = useT("exams.status")
  const tSource = useT("exams.source")
  const controlLabel = useControlLabel()
  const f = useFormatters()
  const groups = useGroupOptions()
  const subjects = useSubjectOptions()

  return useMemo<ToolbarFilter[]>(
    () => [
      { kind: "date", key: "from", label: t("from") },
      { kind: "date", key: "to", label: t("to") },
      {
        kind: "select",
        key: "group_id",
        label: t("group"),
        allLabel: t("allGroups"),
        options: (groups.data ?? []).map((group) => ({ value: group.id, label: group.name })),
      },
      {
        kind: "select",
        key: "subject_id",
        label: t("subject"),
        allLabel: t("allSubjects"),
        options: (subjects.data ?? []).map((subject) => ({
          value: subject.id,
          label: subject.name[f.locale] || subject.name.en,
        })),
      },
      {
        kind: "select",
        key: "kind",
        label: t("kind"),
        allLabel: t("allKinds"),
        options: EXAM_KINDS.map((kind) => ({ value: kind, label: tKind(kind) })),
      },
      {
        kind: "select",
        key: "control",
        label: t("control"),
        allLabel: t("allControls"),
        options: CONTROL_NAMES.flatMap((name) => {
          const period = periods[name]
          return period
            ? [
                {
                  value: name,
                  label: t("controlOption", { name: controlLabel(name), period: formatPeriod(f.date, period) }),
                },
              ]
            : []
        }),
      },
      {
        kind: "select",
        key: "status",
        label: t("status"),
        allLabel: t("allStatuses"),
        options: EXAM_STATUSES.map((status) => ({ value: status, label: tStatus(status) })),
      },
      {
        kind: "select",
        key: "source",
        label: t("source"),
        allLabel: t("allSources"),
        options: EXAM_SOURCES.map((source) => ({ value: source, label: tSource(source) })),
      },
    ],
    [groups.data, subjects.data, periods, controlLabel, f, t, tKind, tStatus, tSource],
  )
}
