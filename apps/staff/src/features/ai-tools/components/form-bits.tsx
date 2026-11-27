"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import type { ComponentProps, ReactNode } from "react"
import { useSubjects } from "../hooks/use-ai-tools"

/** A label above a control. */
export function FieldRow({ label, htmlFor, children, className }: { label: string; htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

/** The platform select look on a native element (a phone gets the OS picker). */
export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "border-hairline-strong bg-background text-foreground focus-visible:ring-ring/50 min-h-11 w-full min-w-0 truncate rounded-lg border py-1.5 ps-2.5 pe-7 text-sm outline-none focus-visible:ring-3 md:min-h-8",
        className,
      )}
      {...props}
    />
  )
}

/** Subject and group of a material: they decide which notebook receives it. An empty group means every group of the teacher. */
export function SubjectGroupFields({
  subjectId,
  groupId,
  onSubject,
  onGroup,
  idPrefix = "f",
}: {
  subjectId: string
  groupId: string
  onSubject: (v: string) => void
  onGroup: (v: string) => void
  idPrefix?: string
}) {
  const t = useT("aiTools")
  const { subjects } = useSubjects()
  const groups = subjects.find((s) => s.subject_id === subjectId)?.groups ?? []
  return (
    <div className="grid grid-cols-2 gap-3">
      <FieldRow label={t("form.subject")} htmlFor={`${idPrefix}-subject`}>
        <NativeSelect
          id={`${idPrefix}-subject`}
          value={subjectId}
          onChange={(e) => {
            onSubject(e.target.value)
            onGroup("")
          }}
        >
          {subjects.map((s) => (
            <option key={s.subject_id} value={s.subject_id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
      </FieldRow>
      <FieldRow label={t("form.group")} htmlFor={`${idPrefix}-group`}>
        <NativeSelect id={`${idPrefix}-group`} value={groupId} onChange={(e) => onGroup(e.target.value)}>
          <option value="">{t("form.allGroups")}</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </NativeSelect>
      </FieldRow>
    </div>
  )
}

/** The notebook name of a material: subject and group, or every group of the teacher. */
export function useNotebookName(subjectId: string, groupId: string): string {
  const t = useT("aiTools")
  const { subjects } = useSubjects()
  const subject = subjects.find((s) => s.subject_id === subjectId)
  const group = subject?.groups.find((g) => g.id === groupId)
  return `${subject?.name ?? ""} · ${group?.name ?? t("form.allMyGroups")}`
}

/** The first subject of the teacher, until one is chosen. */
export function useDefaultSubject(): string {
  return useSubjects().subjects[0]?.subject_id ?? ""
}
