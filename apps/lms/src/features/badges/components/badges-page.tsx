"use client"

import {
  BADGE_ICONS,
  BADGE_SHAPES,
  badgeKeys,
  deleteCourseBadge,
  getCourseBadgesQuery,
  getLmsCourseDraftQuery,
  postCourseBadge,
  postCourseBadgeImage,
  putCourseBadge,
  putCourseBadgeSettings,
  type BadgeLabels,
  type CourseBadge,
  type CourseBadgeBody,
  type CourseBadgeList,
} from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Icons,
  Input,
  Label,
  StateView,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  cn,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { EditorFrame } from "../../editor/components/editor-frame"
import { localized } from "../utils/labels"
import { ruleToWorkspace, validateWorkspace, workspaceToRule, type Workspace } from "../utils/rule-blocks"
import { BADGE_ICON_COMPONENTS, BadgeMedal } from "./badge-medal"
import { RuleBuilder } from "./rule-builder"

const LOCALES = ["en", "ru", "uz"] as const
const NAME_MAX = 60
const DESCRIPTION_MAX = 300
const IMAGE_TYPES = "image/png,image/jpeg,image/webp"
const IMAGE_MAX_BYTES = 512 * 1024
const SWATCHES = ["#F59E0B", "#EF4444", "#EC4899", "#8B5CF6", "#3B82F6", "#0EA5E9", "#10B981", "#64748B"]

type Draft = { id: string | null; body: CourseBadgeBody; workspace: Workspace; file: File | null }

const emptyLabels = (): BadgeLabels => ({ en: "", ru: "", uz: "" })

function newDraft(): Draft {
  const rule = { event: "course_completed" as const, condition: null }
  return {
    id: null,
    body: {
      name: emptyLabels(),
      description: emptyLabels(),
      design: { icon: "trophy", shape: "circle", color: SWATCHES[0] ?? "#F59E0B", image_url: null },
      rule,
    },
    workspace: ruleToWorkspace(rule),
    file: null,
  }
}

function draftOf(badge: CourseBadge): Draft {
  const { name, description, design, rule } = badge
  return { id: badge.id, body: { name, description, design, rule }, workspace: ruleToWorkspace(rule), file: null }
}

/** `/edit/badges/?id=`: the course badges, their design and the visual award rule. */
export function BadgesPage({ courseId }: { courseId: string }) {
  const t = useT("badges")
  return (
    <EditorFrame courseId={courseId} current="badges" title={t("title")} requires={["edit"]}>
      {() => <BadgesBody courseId={courseId} />}
    </EditorFrame>
  )
}

