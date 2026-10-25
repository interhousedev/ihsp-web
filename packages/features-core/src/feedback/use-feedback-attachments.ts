"use client"

import { FEEDBACK_MAX_ATTACHMENTS, uploadFile } from "@ihsp/api"
import { useCallback, useEffect, useRef, useState } from "react"

export type FeedbackAttachmentStatus = "uploading" | "ready" | "failed"

/** Why a file of a report failed: the transfer broke, or the backend refused the content after it arrived. */
export type FeedbackAttachmentError = "failed" | "rejected"

export type FeedbackAttachment = {
  key: string
  name: string
  size: number
  /** Object URL of the picked image, revoked when the attachment is removed or the form closes. */
  previewUrl: string
  /** Fraction of the bytes sent, from 0 to 1. */
  progress: number
  status: FeedbackAttachmentStatus
  fileId: string | null
  error: FeedbackAttachmentError | null
}

/** A problem with what the user picked, shown next to the attachment field. */
export type FeedbackAttachmentIssue = "tooMany" | "notImage"

let sequence = 0

/**
 * The attachments of one report: picked images upload at once (`purpose: "feedback"`), each with its own progress;
 * removing one aborts its upload. The report can be sent once nothing is still uploading and nothing failed.
 */
export function useFeedbackAttachments(max: number = FEEDBACK_MAX_ATTACHMENTS) {
  const [items, setItems] = useState<FeedbackAttachment[]>([])
  const [issue, setIssue] = useState<FeedbackAttachmentIssue | null>(null)
  const controllers = useRef(new Map<string, AbortController>())
  const latest = useRef<FeedbackAttachment[]>([])
  useEffect(() => {
    latest.current = items
  }, [items])

  const patch = useCallback((key: string, change: Partial<FeedbackAttachment>) => {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...change } : item)))
  }, [])

  const upload = useCallback(
    (key: string, file: File) => {
      const controller = new AbortController()
      controllers.current.set(key, controller)
      uploadFile(file, "feedback", (fraction) => patch(key, { progress: fraction }), {
        signal: controller.signal,
      })
        .then((uploaded) => {
          if (uploaded.status === "rejected") {
            patch(key, { status: "failed", error: "rejected" })
            return
          }
          patch(key, { status: "ready", progress: 1, fileId: uploaded.id })
        })
        .catch(() => {
          if (!controller.signal.aborted) patch(key, { status: "failed", error: "failed" })
        })
        .finally(() => controllers.current.delete(key))
    },
    [patch],
  )

  /** Adds the picked files that are images, up to the limit; returns the issue to show, if any. */
  const add = useCallback(
    (files: readonly File[]): FeedbackAttachmentIssue | null => {
      const room = max - latest.current.length
      const images = files.filter((file) => file.type.startsWith("image/"))
      const nextIssue: FeedbackAttachmentIssue | null =
        images.length < files.length ? "notImage" : files.length > room ? "tooMany" : null
      setIssue(nextIssue)
      const accepted = images.slice(0, Math.max(room, 0))
      const created = accepted.map((file) => {
        sequence += 1
        const key = `attachment-${sequence}`
        return {
          key,
          file,
          item: {
            key,
            name: file.name,
            size: file.size,
            previewUrl: URL.createObjectURL(file),
            progress: 0,
            status: "uploading" as const,
            fileId: null,
            error: null,
          },
        }
      })
      setItems((current) => [...current, ...created.map((entry) => entry.item)])
      for (const entry of created) upload(entry.key, entry.file)
      return nextIssue
    },
    [max, upload],
  )

  const remove = useCallback((key: string) => {
    controllers.current.get(key)?.abort()
    controllers.current.delete(key)
    setIssue(null)
    setItems((current) => {
      const removed = current.find((item) => item.key === key)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return current.filter((item) => item.key !== key)
    })
  }, [])

  useEffect(() => {
    const active = controllers.current
    return () => {
      for (const controller of active.values()) controller.abort()
      active.clear()
      for (const item of latest.current) URL.revokeObjectURL(item.previewUrl)
    }
  }, [])

  return {
    items,
    issue,
    add,
    remove,
    readyIds: items.filter((item) => item.status === "ready").map((item) => item.fileId as string),
    hasPending: items.some((item) => item.status === "uploading"),
    hasFailed: items.some((item) => item.status === "failed"),
  }
}
