"use client"

import { postMeStudentCardToken } from "@ihsp/api"
import { useEffect, useState } from "react"

export type CardTokenState = {
  token: string | null
  /** Seconds until the next token is requested. */
  secondsLeft: number
  /** The last request failed; the next try comes after `secondsLeft`. */
  failed: boolean
}

const EMPTY: CardTokenState = { token: null, secondsLeft: 0, failed: false }
/** Seconds to wait before asking again after a failed request. */
const RETRY_SECONDS = 5

/**
 * The token of the card's QR code while `open`: a new one is issued every time `open` turns true, then again each
 * `refresh_in` seconds the server names, and never after it turns false. `tickMs` is the length of a second.
 */
export function useCardToken(open: boolean, tickMs = 1000): CardTokenState {
  const [state, setState] = useState<CardTokenState>(EMPTY)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    let busy = false
    let left = 0

    const issue = () => {
      busy = true
      postMeStudentCardToken()
        .then(
          (issued) => {
            if (cancelled) return
            left = issued.refresh_in
            setState({ token: issued.token, secondsLeft: left, failed: false })
          },
          () => {
            if (cancelled) return
            left = RETRY_SECONDS
            setState((current) => ({ ...current, secondsLeft: left, failed: true }))
          },
        )
        .finally(() => {
          busy = false
        })
    }

    setState(EMPTY)
    issue()
    const timer = setInterval(() => {
      if (busy) return
      left -= 1
      if (left <= 0) {
        issue()
        return
      }
      setState((current) => ({ ...current, secondsLeft: left }))
    }, tickMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [open, tickMs])

  return open ? state : EMPTY
}