function BadgesBody({ courseId }: { courseId: string }) {
  const t = useT("badges")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const list = useQuery(getCourseBadgesQuery(courseId))
  const draftCourse = useQuery(getLmsCourseDraftQuery(courseId))
  const [editing, setEditing] = useState<Draft | null>(null)
  const [removing, setRemoving] = useState<CourseBadge | null>(null)
  const switchId = useId()

  const settings = useMutation({
    mutationFn: (show_locked: boolean) => putCourseBadgeSettings(courseId, { show_locked }),
    onSuccess: ({ show_locked }) => {
      queryClient.setQueryData<CourseBadgeList>(badgeKeys.course(courseId), (old) =>
        old ? { ...old, show_locked } : old,
      )
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const remove = useMutation({
    mutationFn: (badge: CourseBadge) => deleteCourseBadge(courseId, badge.id),
    onSuccess: () => {
      setRemoving(null)
      void queryClient.invalidateQueries({ queryKey: badgeKeys.course(courseId) })
      toast.success(t("deleted"))
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10 md:px-6">
      <QueryState query={list}>
        {(data) => (
          <>
            <Card>
              <CardContent className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor={switchId} className="text-base font-semibold">
                    {t("showLocked")}
                  </Label>
                  <p className="text-muted-foreground text-sm">{t("showLockedHint")}</p>
                </div>
                <Switch
                  id={switchId}
                  checked={data.show_locked}
                  disabled={settings.isPending}
                  onCheckedChange={(checked) => settings.mutate(checked)}
                />
              </CardContent>
            </Card>

            {editing ? (
              <BadgeEditor
                key={editing.id ?? "new"}
                courseId={courseId}
                initial={editing}
                outline={draftCourse.data?.outline ?? []}
                onClose={() => setEditing(null)}
              />
            ) : (
              <section aria-labelledby="badges-list" className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="badges-list" className="text-lg font-semibold">
                    {t("listTitle", { count: data.items.length })}
                  </h2>
                  <Button
                    onClick={() => setEditing(newDraft())}
                    className="min-h-11 md:min-h-9"
                    data-testid="badge-new"
                  >
                    <Icons.add aria-hidden className="size-4" />
                    {t("newBadge")}
                  </Button>
                </div>
                {data.items.length === 0 ? (
                  <StateView state="empty" title={t("emptyTitle")} description={t("emptyHint")} />
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {data.items.map((badge) => (
                      <li key={badge.id}>
                        <Card className="h-full">
                          <CardContent className="flex items-start gap-3">
                            <BadgeMedal design={badge.design} size={56} />
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                              <p className="font-semibold break-words">{localized(badge.name, locale)}</p>
                              <p className="text-muted-foreground line-clamp-2 text-sm">
                                {localized(badge.description, locale)}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {t("awarded", { count: badge.awarded_count })} · {t(`events.${badge.rule.event}`)}
                              </p>
                              <div className="mt-1 flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="min-h-11 md:min-h-8"
                                  onClick={() => setEditing(draftOf(badge))}
                                >
                                  {t("edit")}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive min-h-11 md:min-h-8"
                                  onClick={() => setRemoving(badge)}
                                >
                                  {t("delete")}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </QueryState>
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={t("deleteTitle")}
        description={removing ? t("deleteHint", { name: localized(removing.name, locale) }) : undefined}
        confirmLabel={t("delete")}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (removing) remove.mutate(removing)
        }}
      />
    </div>
  )
}

function BadgeEditor({
  courseId,
  initial,
  outline,
  onClose,
}: {
  courseId: string
  initial: Draft
  outline: Parameters<typeof RuleBuilder>[0]["outline"]
  onClose: () => void
}) {
  const t = useT("badges")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState(initial)
  const [lang, setLang] = useState<(typeof LOCALES)[number]>(
    (LOCALES as readonly string[]).includes(locale) ? (locale as (typeof LOCALES)[number]) : "en",
  )
  const [preview, setPreview] = useState<string | null>(null)
  useEffect(() => (preview ? () => URL.revokeObjectURL(preview) : undefined), [preview])
  const fileInput = useRef<HTMLInputElement>(null)
  const ids = { color: useId(), name: useId(), description: useId() }
  const problems = useMemo(() => validateWorkspace(draft.workspace), [draft.workspace])
  const missingNames = LOCALES.filter((l) => !draft.body.name[l].trim())
  const design = { ...draft.body.design, image_url: preview ?? draft.body.design.image_url }

  const setBody = (patch: Partial<CourseBadgeBody>) => setDraft((d) => ({ ...d, body: { ...d.body, ...patch } }))
  const setDesign = (patch: Partial<CourseBadgeBody["design"]>) =>
    setDraft((d) => ({ ...d, body: { ...d.body, design: { ...d.body.design, ...patch } } }))

  const save = useMutation({
    mutationFn: async () => {
      const body = { ...draft.body, rule: workspaceToRule(draft.workspace) }
      const saved = draft.id ? await putCourseBadge(courseId, draft.id, body) : await postCourseBadge(courseId, body)
      return draft.file ? postCourseBadgeImage(courseId, saved.id, draft.file) : saved
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: badgeKeys.course(courseId) })
      toast.success(t("saved"))
      onClose()
    },
  })

  function pickFile(file: File | undefined) {
    if (!file) return
    if (file.size > IMAGE_MAX_BYTES) {
      toast.error(t("imageTooLarge"))
      return
    }
    setDraft((d) => ({ ...d, file }))
    setPreview(URL.createObjectURL(file))
  }

  const ruleProblems = problems.filter((p) => p.blockId === null)
  const blocked = problems.length > 0 || missingNames.length > 0

  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{draft.id ? t("editTitle") : t("newBadge")}</h2>
          <Button variant="ghost" onClick={onClose} className="min-h-11 md:min-h-9">
            {t("cancel")}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="flex flex-col gap-5">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-semibold">{t("icon")}</legend>
              <div
                role="radiogroup"
                aria-label={t("icon")}
                className="grid grid-cols-6 gap-2 sm:grid-cols-12 md:grid-cols-6 lg:grid-cols-12"
              >
                {BADGE_ICONS.map((icon) => {
                  const Glyph = BADGE_ICON_COMPONENTS[icon]
                  const on = draft.body.design.icon === icon
                  return (
                    <button
                      key={icon}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={t(`icons.${icon}`)}
                      onClick={() => setDesign({ icon })}
                      className={cn(
                        "hover:bg-muted focus-visible:ring-ring flex aspect-square min-h-11 items-center justify-center rounded-lg border focus-visible:ring-2 focus-visible:outline-none",
                        on && "border-primary bg-primary/10 text-primary",
                      )}
                    >
                      <Glyph aria-hidden size={22} />
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-semibold">{t("shape")}</legend>
              <div role="radiogroup" aria-label={t("shape")} className="flex flex-wrap gap-2">
                {BADGE_SHAPES.map((shape) => {
                  const on = draft.body.design.shape === shape
                  return (
                    <button
                      key={shape}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setDesign({ shape })}
                      className={cn(
                        "hover:bg-muted focus-visible:ring-ring flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none",
                        on && "border-primary bg-primary/10",
                      )}
                    >
                      <BadgeMedal design={{ ...draft.body.design, shape, image_url: null }} size={24} />
                      {t(`shapes.${shape}`)}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <Label htmlFor={ids.color} className="text-sm font-semibold">
                {t("color")}
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                {SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    aria-pressed={draft.body.design.color.toLowerCase() === color.toLowerCase()}
                    onClick={() => setDesign({ color })}
                    className="focus-visible:ring-ring size-11 rounded-full border-2 border-white shadow ring-offset-2 focus-visible:ring-2 focus-visible:outline-none aria-pressed:ring-2 aria-pressed:ring-current md:size-8"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  id={ids.color}
                  type="color"
                  value={draft.body.design.color}
                  onChange={(event) => setDesign({ color: event.target.value })}
                  className="h-11 w-14 cursor-pointer rounded-md border bg-transparent md:h-8"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">{t("image")}</span>
              <p className="text-muted-foreground text-xs">{t("imageHint")}</p>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept={IMAGE_TYPES}
                  className="sr-only"
                  aria-label={t("imageUpload")}
                  onChange={(event) => pickFile(event.target.files?.[0])}
                />
                <Button variant="outline" className="min-h-11 md:min-h-9" onClick={() => fileInput.current?.click()}>
                  <Icons.upload aria-hidden className="size-4" />
                  {t("imageUpload")}
                </Button>
                {design.image_url ? (
                  <Button
                    variant="ghost"
                    className="min-h-11 md:min-h-9"
                    onClick={() => {
                      setPreview(null)
                      setDraft((d) => ({
                        ...d,
                        file: null,
                        body: { ...d.body, design: { ...d.body.design, image_url: null } },
                      }))
                    }}
                  >
                    {t("imageRemove")}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <aside
            aria-label={t("preview")}
            className="bg-muted/50 rounded-card flex flex-col items-center gap-3 border p-4 text-center md:sticky md:top-4 md:self-start"
          >
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{t("preview")}</span>
            <BadgeMedal design={design} size={112} label={draft.body.name[lang] || t("untitled")} />
            <p className="font-semibold break-words">{draft.body.name[lang] || t("untitled")}</p>
            <p className="text-muted-foreground text-sm break-words">{draft.body.description[lang]}</p>
          </aside>
        </div>

        <Tabs value={lang} onValueChange={(value) => setLang(value as (typeof LOCALES)[number])}>
          <TabsList aria-label={t("language")}>
            {LOCALES.map((l) => (
              <TabsTrigger key={l} value={l} className="min-h-11 md:min-h-8">
                {t(`locales.${l}`)}
                {!draft.body.name[l].trim() ? (
                  <span aria-hidden className="text-destructive ms-1">
                    •
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
          {LOCALES.map((l) => (
            <TabsContent key={l} value={l} className="flex flex-col gap-3 pt-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${ids.name}-${l}`}>{t("name")}</Label>
                <Input
                  id={`${ids.name}-${l}`}
                  value={draft.body.name[l]}
                  maxLength={NAME_MAX}
                  onChange={(event) => setBody({ name: { ...draft.body.name, [l]: event.target.value } })}
                  className="min-h-11 md:min-h-9"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${ids.description}-${l}`}>{t("description")}</Label>
                <Textarea
                  id={`${ids.description}-${l}`}
                  value={draft.body.description[l]}
                  maxLength={DESCRIPTION_MAX}
                  rows={3}
                  onChange={(event) => setBody({ description: { ...draft.body.description, [l]: event.target.value } })}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <section aria-labelledby="badge-rule" className="flex flex-col gap-3">
          <div>
            <h3 id="badge-rule" className="font-semibold">
              {t("rule.title")}
            </h3>
            <p className="text-muted-foreground text-sm">{t("rule.hint")}</p>
          </div>
          <RuleBuilder
            value={draft.workspace}
            onChange={(workspace) => setDraft((d) => ({ ...d, workspace }))}
            outline={outline}
            problems={problems}
          />
          {ruleProblems.map((p) => (
            <p key={p.code} role="alert" className="text-destructive text-sm font-medium">
              {t(`problems.${p.code}`)}
            </p>
          ))}
        </section>

        {save.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(save.error)}</AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {missingNames.length > 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("namesMissing", { langs: missingNames.map((l) => t(`locales.${l}`)).join(", ") })}
            </p>
          ) : problems.length > 0 ? (
            <p className="text-muted-foreground text-sm">{t("fixRule")}</p>
          ) : null}
          <Button
            className="min-h-11 md:min-h-9"
            disabled={blocked || save.isPending}
            onClick={() => save.mutate()}
            data-testid="badge-save"
          >
            {save.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
