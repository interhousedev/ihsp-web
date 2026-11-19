"use client"

import { RouteRedirect, type RedirectTarget } from "../../components/route-redirect"

const target: RedirectTarget = () => ({ to: "/essays/?tab=story#words" })

export default function Page() {
  return <RouteRedirect target={target} />
}
