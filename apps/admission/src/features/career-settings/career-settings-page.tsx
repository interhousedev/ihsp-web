"use client"

import { slugify } from "../../components/lib/slug"
import { AppPageHeader, pageClass } from "../../components/lib/page"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  Card,
  CardContent,
  Icons,
  Input,
  Label,
  LoadingButton,
  ResponsiveDialog,
  StateView,
} from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { AdmissionShell } from "../shell/components/admission-shell"
import {
  SECTIONS,
  useAdminMajors,
  useAdminQuestions,
  useSaveMajor,
  useSaveQuestion,
  type CareerMajor,
  type CareerQuestion,
} from "./api"

const LOCALES = ["uz", "ru", "en"] as const
const SELECT = "border-input bg-background h-9 rounded-md border px-2 text-sm"

const localized = (text: Record<string, string>, locale: string) =>
  text[locale] || text.en || Object.values(text)[0] || ""
const filled = (text: Record<string, string>) =>
  Object.fromEntries(Object.entries(text).filter(([, value]) => value.trim() !== ""))
/** The seeded major areas are stored in English; known ones get a translated label, others show as typed. */
const AREA_KEYS: Record<string, string> = {
  STEM: "stem",
  Business: "business",
  Health: "health",
  "Social sciences": "social",
  Humanities: "humanities",
  Arts: "arts",
}

function LocalizedFields({
  idPrefix,
  label,
  value,
  onChange,
}: {
  idPrefix: string
  label: string
  value: Record<string, string>
  onChange: (next: Record<string, string>) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {LOCALES.map((locale) => (
        <div key={locale} className="flex flex-col gap-1">
          <Label htmlFor={`${idPrefix}-${locale}`}>{`${label} (${locale})`}</Label>
          <Input
            id={`${idPrefix}-${locale}`}
            value={value[locale] ?? ""}
            onChange={(e) => onChange({ ...value, [locale]: e.target.value })}
          />
        </div>
      ))}
    </div>
  )
}

