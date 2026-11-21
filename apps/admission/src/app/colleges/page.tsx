"use client"

import { RouteRedirect, type RedirectTarget } from "../../components/route-redirect"

const target: RedirectTarget = () => ({ to: "/chooser/?step=match" })

export default function Page() {
  return <RouteRedirect target={target} />
}
