"use client"

import { RouteRedirect, type RedirectTarget } from "../../components/route-redirect"

// The consultations page lives at /help/.
const target: RedirectTarget = () => ({ to: "/help/" })

export default function Page() {
  return <RouteRedirect target={target} />
}