function QuestionDialog({ question, onClose }: { question?: CareerQuestion; onClose: () => void }) {
  const t = useT("careerSettings")
  const errorMessage = useErrorMessage()
  const save = useSaveQuestion()
  const [section, setSection] = useState<CareerQuestion["section"]>(question?.section ?? "interests")
  const [prompt, setPrompt] = useState<Record<string, string>>(question?.prompt ?? {})
  const [order, setOrder] = useState(String(question?.sort_order ?? 0))
  const [active, setActive] = useState(question?.active ?? true)

  async function send(event: FormEvent) {
    event.preventDefault()
    try {
      await save.mutateAsync({
        id: question?.id,
        input: {
          section,
          prompt: filled(prompt),
          sort_order: Number(order) || 0,
          active,
        },
      })
      toast.success(t("saved"))
      onClose()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={question ? t("editQuestion") : t("addQuestion")}
      onSubmit={send}
      footer={
        <LoadingButton type="submit" loading={save.isPending}>
          {t("save")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="cq-section">{t("section")}</Label>
          <select
            id="cq-section"
            className={SELECT}
            value={section}
            onChange={(e) => setSection(e.target.value as CareerQuestion["section"])}
          >
            {SECTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`sections.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <LocalizedFields idPrefix="cq-prompt" label={t("prompt")} value={prompt} onChange={setPrompt} />
        <div className="flex flex-col gap-1">
          <Label htmlFor="cq-order">{t("order")}</Label>
          <Input id="cq-order" type="number" min={0} value={order} onChange={(e) => setOrder(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          {t("active")}
        </label>
      </div>
    </ResponsiveDialog>
  )
}

function MajorDialog({ major, onClose }: { major?: CareerMajor; onClose: () => void }) {
  const t = useT("careerSettings")
  const errorMessage = useErrorMessage()
  const save = useSaveMajor()
  const [code, setCode] = useState(major?.code ?? "")
  const [editCode, setEditCode] = useState(false)
  const u = useT("settingsUx")
  const [area, setArea] = useState(major?.area ?? "")
  const [name, setName] = useState<Record<string, string>>(major?.name ?? {})
  const autoCode = slugify(name.en ?? Object.values(name).find((v) => v.trim()) ?? "")
  const shownCode = major !== undefined || editCode ? code : autoCode
  const [order, setOrder] = useState(String(major?.sort_order ?? 0))
  const [minorOk, setMinorOk] = useState(major?.minor_ok ?? true)
  const [active, setActive] = useState(major?.active ?? true)

  async function send(event: FormEvent) {
    event.preventDefault()
    try {
      await save.mutateAsync({
        id: major?.id,
        input: {
          code: (major !== undefined || editCode ? code : autoCode).trim(),
          area: area.trim(),
          name: filled(name),
          sort_order: Number(order) || 0,
          minor_ok: minorOk,
          active,
        },
      })
      toast.success(t("saved"))
      onClose()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={major ? t("editMajor") : t("addMajor")}
      onSubmit={send}
      footer={
        <LoadingButton type="submit" loading={save.isPending}>
          {t("save")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="cm-code">{t("code")}</Label>
            <div className="flex gap-2">
              <Input
                id="cm-code"
                value={shownCode}
                readOnly={!editCode}
                disabled={major !== undefined}
                onChange={(e) => setCode(e.target.value)}
              />
              {major === undefined ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11 md:min-h-8"
                  onClick={() => setEditCode((v) => !v)}
                >
                  {editCode ? u("codeAuto") : u("codeEdit")}
                </Button>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="cm-area">{t("area")}</Label>
            <Input id="cm-area" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
        </div>
        <LocalizedFields idPrefix="cm-name" label={t("name")} value={name} onChange={setName} />
        <div className="flex flex-col gap-1">
          <Label htmlFor="cm-order">{t("order")}</Label>
          <Input id="cm-order" type="number" min={0} value={order} onChange={(e) => setOrder(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={minorOk} onChange={(e) => setMinorOk(e.target.checked)} />
          {t("minorOk")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          {t("active")}
        </label>
      </div>
    </ResponsiveDialog>
  )
}

function Row({
  title,
  meta,
  inactive,
  onEdit,
}: {
  title: string
  meta: string
  inactive: boolean
  onEdit: () => void
}) {
  const t = useT("careerSettings")
  return (
    <li>
      <Card>
        <CardContent className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium">{title}</p>
            <p className="text-muted-foreground text-xs">{meta}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {inactive ? <Badge variant="neutral">{t("inactive")}</Badge> : null}
            <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
              <Icons.edit aria-hidden />
              {t("edit")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </li>
  )
}

/** Staff editor of the career inventory questions and of the majors taxonomy. */
export function CareerSettingsBody() {
  const t = useT("careerSettings")
  const locale = useLocale()
  const questions = useAdminQuestions()
  const majors = useAdminMajors()
  const [questionDialog, setQuestionDialog] = useState<{
    question?: CareerQuestion
  } | null>(null)
  const [majorDialog, setMajorDialog] = useState<{
    major?: CareerMajor
  } | null>(null)

  return (
    <div className={pageClass()}>
      <AppPageHeader icon="settings" title={t("title")} />
      <section className="flex flex-col gap-3" aria-labelledby="career-questions">
        <div className="flex items-center justify-between gap-2">
          <h2 id="career-questions" className="text-lg font-semibold">
            {t("questions")}
          </h2>
          <Button type="button" onClick={() => setQuestionDialog({})}>
            <Icons.add aria-hidden />
            {t("addQuestion")}
          </Button>
        </div>
        {questions.isError ? (
          <StateView state="error" error={questions.error} onRetry={() => void questions.refetch()} />
        ) : !questions.data ? (
          <StateView state="loading" rows={3} />
        ) : (
          <ul className="flex flex-col gap-2">
            {questions.data.items.map((question) => (
              <Row
                key={question.id}
                title={localized(question.prompt, locale)}
                meta={t(`sections.${question.section}`)}
                inactive={!question.active}
                onEdit={() => setQuestionDialog({ question })}
              />
            ))}
          </ul>
        )}
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="career-majors">
        <div className="flex items-center justify-between gap-2">
          <h2 id="career-majors" className="text-lg font-semibold">
            {t("majors")}
          </h2>
          <Button type="button" onClick={() => setMajorDialog({})}>
            <Icons.add aria-hidden />
            {t("addMajor")}
          </Button>
        </div>
        {majors.isError ? (
          <StateView state="error" error={majors.error} onRetry={() => void majors.refetch()} />
        ) : !majors.data ? (
          <StateView state="loading" rows={3} />
        ) : (
          <ul className="flex flex-col gap-2">
            {majors.data.items.map((major) => (
              <Row
                key={major.id}
                title={localized(major.name, locale)}
                meta={AREA_KEYS[major.area] ? t(`areas.${AREA_KEYS[major.area]}`) : major.area}
                inactive={!major.active}
                onEdit={() => setMajorDialog({ major })}
              />
            ))}
          </ul>
        )}
      </section>
      {questionDialog ? (
        <QuestionDialog
          key={questionDialog.question?.id ?? "new"}
          question={questionDialog.question}
          onClose={() => setQuestionDialog(null)}
        />
      ) : null}
      {majorDialog ? (
        <MajorDialog
          key={majorDialog.major?.id ?? "new"}
          major={majorDialog.major}
          onClose={() => setMajorDialog(null)}
        />
      ) : null}
    </div>
  )
}

export function CareerSettingsPage() {
  return (
    <AdmissionShell roles={["admin", "counselor"]}>
      <CareerSettingsBody />
    </AdmissionShell>
  )
}
