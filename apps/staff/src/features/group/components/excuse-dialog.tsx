"use client"

import { rosterOf, useStaffLesson, type SheetRosterItem } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  StateView,
} from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { QueryState } from "../../shared/components/query-state"
import { fullName } from "../../shared/utils/people"
import { useSetExcuse } from "../hooks/use-set-excuse"

function ExcuseRow({
  item,
  busy,
  onSet,
}: {
  item: SheetRosterItem
  busy: boolean
  onSet: (excused: boolean, comment: string) => void
}) {
  const t = useT("group.excuse")
  const [comment, setComment] = useState(item.excuse_comment ?? "")
  const name = fullName(item)
  return (
    <li className="flex flex-col gap-2 rounded-lg border p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{name}</span>
        {item.excused ? (
          <Badge variant="outline">{t("excused")}</Badge>
        ) : (
          <Badge variant="destructive">{t("unexcused")}</Badge>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={comment}
          aria-label={t("comment", { name })}
          placeholder={t("commentPlaceholder")}
          className="h-11 md:h-8"
          onChange={(event) => setComment(event.target.value)}
        />
        {item.excused ? (
          <Button variant="outline" className="min-h-11 md:min-h-8" disabled={busy} onClick={() => onSet(false, "")}>
            {t("remove")}
          </Button>
        ) : (
          <Button
            className="min-h-11 md:min-h-8"
            disabled={busy}
            aria-label={t("markFor", { name })}
            onClick={() => onSet(true, comment.trim())}
          >
            {t("mark")}
          </Button>
        )}
      </div>
    </li>
  )
}

function ExcuseList({ lessonId }: { lessonId: string }) {
  const t = useT("group.excuse")
  const errorMessage = useErrorMessage()
  const lesson = useStaffLesson(lessonId)
  const set = useSetExcuse(lessonId)
  const [busy, setBusy] = useState<string | null>(null)

  function submit(studentId: string, excused: boolean, comment: string) {
    setBusy(studentId)
    set.mutate(
      { student_id: studentId, excused, ...(excused && comment !== "" ? { comment } : {}) },
      {
        onSuccess: () => toast.success(excused ? t("marked") : t("removed")),
        onSettled: () => setBusy(null),
      },
    )
  }

  return (
    <QueryState query={lesson} rows={2}>
      {(data) => {
        const absent = rosterOf(data.attendance).filter((item) => item.absent)
        if (absent.length === 0) return <StateView state="empty" emptyText={t("noAbsences")} />
        return (
          <>
            <ul className="flex flex-col gap-2">
              {absent.map((item) => (
                <ExcuseRow
                  key={item.user_id}
                  item={item}
                  busy={busy === item.user_id}
                  onSet={(excused, comment) => submit(item.user_id, excused, comment)}
                />
              ))}
            </ul>
            {set.isError ? (
              <p role="alert" className="text-destructive text-sm">
                {errorMessage(set.error)}
              </p>
            ) : null}
          </>
        )
      }}
    </QueryState>
  )
}

/**
 * Excuse marking (ACA-20, UF-STF-11 step 4): the absences of one lesson with an Excused button and an optional
 * comment (a medical note). The curator opens it from the "per lesson" view of the group report.
 */
export function ExcuseDialog({
  lessonId,
  label,
  onClose,
}: {
  lessonId: string | null
  label: string
  onClose: () => void
}) {
  const t = useT("group.excuse")
  return (
    <Dialog open={lessonId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>
        {lessonId ? <ExcuseList key={lessonId} lessonId={lessonId} /> : null}
      </DialogContent>
    </Dialog>
  )
}
