import { useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, MarkBadge, StatusBadge, cn } from "@ihsp/ui"
import { BottomNav, LESSONS, MARKS, PageTitle, Screen, TopBar } from "./parts"

const DAYS = ["mon", "tue", "wed", "thu", "fri"] as const

function PhoneNav({ active }: { active: string }) {
  const t = useT("landing.demo")
  return (
    <BottomNav
      active={active}
      items={[
        { key: "home", label: t("nav.home") },
        { key: "calendar", label: t("nav.calendar") },
        { key: "marks", label: t("nav.marks") },
        { key: "tasks", label: t("nav.tasks") },
      ]}
    />
  )
}

/** The timetable of the school week (Monday to Friday) on a phone. */
export function TimetablePhone() {
  const t = useT("landing.demo")
  return (
    <Screen>
      <TopBar initials="AA" unread={3} />
      <div className="flex flex-1 flex-col gap-3 overflow-hidden px-4 pt-1">
        <PageTitle>{t("nav.calendar")}</PageTitle>
        <div className="grid grid-cols-5 gap-1.5">
          {DAYS.map((day, index) => (
            <span
              key={day}
              className={cn(
                "flex flex-col items-center rounded-lg border py-2 text-xs",
                index === 0 ? "bg-primary text-primary-foreground border-transparent" : "text-muted-foreground",
              )}
            >
              {t(`days.${day}`)}
              <span className="text-base font-semibold tabular-nums">{26 + index}</span>
            </span>
          ))}
        </div>
        <ul className="flex flex-col gap-2">
          {LESSONS.map((lesson, index) => (
            <li key={lesson.time} className="bg-card rounded-card flex items-stretch gap-3 border p-3">
              <span className="flex w-12 flex-col justify-center text-xs tabular-nums">
                <span className="text-foreground font-semibold">{lesson.time}</span>
                <span className="text-muted-foreground">{LESSON_ENDS[index]}</span>
              </span>
              <span className="bg-[var(--brand)] w-1 rounded-full" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{t(`subjects.${lesson.subject}`)}</span>
                <span className="text-muted-foreground block text-xs">
                  {t("room")} {lesson.room} · {lesson.teacher}
                </span>
              </span>
              {index === 1 ? <StatusBadge tone="warning" label={t("moved")} className="self-center" /> : null}
            </li>
          ))}
        </ul>
      </div>
      <PhoneNav active="calendar" />
    </Screen>
  )
}

const LESSON_ENDS = ["09:50", "11:30", "13:30", "15:00", "16:30"]

/** Grades by subject with a new mark on top, on a phone. */
export function MarksPhone() {
  const t = useT("landing.demo")
  return (
    <Screen>
      <TopBar initials="AA" unread={1} />
      <div className="flex flex-1 flex-col gap-3 overflow-hidden px-4 pt-1">
        <PageTitle>{t("nav.marks")}</PageTitle>
        <Card className="ring-[var(--brand)]/40 bg-[var(--brand-soft)]">
          <CardContent className="flex items-center gap-3 px-4">
            <MarkBadge mark={5} size="lg" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{t("newMark")}</span>
              <span className="text-muted-foreground block text-xs">
                {t("subjects.math")} · {t("pk")}
              </span>
            </span>
            <Badge variant="info">{t("new")}</Badge>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-2">
          {MARKS.map((row) => (
            <Card key={row.subject} size="sm">
              <CardContent className="flex items-center justify-between px-3">
                <span className="truncate text-sm">{t(`subjects.${row.subject}`)}</span>
                <MarkBadge mark={row.mark} />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="rounded-card flex items-center justify-between border px-4 py-3">
          <span className="text-muted-foreground text-xs">{t("gpa")}</span>
          <span className="text-xl font-semibold tabular-nums">4.5</span>
        </div>
      </div>
      <PhoneNav active="marks" />
    </Screen>
  )
}
