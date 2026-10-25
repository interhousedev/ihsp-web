"use client"

import { getLmsCourseLinkCheckQuery, lmsLinkCheckKey, postLmsCourseLinkCheck, type LinkCheckResult } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, LoadingButton } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { hrefs } from "../../shared/utils/hrefs"

export const LINK_CHECK_POLL_MS = 2000

/** "Validate links": starts the check, polls while it runs and lists the broken links with a link to their step. */
export function LinkCheckPanel({ courseId, pollMs = LINK_CHECK_POLL_MS }: { courseId: string; pollMs?: number }) {
  const t = useT("courseSettings")
  const errorMessage = useErrorMessage()
  const format = useFormatters()
  const queryClient = useQueryClient()
  const state = useQuery({
    ...getLmsCourseLinkCheckQuery(courseId),
    refetchInterval: (query) => (query.state.data?.status === "running" ? pollMs : false),
  })
  const start = useMutation({
    mutationFn: () => postLmsCourseLinkCheck(courseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lmsLinkCheckKey(courseId) }),
  })
  const running = state.data?.status === "running" || start.isPending
  const broken = (state.data?.results ?? []).filter((result) => !result.ok)

  return (
    <section aria-labelledby="link-check" className="flex flex-col gap-3">
      <h3 id="link-check" className="text-sm font-semibold">
        {t("linkCheck")}
      </h3>
      <LoadingButton
        variant="outline"
        loading={running}
        onClick={() => start.mutate()}
        className="min-h-11 self-start md:min-h-8"
      >
        {running ? t("linkCheckRunning") : t("linkCheckStart")}
      </LoadingButton>
      {start.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(start.error)}</AlertDescription>
        </Alert>
      ) : null}
      {state.data?.status === "done" ? (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs">
            {state.data.checked_at ? t("checkedAt", { date: format.dateTime(state.data.checked_at) }) : null}
          </p>
          {broken.length === 0 ? (
            <p className="text-sm">{t("linksOk", { count: state.data.results.length })}</p>
          ) : (
            <ul aria-label={t("brokenLinks")} className="flex flex-col gap-2">
              {broken.map((result) => (
                <BrokenLink key={`${result.step_id}-${result.url}`} result={result} />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  )
}

function BrokenLink({ result }: { result: LinkCheckResult }) {
  const t = useT("courseSettings")
  return (
    <li className="rounded-lg border p-2 text-sm">
      <p className="font-medium break-all">{result.url}</p>
      <p className="text-destructive text-xs">
        {result.error ? t(`linkErrors.${result.error}`) : t("linkStatus", { code: result.status_code ?? 0 })}
      </p>
      <Link href={hrefs.editStep(result.step_id)} className="text-xs underline">
        {result.step_title}
      </Link>
    </li>
  )
}
