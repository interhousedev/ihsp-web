"use client"

import { getLmsPreviewStepVideo, resolveFileUrl } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

/**
 * Stream URL for the preview in the editor. A video that is already saved in the draft streams through the LMS
 * (15 minutes); one that was just uploaded is not in the draft yet, so its owner's own file URL is used instead.
 */
export function useEditorVideoUrl({
  courseId,
  stepId,
  blockId,
  fileId,
}: {
  courseId?: string
  stepId?: string
  blockId: string
  fileId: string | null
}) {
  return useQuery({
    queryKey: ["lms", "editor-video", courseId ?? "", stepId ?? "", blockId, fileId],
    enabled: fileId !== null,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async ({ signal }) => {
      if (courseId && stepId) {
        try {
          return (await getLmsPreviewStepVideo(courseId, stepId, blockId, { signal })).url
        } catch {
          // not saved in the draft yet (or not allowed): fall through to the file URL
        }
      }
      return resolveFileUrl(fileId ?? "", true)
    },
  })
}
