"use client"

import { deletePushSubscription, getPushConfigQuery, postPushSubscription, type PushSubscriptionBody } from "@ihsp/api"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { applicationServerKey, readPushEnvironment, usesKey, waitForRegistration } from "./push-support"

/**
 * What the push switch of this device can show:
 * `checking` while the device is inspected, `unsupported` (the browser lacks the APIs), `ios-install` (iPhone or iPad
 * in a Safari tab), `no-worker` (no service worker here: the portal or a dev server), `unavailable` (the server has no
 * VAPID keys), `denied` (the user blocked notifications), and `off` or `on`.
 */
export type PushStatus =
  | "checking"
  | "unsupported"
  | "ios-install"
  | "no-worker"
  | "unavailable"
  | "denied"
  | "off"
  | "on"

type DeviceState = "checking" | "unsupported" | "ios-install" | "no-worker" | "denied" | "off" | "on"

export type GetRegistration = () => Promise<ServiceWorkerRegistration | null>

export type UsePushSubscriptionOptions = {
  /**
   * The app's service worker registration (apps/sp hands in `getServiceWorkerRegistration`). Without it the helper
   * waits for `navigator.serviceWorker.ready`.
   */
  getRegistration?: GetRegistration
}

export type PushSubscriptionControls = {
  status: PushStatus
  /** A switch-on or switch-off is under way. */
  busy: boolean
  /** The last switch-on or switch-off failed. */
  failed: boolean
  /** Ask for permission, subscribe through the service worker and tell the server. Call it from a click. */
  enable: () => Promise<void>
  /** Tell the server and drop the browser's subscription. */
  disable: () => Promise<void>
}

function subscriptionBody(subscription: PushSubscription): PushSubscriptionBody | null {
  const { endpoint, keys } = subscription.toJSON()
  if (!endpoint || !keys?.p256dh || !keys.auth) return null
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth }, user_agent: navigator.userAgent }
}

/**
 * Web Push of this device (not of the account): the state of the browser's push subscription, and the calls that
 * create or remove it together with the server's copy (`POST` and `DELETE /v1/me/push-subscriptions`).
 */
export function usePushSubscription({ getRegistration }: UsePushSubscriptionOptions = {}): PushSubscriptionControls {
  const queryClient = useQueryClient()
  const [device, setDevice] = useState<DeviceState>("checking")
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const registrationOf = useRef<GetRegistration>(getRegistration ?? (() => waitForRegistration()))
  useEffect(() => {
    registrationOf.current = getRegistration ?? (() => waitForRegistration())
  }, [getRegistration])

  const config = useQuery({ ...getPushConfigQuery(), enabled: device === "off", staleTime: 5 * 60_000 })

  useEffect(() => {
    let cancelled = false
    async function inspect(): Promise<DeviceState> {
      const environment = readPushEnvironment()
      if (environment.needsInstall) return "ios-install"
      if (!environment.supported) return "unsupported"
      const registration = await registrationOf.current()
      if (!registration) return "no-worker"
      if (Notification.permission === "denied") return "denied"
      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) return "off"
      // Keeps the server's row in step with what the browser holds (it may have been dropped after failed sends, or
      // belong to the person who used this device before). A failure here only means the next push is missed.
      const body = subscriptionBody(subscription)
      if (body) void postPushSubscription(body).catch(() => undefined)
      return "on"
    }
    void inspect()
      .catch(() => "unsupported" as const)
      .then((state) => {
        if (!cancelled) setDevice(state)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const enable = useCallback(async () => {
    setFailed(false)
    setBusy(true)
    try {
      // The permission prompt must be the first thing a click does: browsers drop the user gesture after a network wait.
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setDevice(permission === "denied" ? "denied" : "off")
        return
      }
      const registration = await registrationOf.current()
      if (!registration) {
        setDevice("no-worker")
        return
      }
      const pushConfig = await queryClient.fetchQuery({ ...getPushConfigQuery(), staleTime: 0 })
      if (!pushConfig.enabled || !pushConfig.vapid_public_key) {
        setDevice("off")
        return
      }
      const key = applicationServerKey(pushConfig.vapid_public_key)
      let subscription = await registration.pushManager.getSubscription()
      if (subscription && !usesKey(subscription, key)) {
        await subscription.unsubscribe() // made with an older server key
        subscription = null
      }
      subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
      const body = subscriptionBody(subscription)
      if (!body) throw new Error("incomplete push subscription")
      try {
        await postPushSubscription(body)
      } catch (error) {
        await subscription.unsubscribe().catch(() => false) // never keep a browser subscription the server does not know
        throw error
      }
      setDevice("on")
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }, [queryClient])

  const disable = useCallback(async () => {
    setFailed(false)
    setBusy(true)
    try {
      const registration = await registrationOf.current()
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        // If the server cannot be reached, its row goes away on the first push the push service refuses (410).
        await deletePushSubscription({ endpoint: subscription.endpoint }).catch(() => undefined)
        await subscription.unsubscribe()
      }
      setDevice("off")
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }, [])

  const unavailable = device === "off" && config.data !== undefined && !config.data.enabled
  return { status: unavailable ? "unavailable" : device, busy, failed, enable, disable }
}
