"use client"

import type { CuratorStudent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"
import { fullName } from "../../shared/utils/people"
import { formatGpa, formatRate } from "../utils/students"

/**
 * The student card of the curator (UF-STF-09 step 2): subgroup, absence rate, semester GPA and why the student is
 * flagged, with shortcuts to the pages that fix it.
 */
export function StudentDrawer({ student, onClose }: { student: CuratorStudent | null; onClose: () => void }) {
  const t = useT("group.students")
  return (
    <Sheet open={student !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm">
        {student ? (
          <>
            <SheetHeader>
              <SheetTitle>{fullName(student)}</SheetTitle>
              <SheetDescription>{student.registered ? t("registered") : t("notRegistered")}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4 pb-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("subgroup")}</dt>
                  <dd className="font-medium">
                    {student.subgroup === null
                      ? t("subgroupNotSet")
                      : t("subgroupNumber", { number: student.subgroup })}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("absenceRate")}</dt>
                  <dd className="font-medium tabular-nums">{formatRate(student.absence_rate)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("gpa")}</dt>
                  <dd className="font-medium tabular-nums">{formatGpa(student.gpa)}</dd>
                </div>
              </dl>
              {student.flags.length > 0 ? (
                <section aria-label={t("attention")} className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">{t("attention")}</h3>
                  <ul className="flex flex-col gap-2">
                    {student.flags.map((flag) => (
                      <li key={flag} className="flex flex-col gap-1 rounded-lg border p-2">
                        <Badge variant="destructive" className="w-fit">
                          {t(`flags.${flag}`)}
                        </Badge>
                        <span className="text-muted-foreground text-xs">{t(`flagHints.${flag}`)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <p className="text-muted-foreground text-sm">{t("noFlags")}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <LinkButton href="/group/attendance/">{t("openAttendance")}</LinkButton>
                {student.subgroup === null ? (
                  <LinkButton href="/group/subgroups/">{t("assignSubgroup")}</LinkButton>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
