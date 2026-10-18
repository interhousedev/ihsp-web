"use client"

import { getAdminLogIssuesQuery, LOG_LEVELS, type LogIssue, type LogLevel } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Dropdown, PageContainer, type DropdownOption } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"
import { useMemo } from "react"
import { QueryState } from "../../shared/components/query-state"

const ALL = "all"
const PAGE_SIZE = 20

/** Level badges: the colour helps, the text label always says the level. */
const LEVEL_TONE: Record<LogLevel, string> = {
  fatal: "border-transparent bg-red-700 text-white",
  error: "border-red-600/40 bg-red-600/10 text-red-700 dark:text-red-400",
  warning: "border-amber-600/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  info: "border-blue-600/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  debug: "border-border bg-muted text-muted-foreground",
}

function LevelBadge({ level }: { level: string }) {
  const t = useT("logs")
  const known = (LOG_LEVELS as readonly string[]).includes(level)
  return (
    <Badge variant="outline" className={known ? LEVEL_TONE[level as LogLevel] : undefined}>
      {known ? t(`levels.${level}`) : level}
    </Badge>
  )
}

function IssueRow({ issue }: { issue: LogIssue }) {
  const t = useT("logs")
  const f = useFormatters()
  return (
    <li className="flex flex-col gap-2 border-b py-3 last:border-b-0 md:flex-row md:items-center md:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge level={issue.level} />
          <span className="text-muted-foreground text-xs">{issue.project}</span>
        </div>
        <span className="font-medium break-words">{issue.title}</span>
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm md:w-72 md:justify-end">
        <span>{t("count", { count: issue.count })}</span>
        <span>
          {t("lastSeen")}: {issue.last_seen ? f.dateTime(issue.last_seen) : t("never")}
        </span>
      </div>
      <a
        href={issue.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary text-sm font-medium underline-offset-4 hover:underline md:min-h-11 md:content-center"
      >
        {t("open")}
      </a>
    </li>
  )
}

/** Logs (admin): the error-tracker issues, filtered by project and level, one page at a time. */
export function LogsPage() {
  const t = useT("logs")
  const [{ project, level, page }, setFilters] = useQueryStates({
    project: parseAsString,
    level: parseAsStringLiteral(LOG_LEVELS),
    page: parseAsInteger.withDefault(1),
  })

  const params = { project: project ?? undefined, level: level ?? undefined, page, size: PAGE_SIZE }
  const query = useQuery(getAdminLogIssuesQuery(params))
  const data = query.data

  const projectOptions = useMemo<DropdownOption[]>(
    () => [
      { value: ALL, label: t("filters.projectAll") },
      ...(data?.projects ?? []).map((name) => ({ value: name, label: name })),
    ],
    [data?.projects, t],
  )
  const levelOptions = useMemo<DropdownOption[]>(
    () => [
      { value: ALL, label: t("filters.levelAll") },
      ...LOG_LEVELS.map((value) => ({ value, label: t(`levels.${value}`) })),
    ],
    [t],
  )

  return (
    <PageContainer title={t("title")}>
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 sm:max-w-2xl">
          <Dropdown
            aria-label={t("filters.project")}
            value={project ?? ALL}
            options={projectOptions}
            onValueChange={(value) => void setFilters({ project: value === ALL ? null : value, page: null })}
          />
          <Dropdown
            aria-label={t("filters.level")}
            value={level ?? ALL}
            options={levelOptions}
            onValueChange={(value) =>
              void setFilters({ level: value === ALL ? null : (value as LogLevel), page: null })
            }
          />
        </div>

        <QueryState
          query={query}
          rows={5}
          isEmpty={(result) => !result.disabled && result.items.length === 0}
          emptyText={t("empty")}
        >
          {(result) =>
            result.disabled ? (
              <p role="status" className="text-muted-foreground">
                {t("disabled")}
              </p>
            ) : (
              <>
                <ul className="flex flex-col">
                  {result.items.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} />
                  ))}
                </ul>
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    disabled={result.page <= 1}
                    onClick={() => void setFilters({ page: Math.max(1, result.page - 1) })}
                  >
                    {t("prev")}
                  </Button>
                  <span className="text-muted-foreground text-sm">{t("page", { page: result.page })}</span>
                  <Button
                    variant="outline"
                    disabled={!result.has_next}
                    onClick={() => void setFilters({ page: result.page + 1 })}
                  >
                    {t("next")}
                  </Button>
                </div>
              </>
            )
          }
        </QueryState>
      </div>
    </PageContainer>
  )
}
