import { useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, CardHeader, CardTitle, MarkBadge, Progress, Stat, StatusBadge } from "@ihsp/ui"
import { IconBook, IconBooks, IconChevronRight, IconNotebook } from "@ihsp/ui"
import { BottomNav, LESSONS, MARKS, PageTitle, Screen, SideNav, TopBar } from "./parts"

function LessonRows({ limit = 5 }: { limit?: number }) {
  const t = useT("landing.demo")
  return (
    <ul className="divide-y">
      {LESSONS.slice(0, limit).map((lesson) => (
        <li key={lesson.time} className="flex items-center gap-4 py-2.5">
          <span className="text-muted-foreground w-12 text-sm tabular-nums">{lesson.time}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{t(`subjects.${lesson.subject}`)}</span>
            <span className="text-muted-foreground block text-xs">
              {t("room")} {lesson.room} · {lesson.teacher}
            </span>
          </span>
          <IconBook className="text-muted-foreground size-5" aria-hidden />
        </li>
      ))}
    </ul>
  )
}

function GpaCard() {
  const t = useT("landing.demo")
  return (
    <Card>
      <CardContent className="flex items-center justify-between px-4">
        <div>
          <p className="text-muted-foreground text-xs">{t("gpa")}</p>
          <p className="text-2xl font-semibold tabular-nums">
            4.5 <span className="text-muted-foreground text-base font-normal">/ 5</span>
          </p>
        </div>
        <span className="flex items-center gap-1 text-sm">
          {t("grades")}
          <IconChevronRight className="size-4" aria-hidden />
        </span>
      </CardContent>
    </Card>
  )
}

/** The home page on a phone: today's lessons, GPA and a bottom bar. */
export function DashboardPhone() {
  const t = useT("landing.demo")
  return (
    <Screen>
      <TopBar initials="AA" unread={3} />
      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 pt-1">
        <PageTitle>{t("dashboard")}</PageTitle>
        <Card>
          <CardHeader>
            <CardTitle>{t("todayLessons")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <LessonRows />
          </CardContent>
        </Card>
        <GpaCard />
      </div>
      <BottomNav
        active="home"
        items={[
          { key: "home", label: t("nav.home") },
          { key: "calendar", label: t("nav.calendar") },
          { key: "marks", label: t("nav.marks") },
          { key: "tasks", label: t("nav.tasks") },
        ]}
      />
    </Screen>
  )
}

const NAV_ITEMS = ["home", "calendar", "marks", "tasks", "library", "assistant"] as const

/** The home page on a laptop: sidebar, widgets in an even grid. */
export function DashboardLaptop() {
  const t = useT("landing.demo")
  return (
    <Screen className="flex-row">
      <SideNav active="home" name={t("appName")} items={NAV_ITEMS.map((key) => ({ key, label: t(`nav.${key}`) }))} />
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
        <PageTitle action={<Badge variant="neutral">{t("weekday")}</Badge>}>{t("dashboard")}</PageTitle>
        <div className="grid grid-cols-3 gap-3">
          <Stat label={t("gpa")} value="4.5" hint={t("gpaHint")} />
          <Stat label={t("absences")} value="2" hint={t("absencesHint")} />
          <Stat label={t("homework")} value="3" hint={t("homeworkHint")} />
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-5 gap-3">
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>{t("todayLessons")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <LessonRows limit={4} />
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>{t("recentMarks")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 px-4">
              {MARKS.slice(0, 4).map((row) => (
                <div key={row.subject} className="flex items-center justify-between">
                  <span>{t(`subjects.${row.subject}`)}</span>
                  <MarkBadge mark={row.mark} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Screen>
  )
}

/** The dashboard widgets (library, recent notebook, homework) on a tablet. */
export function DashboardTablet() {
  const t = useT("landing.demo")
  return (
    <Screen>
      <TopBar initials="AA" unread={3} />
      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-6 pt-1">
        <PageTitle>{t("dashboard")}</PageTitle>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("todayLessons")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <LessonRows limit={3} />
            </CardContent>
          </Card>
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconNotebook className="size-4" aria-hidden />
                  {t("recentNotebook")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 px-4">
                <p className="font-medium">{t("notebookTitle")}</p>
                <p className="text-muted-foreground text-xs">{t("notebookMeta")}</p>
                <Progress value={72} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBooks className="size-4" aria-hidden />
                  {t("libraryWidget")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between px-4">
                <span className="font-medium">{t("bookTitle")}</span>
                <StatusBadge tone="success" label={t("available")} />
              </CardContent>
            </Card>
          </div>
        </div>
        <GpaCard />
      </div>
    </Screen>
  )
}
