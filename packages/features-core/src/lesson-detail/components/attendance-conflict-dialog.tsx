"use client"

import type { AttendanceSheet } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@ihsp/ui"
import { fullName } from "../utils/people"
import { rosterOf } from "../utils/marks"

/**
 * Shown when the server answers `409 common/conflict` (UF-STF-06 3a): someone changed the attendance meanwhile (bot,
 * journal or another tab). It lists the current absences; the teacher either takes the current list or keeps their
 * own marks and submits them again on top of it.
 */
export function AttendanceConflictDialog({
  theirs,
  onReview,
  onKeepMine,
}: {
  theirs: AttendanceSheet | null
  /** Replace the form with the current list. */
  onReview: (sheet: AttendanceSheet) => void
  /** Keep the marks; the next submit is checked against the current version. */
  onKeepMine: (sheet: AttendanceSheet) => void
}) {
  const t = useT("lessonDetail.attendance.conflict")
  const f = useFormatters()
  const absent = theirs ? rosterOf(theirs).filter((item) => item.absent) : []

  return (
    <Dialog open={theirs !== null} onOpenChange={(open) => !open && theirs && onKeepMine(theirs)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {theirs?.submitted_by && theirs.submitted_at
              ? t("descriptionBy", {
                  name: fullName(theirs.submitted_by),
                  time: f.dateTime(theirs.submitted_at),
                })
              : t("description")}
          </DialogDescription>
        </DialogHeader>
        <section aria-label={t("currentList")} className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">{t("currentList")}</h3>
          {absent.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noAbsences")}</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {absent.map((item) => (
                <li key={item.user_id}>{fullName(item)}</li>
              ))}
            </ul>
          )}
        </section>
        <DialogFooter>
          <Button variant="outline" className="min-h-11 md:min-h-8" onClick={() => theirs && onKeepMine(theirs)}>
            {t("keepMine")}
          </Button>
          <Button className="min-h-11 md:min-h-8" onClick={() => theirs && onReview(theirs)}>
            {t("review")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
