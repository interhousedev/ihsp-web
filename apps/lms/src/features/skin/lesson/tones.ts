"use client"

import { useCallback, useState } from "react"
import { SOUND_STORAGE_KEY } from "../skin"

/** Our own short tones, synthesised with WebAudio: no audio files ship with the app. */
export type Tone = "correct" | "wrong" | "complete"

const NOTES: Record<Tone, { type: OscillatorType; notes: readonly number[]; step: number }> = {
  correct: { type: "sine", notes: [784, 1175], step: 0.09 },
  wrong: { type: "triangle", notes: [311, 233], step: 0.12 },
  complete: { type: "sine", notes: [523, 659, 784, 1047], step: 0.1 },
}

let context: AudioContext | null = null

function play(tone: Tone): void {
  if (typeof window === "undefined" || typeof window.AudioContext !== "function") return
  context ??= new window.AudioContext()
  const { type, notes, step } = NOTES[tone]
  const start = context.currentTime + 0.01
  notes.forEach((frequency, index) => {
    const at = start + index * step
    const osc = context!.createOscillator()
    const gain = context!.createGain()
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.18, at + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + step + 0.08)
    osc.connect(gain).connect(context!.destination)
    osc.start(at)
    osc.stop(at + step + 0.1)
  })
}

function readSound(): boolean {
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) === "on"
  } catch {
    return false
  }
}

/** Sound is off unless the learner turned it on (here or in Settings); the choice is kept on this device. */
export function useLessonSound(): { on: boolean; toggle: () => void; play: (tone: Tone) => void } {
  const [on, setOn] = useState(() => (typeof window === "undefined" ? false : readSound()))
  const toggle = useCallback(() => {
    setOn((previous) => {
      const next = !previous
      try {
        window.localStorage.setItem(SOUND_STORAGE_KEY, next ? "on" : "off")
      } catch {
        // Private mode: the toggle still works for this lesson.
      }
      return next
    })
  }, [])
  const playIfOn = useCallback((tone: Tone) => (on ? play(tone) : undefined), [on])
  return { on, toggle, play: playIfOn }
}
