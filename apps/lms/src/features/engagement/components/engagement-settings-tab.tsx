"use client"

import {
  deleteLmsCourseQuest,
  getLmsCourseQuestsQuery,
  getLmsEngagementSettingsQuery,
  keys,
  patchLmsCourseQuest,
  postLmsCourseQuest,
  putLmsEngagementSettings,
  type Quest,
  type QuestBody,
  type QuestGoalKind,
} from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  DatePicker,
  Icons,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  StateView,
  Switch,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useState } from "react"
import { toast } from "sonner"
import {
  GOAL_DEFAULT_TARGET,
  GOAL_KINDS,
  THRESHOLD_DEFAULT,
  THRESHOLD_MAX,
  THRESHOLD_MIN,
  THRESHOLD_STEP,
  newQuest,
  questProblems,
  snapThreshold,
  tashkentToday,
} from "../utils/engagement"

function ThresholdCard({ courseId, saved }: { courseId: string; saved: number | null }) {
  const t = useT("engagementStaff")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const switchId = useId()
  const [on, setOn] = useState(saved !== null)
  const [pct, setPct] = useState(saved ?? THRESHOLD_DEFAULT)
  useEffect(() => {
    setOn(saved !== null)
    setPct(saved ?? THRESHOLD_DEFAULT)
  }, [saved])
  const next = on ? pct : null
  const save = useMutation({
    mutationFn: () => putLmsEngagementSettings(courseId, { unlock_threshold_pct: next }),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.lms.engagementSettings(courseId), data)
      toast.success(t("saved"))
    },
  })
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor={switchId} className="text-base font-semibold">
              {t("unlockTitle")}
            </Label>
            <p className="text-muted-foreground text-sm">{t("unlockHint")}</p>
          </div>
          <Switch id={switchId} checked={on} onCheckedChange={setOn} className="mt-1" />
        </div>
        {on ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t("unlockValue", { pct })}</p>
            <Slider
              min={THRESHOLD_MIN}
              max={THRESHOLD_MAX}
              step={THRESHOLD_STEP}
              value={[pct]}
              aria-label={t("unlockSlider")}
              onValueChange={(value) => setPct(snapThreshold(Array.isArray(value) ? (value[0] ?? pct) : value))}
            />
            <div aria-hidden className="text-muted-foreground flex justify-between text-xs">
              <span>{t("lenient")}</span>
              <span>{t("strict")}</span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("unlockOff")}</p>
        )}
        {save.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(save.error)}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          className="min-h-11 self-end md:min-h-8"
          disabled={next === saved || save.isPending}
          onClick={() => save.mutate()}
        >
          {t("save")}
        </Button>
      </CardContent>
    </Card>
  )
}

