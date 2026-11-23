"use client"

import { type AiReviewFileKind, uploadFile } from "@ihsp/api"
import { useCallback, useEffect, useRef, useState } from "react"
import { isAccepted, uploadContentType } from "../utils/ai-review"

export type ReviewUpload = {
  key: string
  name: string
  /** 0..100 while uploading. */
  progress: number
  status: "uploading" | "done" | "failed" | "rejected"
  fileId: string | null
  contentType: string
  error: unknown
}

/**
 * Uploads files of an AI review (`purpose: "lms_ai_review"`) in parallel, each with its progress. Files of a kind
 * the block does not accept are refused before any request; at most `max` files are kept.
 */
export function useAiReviewUploads(kinds: readonly AiReviewFileKind[], max: number) {
  const [items, setItems] = useState<ReviewUpload[]>([])
  const [refused, setRefused] = useState<string[]>([])
  const controllers = useRef(new Map<string, AbortController>())
  const counter = useRef(0)

  useEffect(() => {
    const running = controllers.current
    return () => running.forEach((controller) => controller.abort())
  }, [])

  const patch = useCallback((key: string, change: Partial<ReviewUpload>) => {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...change } : item)))
  }, [])

  const add = useCallback(
    (files: readonly File[], taken: number) => {
      const wrong: string[] = []
      const room = Math.max(0, max - taken)
      const chosen: File[] = []
      for (const file of files) {
        if (!isAccepted(file, kinds)) wrong.push(file.name)
        else if (chosen.length < room) chosen.push(file)
      }
      setRefused(wrong)
      for (const original of chosen) {
        const type = uploadContentType(original) ?? original.type
        const file = type === original.type ? original : new File([original], original.name, { type })
        counter.current += 1
        const key = `upload-${counter.current}`
        const controller = new AbortController()
        controllers.current.set(key, controller)
        setItems((current) => [
          ...current,
          { key, name: file.name, progress: 0, status: "uploading", fileId: null, contentType: type, error: null },
        ])
        uploadFile(file, "lms_ai_review", (fraction) => patch(key, { progress: Math.round(fraction * 100) }), {
          signal: controller.signal,
        })
          .then((stored) =>
            patch(key, {
              progress: 100,
              status: stored.status === "rejected" ? "rejected" : "done",
              fileId: stored.status === "rejected" ? null : stored.id,
            }),
          )
          .catch((error: unknown) => {
            if (error instanceof DOMException && error.name === "AbortError") return
            patch(key, { status: "failed", error })
          })
          .finally(() => controllers.current.delete(key))
      }
    },
    [kinds, max, patch],
  )

  const remove = useCallback((key: string) => {
    controllers.current.get(key)?.abort()
    controllers.current.delete(key)
    setItems((current) => current.filter((item) => item.key !== key))
  }, [])

  const clear = useCallback(() => {
    setItems([])
    setRefused([])
  }, [])

  const busy = items.some((item) => item.status === "uploading")
  const fileIds = items.flatMap((item) => (item.status === "done" && item.fileId ? [item.fileId] : []))
  return { items, refused, add, remove, clear, busy, fileIds }
}
