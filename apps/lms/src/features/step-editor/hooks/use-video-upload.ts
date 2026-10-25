"use client"

import { type FileItem, uploadFile } from "@ihsp/api"
import { useCallback, useEffect, useRef, useState } from "react"

export type VideoUpload = {
  /** Share of the bytes sent, 0 to 100; `null` while no upload runs. */
  progress: number | null
  name: string | null
  error: unknown
  rejected: boolean
  start: (file: File) => Promise<FileItem | null>
  cancel: () => void
  clearError: () => void
}

/** Uploads a lesson video (`purpose: "lms_video"`) with progress; one upload at a time, abortable. */
export function useVideoUpload(): VideoUpload {
  const [progress, setProgress] = useState<number | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [rejected, setRejected] = useState(false)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  const start = useCallback(async (file: File) => {
    controller.current?.abort()
    const abort = new AbortController()
    controller.current = abort
    setError(null)
    setRejected(false)
    setName(file.name)
    setProgress(0)
    try {
      const result = await uploadFile(file, "lms_video", (fraction) => setProgress(Math.round(fraction * 100)), {
        signal: abort.signal,
      })
      if (result.status === "rejected") {
        setRejected(true)
        return null
      }
      return result
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) setError(caught)
      return null
    } finally {
      if (controller.current === abort) {
        controller.current = null
        setProgress(null)
      }
    }
  }, [])

  const cancel = useCallback(() => controller.current?.abort(), [])
  const clearError = useCallback(() => {
    setError(null)
    setRejected(false)
  }, [])

  return { progress, name, error, rejected, start, cancel, clearError }
}
