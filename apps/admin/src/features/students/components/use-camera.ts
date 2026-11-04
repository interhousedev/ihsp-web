"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/** `unavailable`: the browser has no camera API or no camera; `denied`: the user or the browser refused access. */
export type CameraStatus = "idle" | "starting" | "live" | "denied" | "unavailable"

/**
 * The device camera for a photo: starts on demand and returns the stream for the preview. Stopping (or unmounting,
 * e.g. closing the dialog) stops every track, so the camera light goes off.
 */
export function useCamera() {
  const [status, setStatus] = useState<CameraStatus>("idle")
  const [stream, setStream] = useState<MediaStream | null>(null)
  const current = useRef<MediaStream | null>(null)
  const alive = useRef(true)

  const stop = useCallback(() => {
    current.current?.getTracks().forEach((track) => track.stop())
    current.current = null
    setStream(null)
    setStatus("idle")
  }, [])

  const start = useCallback(async () => {
    const devices = typeof navigator === "undefined" ? undefined : navigator.mediaDevices
    if (!devices?.getUserMedia) {
      setStatus("unavailable")
      return
    }
    setStatus("starting")
    try {
      const next = await devices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      if (!alive.current) {
        next.getTracks().forEach((track) => track.stop())
        return
      }
      current.current?.getTracks().forEach((track) => track.stop())
      current.current = next
      setStream(next)
      setStatus("live")
    } catch (error) {
      if (!alive.current) return
      const refused =
        error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError")
      setStatus(refused ? "denied" : "unavailable")
    }
  }, [])

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      current.current?.getTracks().forEach((track) => track.stop())
      current.current = null
    }
  }, [])

  return { status, stream, start, stop }
}
