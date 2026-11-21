"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Icons,
  Input,
  Label,
  LoadingButton,
  ResponsiveDialog,
  StateView,
} from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { AdmissionShell } from "../../shell/components/admission-shell"
import {
  scoreName,
  TOTAL_MODES,
  useDeleteCatalogTest,
  useSaveCatalogTest,
  useScoreCatalog,
  type ScoreSection,
  type ScoreTest,
  type ScoreTestInput,
} from "../api"

const SELECT = "border-input bg-background h-9 rounded-md border px-3 text-sm"
const LOCALES = ["en", "ru", "uz"] as const

type SectionForm = {
  key: string
  names: Record<string, string>
  min: string
  max: string
  step: string
  choices: string
}

function toForm(section: ScoreSection): SectionForm {
  return {
    key: section.key,
    names: { ...section.names },
    min: String(section.min),
    max: String(section.max),
    step: String(section.step),
    choices: (section.choices ?? []).join(", "),
  }
}

const blankSection = (): SectionForm => ({ key: "", names: {}, min: "0", max: "100", step: "1", choices: "" })

function toSection(form: SectionForm): ScoreSection {
  return {
    key: form.key.trim(),
    names: Object.fromEntries(Object.entries(form.names).filter(([, value]) => value.trim() !== "")),
    min: Number(form.min),
    max: Number(form.max),
    step: Number(form.step),
    choices: form.choices
      .split(",")
      .map((choice) => choice.trim())
      .filter(Boolean),
  }
}

