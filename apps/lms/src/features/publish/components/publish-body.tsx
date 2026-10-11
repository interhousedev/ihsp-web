"use client"

import {
  isApiError,
  keys,
  postLmsCourseDiscard,
  postLmsCoursePublish,
  type PendingChanges,
  type VersionItem,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Field,
  FieldDescription,
  FieldLabel,
  Icons,
  LoadingButton,
  Textarea,
} from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { hrefs } from "../../shared/utils/hrefs"
import { can, type CoursePermission } from "../../shared/utils/permissions"
import { PendingStepRow } from "./pending-step-row"

/**
 * Pending changes with diffs, the note and Publish (UF-LMS-10). Publish sends the `draft_seq` the list was loaded with;
 * if the draft changed meanwhile the server answers `lms/draft-changed` and the list must be reviewed again.
 */
export function PublishBody({
  courseId,
  pending,
  permissions,
  reload,
}: {
  courseId: string
  pending: PendingChanges
  permissions: readonly CoursePermission[]
  reload: () => void
}) {
  const t = useT("publish")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [note, setNote] = useState("")
  const [discardOpen, setDiscardOpen] = useState(false)
  const [published, setPublished] = useState<VersionItem | null>(null)

  const hasPending = pending.steps.length > 0 || pending.outline_changed
  const canPublish = can(permissions, "publish")
  const canDiscard = can(permissions, "edit")

  function refreshAll() {
    void queryClient.invalidateQueries({ queryKey: keys.lms.draft(courseId) })
    void queryClient.invalidateQueries({ queryKey: keys.lms.pending(courseId) })
    void queryClient.invalidateQueries({ queryKey: keys.lms.versions(courseId) })
  }

  const publish = useMutation<VersionItem, unknown, void>({
    mutationFn: () =>
      postLmsCoursePublish(courseId, { draft_seq: pending.draft_seq, ...(note.trim() ? { note: note.trim() } : {}) }),
    onSuccess: (version) => {
      setPublished(version)
      setNote("")
      refreshAll()
    },
  })
  const discard = useMutation({
    mutationFn: () => postLmsCourseDiscard(courseId),
    onSuccess: () => {
      setDiscardOpen(false)
      setPublished(null)
      refreshAll()
      void queryClient.invalidateQueries({ queryKey: keys.lms.all() })
    },
  })

  const draftChanged = isApiError(publish.error) && publish.error.type === "lms/draft-changed"

  function reviewAgain() {
    publish.reset()
    void queryClient.invalidateQueries({ queryKey: ["lms", "steps"] })
    reload()
  }

  return (
    <div className="flex flex-col gap-4">
      {published ? (
        <Alert role="status">
          <Icons.circleCheck aria-hidden />
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{t("published", { number: published.number })}</span>
            <Link href={hrefs.versions(courseId)} className="text-primary underline-offset-2 hover:underline">
              {t("openVersions")}
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      {!hasPending ? (
        <p className="text-muted-foreground text-sm">{t("noPending")}</p>
      ) : (
        <>
          <p className="text-sm">
            {t("summary", {
              added: pending.steps.filter((step) => step.change === "added").length,
              changed: pending.steps.filter((step) => step.change === "changed").length,
              removed: pending.steps.filter((step) => step.change === "removed").length,
            })}
          </p>
          {pending.outline_changed ? (
            <Alert>
              <Icons.info aria-hidden />
              <AlertDescription>{t("outlineChanged")}</AlertDescription>
            </Alert>
          ) : null}
          <ul className="flex flex-col gap-3">
            {pending.steps.map((step) => (
              <PendingStepRow key={step.step_id} step={step} />
            ))}
          </ul>
        </>
      )}

      {draftChanged ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{t("draftChanged")}</span>
            <Button size="sm" onClick={reviewAgain} className="min-h-11 md:min-h-7">
              {t("reviewAgain")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : publish.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(publish.error)}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="publish-note">{t("note")}</FieldLabel>
            <Textarea
              id="publish-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              maxLength={500}
              placeholder={t("notePlaceholder")}
              disabled={!canPublish}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <LoadingButton
              onClick={() => publish.mutate()}
              disabled={!hasPending || !canPublish}
              loading={publish.isPending}
              className="min-h-11 md:min-h-8"
            >
              {t("publish")}
            </LoadingButton>
            {canDiscard ? (
              <Button
                variant="outline"
                onClick={() => setDiscardOpen(true)}
                disabled={!hasPending}
                className="min-h-11 md:min-h-8"
              >
                {t("discardAll")}
              </Button>
            ) : null}
            {!canPublish ? <span className="text-muted-foreground text-sm">{t("cannotPublish")}</span> : null}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title={t("discardTitle")}
        description={t("discardDescription")}
        confirmLabel={t("discardAll")}
        destructive
        loading={discard.isPending}
        onConfirm={() => discard.mutate()}
      />
      {discard.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(discard.error)}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
