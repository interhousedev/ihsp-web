"use client"

import { getLmsCoursePendingQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { EditorFrame } from "../../editor/components/editor-frame"
import { QueryState } from "../../shared/components/query-state"
import { PublishBody } from "./publish-body"

/** `/edit/publish/?id=`: pending changes with diffs, a note and Publish. */
export function PublishPage({ courseId }: { courseId: string }) {
  const t = useT("publish")
  const pending = useQuery({ ...getLmsCoursePendingQuery(courseId), staleTime: 0 })
  return (
    <EditorFrame courseId={courseId} current="publish" title={t("title")} requires={["edit", "publish"]}>
      {(permissions) => (
        <QueryState query={pending} rows={3}>
          {(data) => (
            <PublishBody
              courseId={courseId}
              pending={data}
              permissions={permissions}
              reload={() => void pending.refetch()}
            />
          )}
        </QueryState>
      )}
    </EditorFrame>
  )
}
