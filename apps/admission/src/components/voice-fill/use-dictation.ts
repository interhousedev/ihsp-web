"use client"

import { useEffect, useRef, useState } from "react"

type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult:
    | ((e: {
        resultIndex: number
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>
      }) => void)
    | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}
type Ctor = new () => Recognition

function ctor(): Ctor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * Web Speech dictation. `supported` is false where the browser has no recognizer; final phrases go to `onText`,
 * and when `onInterim` is given it also receives the not yet final phrase being spoken ("" once it is final).
 */
export function useDictation(lang: string, onText: (phrase: string) => void, onInterim?: (phrase: string) => void) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const rec = useRef<Recognition | null>(null)
  const cb = useRef(onText)
  cb.current = onText
  const live = useRef(onInterim)
  live.current = onInterim
  useEffect(() => {
    setSupported(ctor() !== null)
    return () => rec.current?.stop()
  }, [])
  const stop = () => rec.current?.stop()
  const start = () => {
    const C = ctor()
    if (!C) return
    const r = new C()
    r.lang = lang
    r.continuous = true
    r.interimResults = live.current !== undefined
    r.onresult = (e) => {
      let interim = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        if (!res?.[0]) continue
        if (res.isFinal) cb.current(res[0].transcript)
        else interim += res[0].transcript
      }
      live.current?.(interim)
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    rec.current = r
    r.start()
    setListening(true)
  }
  return { supported, listening, start, stop }
}
