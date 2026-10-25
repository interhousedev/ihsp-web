"use client"

import { postIdLoginTicket } from "@ihsp/api"
import { useEffect, useRef, useState } from "react"
import { forgetLoginTicket, readLoginTicket } from "../../shared/utils/login-ticket"
import { redirectTo } from "../../shared/utils/redirect"

/** Redeems a stored registration/reset ticket on this challenge; `pending` while it does. Failure shows the form. */
export function useTicketLogin(challenge: string): boolean {
  const [ticket] = useState(readLoginTicket)
  const [pending, setPending] = useState(ticket !== null)
  const sent = useRef(false) // strict mode runs the effect twice; the ticket is single use

  useEffect(() => {
    if (!ticket || sent.current) return
    sent.current = true
    forgetLoginTicket()
    postIdLoginTicket({ login_challenge: challenge, ticket })
      .then((result) => redirectTo(result.redirect_to))
      .catch(() => setPending(false))
  }, [challenge, ticket])

  return pending
}
