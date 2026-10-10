"use client"

import { getLmsStepHistoryQuery, postLmsStepRestore, type RevisionItem, type StepDraft } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  ConfirmDialog,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@ihsp/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { QueryState } from "../../shared/components/query-state"
import { personName } from "../../shared/utils/people"

/** The history of a step: published revisions and checkpoints, newest first, with Restore (LMS-12). */
export function HistorySheet({
  stepId,
  open,
  onOpenChange,
  hasUnsavedEdits,
  onRestored,
}: {
  stepId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  hasUnsavedEdits: boolean
  onRestored: (draft: StepDraft) => void
}) {
  const t = useT("history")
  const format = useFormatters()
  const errorMessage = useErrorMessage()
  const history = useQuery({
    ...getLmsStepHistoryQuery(stepId),
    enabled: open,
  })
  const [target, setTarget] = useState<RevisionItem | null>(null)
  const restore = useMutation<StepDraft, unknown, string>({
    mutationFn: (revisionId) => postLmsStepRestore(stepId, { revision_id: revisionId }),
    onSuccess: (draft) => {
      setTarget(null)
      onOpenChange(false)
      onRestored(draft)
    },
  })

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("title")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4 pb-4">
            {restore.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage(restore.error)}</AlertDescription>
              </Alert>
            ) : null}
            <QueryState query={history} isEmpty={(items) => items.length === 0} emptyText={t("empty")}>
              {(items) => (
                <ul className="flex flex-col gap-2">
                  {items.map((item) => (
                    <li key={item.id} className="flex flex-col gap-1 rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.kind === "publish" ? "default" : "secondary"}>
                          {t(`kinds.${item.kind}`)}
                        </Badge>
                        {item.published ? <Badge variant="outline">{t("published")}</Badge> : null}
                      </div>
                      <p className="text-sm font-medium break-words">{item.label ?? t("noLabel")}</p>
                      <p className="text-muted-foreground text-xs">
                        {personName(item.created_by)} · {format.dateTime(item.created_at)}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTarget(item)}
                        className="mt-1 w-fit min-h-11 md:min-h-7"
                      >
                        {t("restore")}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </QueryState>
          </div>
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(next) => !next && setTarget(null)}
        title={t("restoreTitle")}
        description={hasUnsavedEdits ? t("restoreDescriptionUnsaved") : t("restoreDescription")}
        confirmLabel={t("restore")}
        loading={restore.isPending}
        onConfirm={() => {
          if (target) restore.mutate(target.id)
        }}
      />
    </>
  )
}
