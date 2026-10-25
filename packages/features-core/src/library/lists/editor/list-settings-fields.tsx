"use client"

import { getLibrarySubjectsQuery, type ReadingListScope, type ReadingListStatus } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Dropdown, Input, Label, Skeleton, Textarea, cn } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useId } from "react"
import { DESCRIPTION_MAX, TITLE_MAX, settingsProblems, type ListSettings } from "./entries"
import type { GroupChoices } from "./use-group-choices"

const SCOPES: readonly ReadingListScope[] = ["subject", "groups", "school"]
const YEARS = [1, 2] as const

const radioRow = "min-h-11 cursor-pointer items-start gap-3 rounded-md px-2 font-normal"

/**
 * The first part of the editor: title, description, who the list is for (a subject and year, groups, or the whole
 * lyceum), the term half and whether it is a draft or published.
 */
export function ListSettingsFields({
  settings,
  onChange,
  showProblems,
  groups,
}: {
  settings: ListSettings
  onChange: (patch: Partial<ListSettings>) => void
  showProblems: boolean
  groups: GroupChoices
}) {
  const t = useT("library.listEditor.settings")
  const ids = { title: useId(), description: useId(), subject: useId(), year: useId(), term: useId() }
  const subjects = useQuery(getLibrarySubjectsQuery({ all: true }))
  const problems = showProblems ? settingsProblems(settings, groups.state === "ready") : []
  const groupsUsable = groups.state === "ready" && groups.groups.length > 0
  // A list already written for groups keeps that scope even if the groups cannot be listed any more.
  const statuses: ReadingListStatus[] =
    settings.status === "archived" ? ["draft", "published", "archived"] : ["draft", "published"]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={ids.title}>{t("titleLabel")}</Label>
        <Input
          id={ids.title}
          value={settings.title}
          maxLength={TITLE_MAX}
          required
          autoComplete="off"
          aria-invalid={problems.includes("titleRequired")}
          aria-describedby={problems.includes("titleRequired") ? `${ids.title}-error` : undefined}
          onChange={(event) => onChange({ title: event.target.value })}
        />
        {problems.includes("titleRequired") ? (
          <p id={`${ids.title}-error`} role="alert" className="text-destructive text-sm">
            {t("titleRequired")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={ids.description}>{t("descriptionLabel")}</Label>
        <Textarea
          id={ids.description}
          value={settings.description}
          rows={3}
          maxLength={DESCRIPTION_MAX}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">{t("scopeLabel")}</legend>
        {SCOPES.map((scope) => {
          const disabled = scope === "groups" && !groupsUsable && settings.scope !== "groups"
          return (
            <Label key={scope} className={cn(radioRow, disabled && "opacity-60")}>
              <input
                type="radio"
                name="list-scope"
                value={scope}
                className="mt-1 size-4"
                checked={settings.scope === scope}
                disabled={disabled}
                onChange={() => onChange({ scope })}
              />
              <span className="flex flex-col">
                <span className="font-medium">{t(`scope.${scope}`)}</span>
                <span className="text-muted-foreground text-sm">{t(`scopeHint.${scope}`)}</span>
              </span>
            </Label>
          )
        })}
      </fieldset>

      {settings.scope === "groups" ? (
        <fieldset
          className="flex flex-col gap-1"
          aria-describedby={problems.includes("groupsRequired") ? "groups-error" : undefined}
        >
          <legend className="mb-1 text-sm font-medium">{t("groupsLabel")}</legend>
          {groups.state === "loading" ? (
            <Skeleton className="h-16 w-full" />
          ) : groups.state === "error" ? (
            <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-destructive">{t("groupsError")}</span>
              <button type="button" className="text-primary min-h-11 underline" onClick={groups.retry}>
                {t("retry")}
              </button>
            </div>
          ) : groups.state === "unavailable" ? (
            <p className="text-muted-foreground text-sm">{t("groupsUnavailable")}</p>
          ) : groups.groups.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noGroups")}</p>
          ) : (
            <div className="grid gap-1 sm:grid-cols-2">
              {groups.groups.map((group) => (
                <Label key={group.id} className="min-h-11 cursor-pointer gap-3 rounded-md px-2 font-normal">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={settings.groupIds.includes(group.id)}
                    onChange={() =>
                      onChange({
                        groupIds: settings.groupIds.includes(group.id)
                          ? settings.groupIds.filter((id) => id !== group.id)
                          : [...settings.groupIds, group.id],
                      })
                    }
                  />
                  {group.name}
                </Label>
              ))}
            </div>
          )}
          {problems.includes("groupsRequired") ? (
            <p id="groups-error" role="alert" className="text-destructive text-sm">
              {t("groupsRequired")}
            </p>
          ) : null}
        </fieldset>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.subject}>{settings.scope === "subject" ? t("subjectLabel") : t("subjectOptional")}</Label>
          <Dropdown
            id={ids.subject}
            className="w-full"
            value={settings.subjectId}
            aria-invalid={problems.includes("subjectRequired")}
            aria-describedby={problems.includes("subjectRequired") ? `${ids.subject}-error` : undefined}
            onValueChange={(value) => onChange({ subjectId: value })}
            options={[
              { value: "", label: t("noSubject") },
              ...(subjects.data ?? []).map((subject) => ({ value: subject.id, label: subject.name })),
            ]}
          />
          {problems.includes("subjectRequired") ? (
            <p id={`${ids.subject}-error`} role="alert" className="text-destructive text-sm">
              {t("subjectRequired")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.year}>{t("yearLabel")}</Label>
          <Dropdown
            id={ids.year}
            className="w-full"
            value={settings.year === null ? "" : String(settings.year)}
            onValueChange={(value) => onChange({ year: value === "" ? null : Number(value) })}
            options={[
              { value: "", label: t("anyYear") },
              ...YEARS.map((year) => ({ value: String(year), label: t("year", { year }) })),
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.term}>{t("termLabel")}</Label>
          <Dropdown
            id={ids.term}
            className="w-full"
            value={settings.termHalf === null ? "" : String(settings.termHalf)}
            onValueChange={(value) => onChange({ termHalf: value === "" ? null : (Number(value) as 1 | 2) })}
            options={[
              { value: "", label: t("wholeYear") },
              { value: "1", label: t("term", { half: 1 }) },
              { value: "2", label: t("term", { half: 2 }) },
            ]}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">{t("statusLabel")}</legend>
        {statuses.map((status) => (
          <Label key={status} className={radioRow}>
            <input
              type="radio"
              name="list-status"
              value={status}
              className="mt-1 size-4"
              checked={settings.status === status}
              onChange={() => onChange({ status })}
            />
            <span className="flex flex-col">
              <span className="font-medium">{t(`status.${status}`)}</span>
              <span className="text-muted-foreground text-sm">{t(`statusHint.${status}`)}</span>
            </span>
          </Label>
        ))}
      </fieldset>
    </div>
  )
}
