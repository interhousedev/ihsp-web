"use client"

import { useT } from "@ihsp/i18n"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import { useState } from "react"
import { useLoadedNotebook, useSources } from "../api"
import { ADD_TABS, COURSE_ADD_TABS, type AddTab, type PendingItem, type PickTabProps } from "./add-types"
import { AddFooter } from "./add-footer"
import { MAX_ADD_ITEMS, SOURCE_LIMIT } from "./constants"
import { LinkTab } from "./link-tab"
import { parseLinks } from "./parse-links"
import { isPastedTextComplete, PasteTextTab, type PastedText } from "./paste-text-tab"
import { PickChatsTab } from "./pick-chats-tab"
import { PickCourseStepsTab } from "./pick-course-steps-tab"
import { PickCoursesTab } from "./pick-courses-tab"
import { PickFilesTab } from "./pick-files-tab"
import { PickFlashcardsTab } from "./pick-flashcards-tab"
import { PickLessonsTab } from "./pick-lessons-tab"
import { useAddSelection } from "./use-add-selection"
import { useAddSubmit } from "./use-add-submit"
import { useNotebookUploader } from "./notebook-upload-scope"

const toTab = (value: unknown): AddTab => [...ADD_TABS, ...COURSE_ADD_TABS].find((id) => id === value) ?? "files"

/** Tabs, the selection shared by them, and the footer of the Add sources dialog. */
export function AddSourcesBody({ notebookId, onDone }: { notebookId: string; onDone: () => void }) {
  const t = useT("notebooks")
  const sources = useSources(notebookId)
  const notebook = useLoadedNotebook(notebookId)
  const tabs = notebook.data?.course_id ? COURSE_ADD_TABS : ADD_TABS
  const selection = useAddSelection()
  const uploader = useNotebookUploader(notebookId)
  const submitter = useAddSubmit(notebookId)
  const [tab, setTab] = useState<AddTab>("files")
  const [subjectId, setSubjectId] = useState("")
  const [text, setText] = useState<PastedText>({ title: "", body: "" })
  const [links, setLinks] = useState("")

  const existing = sources.data ?? []
  const capacity = Math.max(0, Math.min(MAX_ADD_ITEMS, SOURCE_LIMIT - existing.length))

  // Pasted text and links count as chosen items as soon as they are complete: one button adds everything.
  const textItems: PendingItem[] = isPastedTextComplete(text)
    ? [
        {
          key: "text",
          input: { kind: "text", title: text.title.trim(), text: text.body.trim() },
          label: text.title.trim(),
        },
      ]
    : []
  const linkItems: PendingItem[] = parseLinks(links).urls.map((url) => ({
    key: `url:${url}`,
    input: { kind: "url", url },
    label: url,
  }))
  const all = [...selection.items, ...textItems, ...linkItems]
  const tooMany = all.length > capacity

  async function submit() {
    // The chosen files appear in the Sources list at once, as AI-reading rows, until the add request answers.
    const fileNames = selection.items.filter((item) => item.input.kind === "file").map((item) => item.label)
    const reserved = uploader.reserve(fileNames)
    const refused = await submitter.submit(all)
    uploader.settle(reserved)
    if (!refused) return
    selection.clear()
    if (textItems.length > 0 && !refused.has("text")) setText({ title: "", body: "" })
    if (linkItems.length > 0) {
      setLinks(
        linkItems
          .filter((item) => refused.has(item.key))
          .map((item) => item.label)
          .join("\n"),
      )
    }
    if (refused.size === 0) onDone()
  }

  const pick: PickTabProps = { sources: existing, selection, full: all.length >= capacity }
  const busy = submitter.pending

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(toTab(value))} className="min-h-0 flex-1 gap-3">
      <TabsList
        variant="line"
        aria-label={t("add.tabs")}
        className="w-full shrink-0 justify-start overflow-x-auto group-data-horizontal/tabs:h-12 md:group-data-horizontal/tabs:h-9"
      >
        {tabs.map((id) => (
          <TabsTrigger key={id} value={id} className="min-h-11 flex-none px-3 md:min-h-8">
            {t(`add.tab.${id}`)}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="min-h-0 flex-1 overflow-y-auto pe-1">
        <TabsContent value="files" className="flex min-h-full flex-col">
          <PickFilesTab {...pick} uploader={uploader} />
        </TabsContent>
        <TabsContent value="chats">
          <PickChatsTab {...pick} />
        </TabsContent>
        <TabsContent value="lessons">
          <PickLessonsTab {...pick} subjectId={subjectId} onSubjectChange={setSubjectId} />
        </TabsContent>
        <TabsContent value="flashcards">
          <PickFlashcardsTab {...pick} />
        </TabsContent>
        <TabsContent value="courses">
          <PickCoursesTab {...pick} />
        </TabsContent>
        <TabsContent value="course_steps">
          <PickCourseStepsTab {...pick} notebookId={notebookId} />
        </TabsContent>
        <TabsContent value="text">
          <PasteTextTab value={text} onChange={setText} disabled={busy || tooMany} onSubmit={() => void submit()} />
        </TabsContent>
        <TabsContent value="link">
          <LinkTab value={links} onChange={setLinks} disabled={busy || tooMany} onSubmit={() => void submit()} />
        </TabsContent>
      </div>
      <AddFooter
        count={all.length}
        pending={busy}
        tooMany={tooMany}
        capacity={capacity}
        rejections={submitter.rejections}
        error={submitter.error}
        onSubmit={() => void submit()}
      />
    </Tabs>
  )
}
