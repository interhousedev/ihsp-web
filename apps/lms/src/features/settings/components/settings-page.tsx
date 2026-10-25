"use client"

import { keys, putLmsCourseDraftMeta, type CourseDraft } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, LoadingButton, cn } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useCourseDraft } from "../../editor/hooks/use-course-draft"
import { EditorFrame } from "../../editor/components/editor-frame"
import { QueryState } from "../../shared/components/query-state"
import { useSettingsForm } from "../hooks/use-settings-form"
import { DetailsTab } from "./details-tab"
import { NavigationTab } from "./navigation-tab"
import { SettingsSidebar } from "./settings-sidebar"
import { VisibilityTab } from "./visibility-tab"

const TABS = ["details", "visibility", "navigation"] as const
type Tab = (typeof TABS)[number]

function SettingsBody({ draft, pollMs }: { draft: CourseDraft; pollMs?: number }) {
  const t = useT("courseSettings")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const form = useSettingsForm(draft.id)
  const [tab, setTab] = useState<Tab>("details")
  const [title, setTitle] = useState(draft.title)
  const [description, setDescription] = useState(draft.description)
  useEffect(() => {
    setTitle(draft.title)
    setDescription(draft.description)
  }, [draft.title, draft.description])
  const metaDirty = title !== draft.title || description !== draft.description

  const meta = useMutation<CourseDraft, unknown, void>({
    mutationFn: () => putLmsCourseDraftMeta(draft.id, { title, description, lock_version: draft.lock_version }),
    onSuccess: (next) => queryClient.setQueryData(keys.lms.draft(draft.id), next),
  })

  async function save() {
    try {
      if (metaDirty) await meta.mutateAsync()
      if (form.dirty) await form.save.mutateAsync()
      toast.success(t("saved"))
    } catch {
      // the error alerts below show the reason
    }
  }

  return (
    <QueryState query={form.query} rows={4}>
      {(settings) => (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-4">
            <div role="tablist" aria-label={t("tabs")} className="flex gap-1 overflow-x-auto border-b">
              {TABS.map((key) => (
                <button
                  key={key}
                  id={`settings-tab-${key}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  aria-controls="settings-panel"
                  onClick={() => setTab(key)}
                  className={cn(
                    "text-muted-foreground min-h-11 shrink-0 border-b-2 border-transparent px-4 text-sm font-medium md:min-h-9",
                    tab === key && "border-foreground text-foreground",
                  )}
                >
                  {t(`tab.${key}`)}
                </button>
              ))}
            </div>
            <div
              id="settings-panel"
              role="tabpanel"
              aria-labelledby={`settings-tab-${tab}`}
              className="flex flex-col gap-4"
            >
              {tab === "details" ? (
                <DetailsTab
                  form={form}
                  draft={draft}
                  title={title}
                  description={description}
                  onTitle={setTitle}
                  onDescription={setDescription}
                />
              ) : null}
              {tab === "visibility" ? <VisibilityTab form={form} draft={draft} /> : null}
              {tab === "navigation" ? <NavigationTab form={form} /> : null}
            </div>
            {form.serverError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {t("serverInvalid", { field: form.serverError.field, reason: form.serverError.reason })}
                </AlertDescription>
              </Alert>
            ) : null}
            {form.save.isError && !form.serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage(form.save.error)}</AlertDescription>
              </Alert>
            ) : null}
            {meta.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage(meta.error)}</AlertDescription>
              </Alert>
            ) : null}
            <div className="bg-background sticky bottom-0 flex items-center gap-3 border-t py-3">
              <LoadingButton
                loading={form.save.isPending || meta.isPending}
                disabled={(!form.dirty && !metaDirty) || form.invalid}
                onClick={() => void save()}
                className="min-h-11 md:min-h-8"
              >
                {t("save")}
              </LoadingButton>
              {form.dirty || metaDirty ? <span className="text-muted-foreground text-sm">{t("unsaved")}</span> : null}
            </div>
          </div>
          <SettingsSidebar settings={settings} pollMs={pollMs} />
        </div>
      )}
    </QueryState>
  )
}

/** `/edit/settings/?id=`: Canvas-style course settings (details, visibility, navigation) with a tools sidebar. */
export function CourseSettingsPage({ courseId, pollMs }: { courseId: string; pollMs?: number }) {
  const t = useT("courseSettings")
  const draft = useCourseDraft(courseId)
  return (
    <EditorFrame courseId={courseId} current="settings" title={t("title")} requires={["edit"]}>
      {() => (
        <QueryState query={draft} rows={4}>
          {(data) => <SettingsBody draft={data} pollMs={pollMs} />}
        </QueryState>
      )}
    </EditorFrame>
  )
}
