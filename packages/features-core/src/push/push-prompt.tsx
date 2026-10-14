"use client"

import { getPushConfigQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { usePushSubscription, type GetRegistration, type PushStatus } from "./use-push-subscription"

/** How long "Not now" keeps the sheet away, and the Home Screen hint (asked less often: it needs the user to act). */
export const ASK_SNOOZE_MS = 7 * 24 * 60 * 60_000
export const INSTALL_SNOOZE_MS = 30 * 24 * 60 * 60_000
export const PUSH_PROMPT_STORAGE_KEY = "ihsp.push-prompt.snoozed-until"

export type PushPromptKind = "ask" | "install"

/**
 * Which sheet to show, if any: `ask` when the installed app can subscribe and the user was never asked (permission
 * `default`, the server has VAPID keys); `install` for an iPhone or iPad in a Safari tab. Nothing while snoozed.
 */
export function pushPromptKind(input: {
  status: PushStatus
  permission: NotificationPermission | null
  serverEnabled: boolean
  snoozedUntil: number
  now: number
}): PushPromptKind | null {
  if (input.now < input.snoozedUntil) return null
  if (input.status === "ios-install") return "install"
  if (input.status === "off" && input.permission === "default" && input.serverEnabled) return "ask"
  return null
}

function readSnooze(): number {
  try {
    const value = Number(window.localStorage.getItem(PUSH_PROMPT_STORAGE_KEY))
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

function writeSnooze(until: number): void {
  try {
    window.localStorage.setItem(PUSH_PROMPT_STORAGE_KEY, String(until))
  } catch {
    // Private mode: the sheet comes back next time, which is harmless.
  }
}

function currentPermission(): NotificationPermission | null {
  return typeof Notification === "undefined" ? null : Notification.permission
}

export type PushPromptProps = {
  /** The app's service worker registration (see `usePushSubscription`). */
  getRegistration?: GetRegistration
}

/**
 * A bottom sheet that offers push notifications to a signed-in user. iOS only lets an installed app ask, and only from a
 * tap, so "Allow" calls `Notification.requestPermission` first and then subscribes and tells the server. Render it
 * only for a signed-in user.
 */
export function PushPrompt({ getRegistration }: PushPromptProps) {
  const t = useT("notificationSettings")
  const { status, busy, failed, enable } = usePushSubscription({ getRegistration })
  const config = useQuery({ ...getPushConfigQuery(), enabled: status === "off", staleTime: 5 * 60_000 })
  const [kind, setKind] = useState<PushPromptKind | null>(null)

  useEffect(() => {
    if (kind !== null) return
    setKind(
      pushPromptKind({
        status,
        permission: currentPermission(),
        serverEnabled: config.data?.enabled === true && Boolean(config.data.vapid_public_key),
        snoozedUntil: readSnooze(),
        now: Date.now(),
      }),
    )
  }, [status, config.data, kind])

  // Done once the device is subscribed or the user said no in the system dialog.
  useEffect(() => {
    if (kind === "ask" && (status === "on" || status === "denied")) setKind(null)
  }, [kind, status])

  function snooze() {
    writeSnooze(Date.now() + (kind === "install" ? INSTALL_SNOOZE_MS : ASK_SNOOZE_MS))
    setKind(null)
  }

  const open = kind !== null
  return (
    <Drawer open={open} onOpenChange={(next) => (next ? undefined : snooze())}>
      <DrawerContent>
        <DrawerHeader className="text-start">
          <DrawerTitle>{t(kind === "install" ? "prompt.installTitle" : "prompt.title")}</DrawerTitle>
          <DrawerDescription>{t(kind === "install" ? "prompt.installBody" : "prompt.body")}</DrawerDescription>
        </DrawerHeader>
        {failed ? (
          <p role="alert" className="text-destructive px-4 text-sm">
            {t("push.failed")}
          </p>
        ) : null}
        <DrawerFooter className="pt-4">
          {kind === "ask" ? (
            <Button onClick={() => void enable()} disabled={busy}>
              {t("prompt.allow")}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={snooze} disabled={busy}>
            {t(kind === "install" ? "prompt.ok" : "prompt.notNow")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
