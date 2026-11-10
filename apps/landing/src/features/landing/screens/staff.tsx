import { useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, MarkBadge, StatusBadge, cn } from "@ihsp/ui"
import { IconChevronDown, IconDownload, IconFileText, IconMessage, IconPaperclip, IconUpload } from "@ihsp/ui"
import { PageTitle, Screen, SideNav, TopBar } from "./parts"

const STUDENTS = ["Ergashev G.", "Karimov A.", "Nazarova D.", "Rahimov S.", "Tursunova M.", "Yusupov T."] as const
/** Per lesson column: a mark, or a flag for present / absent / late / excused. */
const GRID: (number | "n" | "l" | "e" | null)[][] = [
  [5, 4, null, 5],
  [4, null, 5, 4],
  [null, 5, "n", 5],
  [5, 5, 4, null],
  [3, "l", 4, 4],
  ["e", 4, 5, 5],
]

const FLAG_KEY = { n: "absent", l: "late", e: "excused" } as const

/** The teacher's journal: marks and attendance by lesson, excused lessons locked. */
export function JournalLaptop() {
  const t = useT("landing.demo")
  return (
    <Screen className="flex-row">
      <SideNav
        active="journal"
        name={t("appStaff")}
        items={(["home", "calendar", "journal", "attendance"] as const).map((key) => ({ key, label: t(`nav.${key}`) }))}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-6">
        <PageTitle
          action={
            <Button variant="outline" size="sm" tabIndex={-1}>
              <IconUpload aria-hidden />
              {t("export")}
            </Button>
          }
        >
          {t("nav.journal")}
        </PageTitle>
        <div className="flex h-9 w-72 items-center justify-between rounded-lg border px-3 text-[13px]">
          {t("subjects.math")} · 1TN1
          <IconChevronDown className="size-4" aria-hidden />
        </div>
        <div className="rounded-card overflow-hidden border">
          <div className="bg-muted/50 grid grid-cols-[150px_repeat(4,1fr)] border-b text-center text-xs">
            <span className="px-3 py-2 text-left font-medium">{t("student")}</span>
            {["2 Sep", "4 Sep", "9 Sep", "11 Sep"].map((date, index) => (
              <span key={date} className="flex flex-col items-center gap-1 border-l py-2">
                <span className="font-medium">{t(`dates.${index}`)}</span>
                <StatusBadge
                  tone={index === 3 ? "neutral" : "success"}
                  label={index === 3 ? t("notTaken") : t("taken")}
                />
              </span>
            ))}
          </div>
          {STUDENTS.map((name, row) => (
            <div
              key={name}
              className="grid grid-cols-[150px_repeat(4,1fr)] items-center border-b text-sm last:border-b-0"
            >
              <span className="px-3 py-2">{name}</span>
              {GRID[row]!.map((cell, column) => (
                <span key={column} className="flex justify-center border-l py-1.5">
                  {typeof cell === "number" ? (
                    <MarkBadge mark={cell} />
                  ) : cell ? (
                    <Badge variant={cell === "e" ? "info" : cell === "n" ? "destructive" : "warning"}>
                      {t(`flags.${FLAG_KEY[cell]}`)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">{t("journalHint")}</p>
      </div>
    </Screen>
  )
}

const THREAD = ["student", "curator"] as const

/** The excuses page on a tablet: a request with its documents and the message thread, status chips on top. */
export function ExcusesTablet() {
  const t = useT("landing.demo")
  return (
    <Screen>
      <TopBar initials="AA" />
      <div className="grid flex-1 grid-cols-[260px_1fr] gap-4 overflow-hidden px-6 pt-1">
        <div className="flex flex-col gap-2">
          <PageTitle>{t("excuses")}</PageTitle>
          {(["pending", "approved", "rejected"] as const).map((status, index) => (
            <Card key={status} size="sm" className={index === 0 ? "ring-[var(--brand)]" : undefined}>
              <CardContent className="flex flex-col gap-1.5 px-3">
                <span className="flex items-center justify-between">
                  <span className="text-[13px] font-medium">{t(`excuseTitle.${status}`)}</span>
                  <StatusBadge
                    tone={status === "approved" ? "success" : status === "rejected" ? "destructive" : "warning"}
                    label={t(`status.${status}`)}
                  />
                </span>
                <span className="text-muted-foreground text-[11px]">{t(`excuseDates.${status}`)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="min-h-0">
          <CardContent className="flex h-full flex-col gap-3 px-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("excuseTitle.pending")}</span>
              <StatusBadge tone="warning" label={t("status.pending")} />
            </div>
            <span className="flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px]">
              <IconFileText className="size-4" aria-hidden />
              {t("document")}
              <IconDownload className="text-muted-foreground ml-auto size-4" aria-hidden />
            </span>
            {THREAD.map((author) => (
              <div
                key={author}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px]",
                  author === "student"
                    ? "bg-muted self-start rounded-bl-sm"
                    : "self-end rounded-br-sm bg-[var(--brand)] text-[var(--brand-ink)]",
                )}
              >
                {t(`thread.${author}`)}
              </div>
            ))}
            <div className="text-muted-foreground rounded-card mt-auto flex items-center gap-2 border px-3 py-2 text-[13px]">
              <IconPaperclip className="size-4" aria-hidden />
              <span className="flex-1">{t("replyPlaceholder")}</span>
              <IconMessage className="size-4" aria-hidden />
            </div>
          </CardContent>
        </Card>
      </div>
    </Screen>
  )
}