function SectionEditor({
  form,
  onChange,
  onRemove,
}: {
  form: SectionForm
  onChange: (next: SectionForm) => void
  onRemove?: () => void
}) {
  const t = useT("testCatalog")
  const set = (patch: Partial<SectionForm>) => onChange({ ...form, ...patch })
  return (
    <div className="flex flex-col gap-2 rounded-md border p-2">
      <div className="grid gap-2 sm:grid-cols-4">
        <Input
          aria-label={t("sectionKey")}
          placeholder={t("sectionKey")}
          value={form.key ?? ""}
          onChange={(e) => set({ key: e.target.value })}
        />
        {LOCALES.map((locale) => (
          <Input
            key={locale}
            aria-label={`${t("sectionName")} ${locale}`}
            placeholder={`${t("sectionName")} (${locale})`}
            value={form.names[locale] ?? ""}
            onChange={(e) => set({ names: { ...form.names, [locale]: e.target.value } })}
          />
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <Input
          type="number"
          aria-label={t("min")}
          placeholder={t("min")}
          value={form.min ?? ""}
          onChange={(e) => set({ min: e.target.value })}
        />
        <Input
          type="number"
          aria-label={t("max")}
          placeholder={t("max")}
          value={form.max ?? ""}
          onChange={(e) => set({ max: e.target.value })}
        />
        <Input
          type="number"
          aria-label={t("step")}
          placeholder={t("step")}
          value={form.step ?? ""}
          onChange={(e) => set({ step: e.target.value })}
        />
        <Input
          aria-label={t("choices")}
          placeholder={t("choices")}
          value={form.choices ?? ""}
          onChange={(e) => set({ choices: e.target.value })}
        />
      </div>
      {onRemove ? (
        <Button type="button" variant="ghost" size="sm" className="self-end" onClick={onRemove}>
          <Icons.trash aria-hidden />
          {t("removeSection")}
        </Button>
      ) : null}
    </div>
  )
}

function TestDialog({ test, onClose }: { test?: ScoreTest; onClose: () => void }) {
  const t = useT("testCatalog")
  const errorMessage = useErrorMessage()
  const save = useSaveCatalogTest()
  const [key, setKey] = useState(test?.key ?? "")
  const [names, setNames] = useState<Record<string, string>>(test?.names ?? {})
  const [mode, setMode] = useState<ScoreTest["total_mode"]>(test?.total_mode ?? "sum")
  const [sections, setSections] = useState<SectionForm[]>(test?.sections.map(toForm) ?? [blankSection()])
  const [total, setTotal] = useState<SectionForm>(test?.total ? toForm(test.total) : blankSection())
  const [superscore, setSuperscore] = useState(test?.superscore ?? false)
  const [needsLabel, setNeedsLabel] = useState(test?.needs_label ?? false)
  const [needsLevel, setNeedsLevel] = useState(test?.needs_level ?? false)
  const [position, setPosition] = useState(String(test?.position ?? 0))
  const [active, setActive] = useState(test?.active ?? true)

  async function send(event: FormEvent) {
    event.preventDefault()
    const input: ScoreTestInput = {
      key: key.trim(),
      names: Object.fromEntries(Object.entries(names).filter(([, value]) => value.trim() !== "")),
      sections: sections.map(toSection),
      total: mode === "none" ? null : toSection(total),
      total_mode: mode,
      superscore,
      needs_label: needsLabel,
      needs_level: needsLevel,
      position: Number(position) || 0,
      active,
    }
    try {
      await save.mutateAsync({ id: test?.id, input })
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
      title={test ? t("editTitle") : t("addTitle")}
      onSubmit={send}
      footer={
        <LoadingButton type="submit" loading={save.isPending}>
          {t("save")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="cat-key">{t("key")}</Label>
          <Input id="cat-key" value={key} disabled={test !== undefined} onChange={(e) => setKey(e.target.value)} />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {LOCALES.map((locale) => (
            <div key={locale} className="flex flex-col gap-1">
              <Label htmlFor={`cat-name-${locale}`}>{`${t("name")} (${locale})`}</Label>
              <Input
                id={`cat-name-${locale}`}
                value={names[locale] ?? ""}
                onChange={(e) => setNames({ ...names, [locale]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="cat-mode">{t("totalMode")}</Label>
          <select
            id="cat-mode"
            className={SELECT}
            value={mode}
            onChange={(e) => setMode(e.target.value as ScoreTest["total_mode"])}
          >
            {TOTAL_MODES.map((value) => (
              <option key={value} value={value}>
                {t(`totalModes.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <h3 className="text-sm font-semibold">{t("sections")}</h3>
        {sections.map((section, index) => (
          <SectionEditor
            key={index}
            form={section}
            onChange={(next) => setSections(sections.map((item, i) => (i === index ? next : item)))}
            onRemove={() => setSections(sections.filter((_, i) => i !== index))}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setSections([...sections, blankSection()])}
        >
          <Icons.add aria-hidden />
          {t("addSection")}
        </Button>
        {mode !== "none" ? (
          <>
            <h3 className="text-sm font-semibold">{t("totalRange")}</h3>
            <SectionEditor form={total} onChange={setTotal} />
          </>
        ) : null}
        <div className="flex flex-col gap-1">
          <Label htmlFor="cat-position">{t("position")}</Label>
          <Input id="cat-position" type="number" value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={superscore} onChange={(e) => setSuperscore(e.target.checked)} />
          {t("superscore")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={needsLabel} onChange={(e) => setNeedsLabel(e.target.checked)} />
          {t("needsLabel")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={needsLevel} onChange={(e) => setNeedsLevel(e.target.checked)} />
          {t("needsLevel")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          {t("active")}
        </label>
      </div>
    </ResponsiveDialog>
  )
}

/** Admin editor of the test catalog (SAT, IELTS ...): sections, ranges and the total rule. */
export function CatalogAdminBody() {
  const t = useT("testCatalog")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const catalog = useScoreCatalog()
  const remove = useDeleteCatalogTest()
  const [dialog, setDialog] = useState<{ test?: ScoreTest } | null>(null)
  const [pending, setPending] = useState<ScoreTest | null>(null)

  async function drop(id: string) {
    try {
      await remove.mutateAsync(id)
      setPending(null)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AppPageHeader
        icon="certificates"
        title={t("title")}
        actions={
          <Button type="button" onClick={() => setDialog({})}>
            <Icons.add aria-hidden />
            {t("add")}
          </Button>
        }
      />
      {catalog.isError ? (
        <StateView state="error" error={catalog.error} onRetry={() => void catalog.refetch()} />
      ) : !catalog.data ? (
        <StateView state="loading" rows={3} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {catalog.data.items.map((test) => (
            <li key={test.id}>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{scoreName(test.names, locale) || test.key}</h3>
                    {test.active ? null : <Badge variant="neutral">{t("inactive")}</Badge>}
                  </div>
                  {test.sections.length > 0 ? (
                    <p className="text-muted-foreground text-xs">
                      {test.sections.map((s) => scoreName(s.names, locale) || s.key).join(", ")}
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDialog({ test })}>
                      <Icons.edit aria-hidden />
                      {t("edit")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={remove.isPending}
                      onClick={() => setPending(test)}
                    >
                      <Icons.trash aria-hidden />
                      {t("delete")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={t("deleteTitle")}
        description={pending ? t("deleteText", { name: scoreName(pending.names, locale) || pending.key }) : undefined}
        confirmLabel={t("delete")}
        destructive
        loading={remove.isPending}
        onConfirm={() => (pending ? drop(pending.id) : undefined)}
      />
      {dialog ? <TestDialog key={dialog.test?.id ?? "new"} test={dialog.test} onClose={() => setDialog(null)} /> : null}
    </div>
  )
}

export function CatalogAdminPage() {
  return (
    <AdmissionShell roles={["admin", "counselor"]}>
      <div className={pageClass()}>
        <CatalogAdminBody />
      </div>
    </AdmissionShell>
  )
}