function QuestForm({
  initial,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  initial: QuestBody
  pending: boolean
  error: string | null
  onSubmit: (body: QuestBody) => void
  onCancel: () => void
}) {
  const t = useT("engagementStaff")
  const ids = { title: useId(), kind: useId(), target: useId(), classTarget: useId(), start: useId(), end: useId() }
  const [body, setBody] = useState(initial)
  const problems = questProblems(body)
  const set = (patch: Partial<QuestBody>) => setBody((value) => ({ ...value, ...patch }))
  return (
    <form
      className="flex flex-col gap-3 rounded-lg border p-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (problems.length === 0) onSubmit({ ...body, title: body.title.trim() })
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor={ids.title}>{t("questTitle")}</Label>
        <Input
          id={ids.title}
          value={body.title}
          maxLength={120}
          placeholder={t("questTitlePlaceholder")}
          onChange={(event) => set({ title: event.target.value })}
          className="min-h-11 md:min-h-8"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor={ids.kind}>{t("goalKind")}</Label>
          <Select
            value={body.goal_kind}
            items={GOAL_KINDS.map((value) => ({ value, label: t(`goal.${value}`) }))}
            onValueChange={(value) => {
              if (!value) return
              const kind = value as QuestGoalKind
              set({ goal_kind: kind, target: GOAL_DEFAULT_TARGET[kind] })
            }}
          >
            <SelectTrigger id={ids.kind} className="min-h-11 w-full md:min-h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOAL_KINDS.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`goal.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={ids.target}>{t("target")}</Label>
          <Input
            id={ids.target}
            type="number"
            inputMode="numeric"
            min={1}
            value={body.target || ""}
            aria-invalid={problems.includes("target")}
            onChange={(event) => set({ target: Number(event.target.value) })}
            className="min-h-11 md:min-h-8"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={ids.classTarget}>{t("classTarget")}</Label>
          <Input
            id={ids.classTarget}
            type="number"
            inputMode="numeric"
            min={1}
            value={body.class_target || ""}
            aria-invalid={problems.includes("classTarget")}
            onChange={(event) => set({ class_target: Number(event.target.value) })}
            className="min-h-11 md:min-h-8"
          />
        </div>
      </div>
      <p className="text-muted-foreground text-xs">{t(`goalHint.${body.goal_kind}`)}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={ids.start}>{t("startsOn")}</Label>
          <DatePicker id={ids.start} value={body.starts_on} onChange={(value) => set({ starts_on: value ?? "" })} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={ids.end}>{t("endsOn")}</Label>
          <DatePicker
            id={ids.end}
            value={body.ends_on}
            min={body.starts_on || undefined}
            onChange={(value) => set({ ends_on: value ?? "" })}
          />
        </div>
      </div>
      {problems.includes("dates") ? <p className="text-destructive text-sm">{t("datesInvalid")}</p> : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="submit" className="min-h-11 md:min-h-8" disabled={pending || problems.length > 0}>
          {t("saveQuest")}
        </Button>
      </div>
    </form>
  )
}

const toBody = (quest: Quest): QuestBody => ({
  title: quest.title,
  goal_kind: quest.goal_kind,
  target: quest.target,
  class_target: quest.class_target,
  starts_on: quest.starts_on,
  ends_on: quest.ends_on,
})

function QuestsCard({ courseId }: { courseId: string }) {
  const t = useT("engagementStaff")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const quests = useQuery(getLmsCourseQuestsQuery(courseId))
  const [editing, setEditing] = useState<"new" | string | null>(null)
  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.lms.courseQuests(courseId) })
  const save = useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: QuestBody }) =>
      id ? patchLmsCourseQuest(courseId, id, body) : postLmsCourseQuest(courseId, body),
    onSuccess: async () => {
      await refresh()
      setEditing(null)
      toast.success(t("questSaved"))
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => deleteLmsCourseQuest(courseId, id),
    onSuccess: () => refresh(),
  })
  const form = (initial: QuestBody, id: string | null) => (
    <QuestForm
      initial={initial}
      pending={save.isPending}
      error={save.isError ? errorMessage(save.error) : null}
      onSubmit={(body) => save.mutate({ id, body })}
      onCancel={() => {
        save.reset()
        setEditing(null)
      }}
    />
  )
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold">{t("questsTitle")}</h3>
            <p className="text-muted-foreground text-sm">{t("questsHint")}</p>
          </div>
          {editing === null ? (
            <Button variant="outline" className="min-h-11 shrink-0 md:min-h-8" onClick={() => setEditing("new")}>
              <Icons.add aria-hidden />
              {t("addQuest")}
            </Button>
          ) : null}
        </div>
        {editing === "new" ? form(newQuest(tashkentToday()), null) : null}
        <QueryState query={quests} rows={2} isEmpty={(data) => data.items.length === 0} emptyText={t("questsEmpty")}>
          {(data) => (
            <ul className="flex flex-col gap-2">
              {data.items.map((quest) =>
                editing === quest.id ? (
                  <li key={quest.id}>{form(toBody(quest), quest.id)}</li>
                ) : (
                  <li key={quest.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{quest.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {t("questLine", {
                          goal: t(`goal.${quest.goal_kind}`),
                          target: quest.target,
                          classTarget: quest.class_target,
                          start: quest.starts_on,
                          end: quest.ends_on,
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("editQuest", { title: quest.title })}
                        className="size-11 md:size-8"
                        disabled={editing !== null}
                        onClick={() => setEditing(quest.id)}
                      >
                        <Icons.edit aria-hidden />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("deleteQuest", { title: quest.title })}
                        className="size-11 md:size-8"
                        disabled={remove.isPending}
                        onClick={() => {
                          if (window.confirm(t("deleteConfirm", { title: quest.title }))) remove.mutate(quest.id)
                        }}
                      >
                        <Icons.trash aria-hidden />
                      </Button>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}
        </QueryState>
        {remove.isError ? <StateView state="error" error={remove.error} /> : null}
      </CardContent>
    </Card>
  )
}

/** Course settings, "Engagement" tab: unlock-at-mastery threshold and the class quests editor. Saves on its own. */
export function EngagementSettingsTab({ courseId }: { courseId: string }) {
  const settings = useQuery(getLmsEngagementSettingsQuery(courseId))
  return (
    <div className="flex flex-col gap-4">
      <QueryState query={settings} rows={2}>
        {(data) => <ThresholdCard courseId={courseId} saved={data.unlock_threshold_pct} />}
      </QueryState>
      <QuestsCard courseId={courseId} />
    </div>
  )
}
