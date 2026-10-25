"use client"

import { useT } from "@ihsp/i18n"
import { Switch } from "@ihsp/ui"
import { useId } from "react"
import { usePushSubscription, type GetRegistration, type PushStatus } from "./use-push-subscription"

export type PushToggleProps = {
  /** The app's service worker registration; without it the toggle waits for `navigator.serviceWorker.ready`. */
  getRegistration?: GetRegistration
}

const HINT_KEYS: Record<PushStatus, string> = {
  checking: "push.checking",
  unsupported: "push.unsupported",
  "ios-install": "push.iosInstall",
  "no-worker": "push.noWorker",
  unavailable: "push.unavailable",
  denied: "push.denied",
  off: "push.off",
  on: "push.on",
}

/** "Push notifications on this device": a switch with the reason when it cannot be used. */
export function PushToggle({ getRegistration }: PushToggleProps) {
  const t = useT("notificationSettings")
  const { status, busy, failed, enable, disable } = usePushSubscription({ getRegistration })
  const labelId = useId()
  const hintId = useId()
  const usable = status === "on" || status === "off"

  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-medium">
          {t("push.label")}
        </p>
        <p id={hintId} className="text-muted-foreground text-xs">
          {t(HINT_KEYS[status])}
        </p>
        {failed ? (
          <p role="alert" className="text-destructive text-xs">
            {t("push.failed")}
          </p>
        ) : null}
      </div>
      <Switch
        checked={status === "on"}
        disabled={!usable || busy}
        aria-labelledby={labelId}
        aria-describedby={hintId}
        onCheckedChange={(on) => void (on ? enable() : disable())}
      />
    </div>
  )
}
