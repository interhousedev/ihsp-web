import { useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, CardHeader, CardTitle, Progress, StatusBadge } from "@ihsp/ui"
import { IconCircleCheck, IconCircleDashed, IconSearch } from "@ihsp/ui"
import { BottomNav, PageTitle, Screen, TopBar } from "./parts"

const BOOKS = ["a", "b", "c"] as const

/** Library search results on a phone: catalogue books and a recommendation. */
export function LibraryPhone() {
  const t = useT("landing.demo")
  return (
    <Screen>
      <TopBar initials="AA" />
      <div className="flex flex-1 flex-col gap-3 overflow-hidden px-4 pt-1">
        <PageTitle>{t("nav.library")}</PageTitle>
        <div className="text-muted-foreground flex h-10 items-center gap-2 rounded-lg border px-3 text-sm">
          <IconSearch className="size-4" aria-hidden />
          {t("librarySearch")}
        </div>
        <ul className="flex flex-col gap-2">
          {BOOKS.map((key, index) => (
            <li key={key} className="bg-card rounded-card flex gap-3 border p-3">
              <span
                aria-hidden
                className="h-16 w-11 shrink-0 rounded-md bg-gradient-to-br from-[var(--brand)] to-[var(--brand-strong)]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-tight font-medium">{t(`books.${key}.title`)}</span>
                <span className="text-muted-foreground block text-xs">{t(`books.${key}.author`)}</span>
                <StatusBadge
                  className="mt-1.5"
                  tone={index === 2 ? "warning" : "success"}
                  label={index === 2 ? t("onLoan") : t("available")}
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
      <BottomNav
        active="library"
        items={[
          { key: "home", label: t("nav.home") },
          { key: "library", label: t("nav.library") },
          { key: "assistant", label: t("nav.assistant") },
          { key: "tasks", label: t("nav.tasks") },
        ]}
      />
    </Screen>
  )
}

const LESSONS_STATE = ["done", "done", "current", "todo"] as const

/** An LMS course on a tablet: progress and the outline of modules. */
export function LmsTablet() {
  const t = useT("landing.demo")
  return (
    <Screen>
      <TopBar initials="AA" />
      <div className="grid flex-1 grid-cols-[1fr_230px] gap-4 overflow-hidden px-6 pt-1">
        <div className="flex flex-col gap-3">
          <PageTitle>{t("course")}</PageTitle>
          <div className="flex items-center gap-3">
            <Progress value={50} className="flex-1" />
            <span className="text-sm font-semibold tabular-nums">50%</span>
          </div>
          <ul className="flex flex-col gap-2">
            {LESSONS_STATE.map((state, index) => (
              <li
                key={index}
                className={`rounded-card flex items-center gap-3 border p-3 ${state === "current" ? "ring-2 ring-[var(--brand)]" : ""}`}
              >
                {state === "done" ? (
                  <IconCircleCheck className="size-5 text-[var(--brand-text)]" aria-hidden />
                ) : (
                  <IconCircleDashed className="text-muted-foreground size-5" aria-hidden />
                )}
                <span className="flex-1 text-sm font-medium">{t(`module.${index}`)}</span>
                <span className="text-muted-foreground text-xs">{t(`moduleKind.${index % 2}`)}</span>
              </li>
            ))}
          </ul>
        </div>
        <Card className="self-start">
          <CardHeader>
            <CardTitle className="text-sm">{t("courseCert")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-xs">
            <Badge variant="info" className="self-start">
              {t("courseLevel")}
            </Badge>
            <span className="text-muted-foreground">{t("courseHint")}</span>
          </CardContent>
        </Card>
      </div>
    </Screen>
  )
}
