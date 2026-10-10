"use client"

import { useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { usePinSignOut } from "./use-pin-sign-out"
import { attemptsLeft, registerRightPin, registerWrongPin, verifyPin, type PinRecord } from "./pin"
import { writePinRecord } from "./pin-storage"
import { PinDots } from "./pin-dots"
import { PinKeypad } from "./pin-keypad"

/**
 * The lock screen of the installed app: it covers everything until the PIN is entered. The PIN is checked when its last
 * digit is typed (the dots show how long it is). Five wrong tries, or "Forgot PIN?", sign the user out; that removes the
 * PIN together with the session. Typing works with the number pad and with a keyboard.
 */
export function PinLockScreen({
  userId,
  record,
  onUnlock,
}: {
  userId: string
  record: PinRecord
  onUnlock: () => void
}) {
  const t = useT("pwa")
  const [digits, setDigits] = useState("")
  const [busy, setBusy] = useState(false)
  const [wrongLeft, setWrongLeft] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { signOut, busy: signingOut, failed: signOutFailed } = usePinSignOut()
  const lockedOut = attemptsLeft(record) === 0
  const checking = useRef(false)

  useEffect(() => {
    // Also after a reload: the tries are stored, so a locked-out user cannot get more by reopening the app.
    if (lockedOut) void signOut()
  }, [lockedOut, signOut])

  const check = async (pin: string) => {
    if (checking.current) return
    checking.current = true
    setBusy(true)
    try {
      if (await verifyPin(record, pin)) {
        const cleared = registerRightPin(record)
        if (cleared !== record) writePinRecord(userId, cleared)
        onUnlock()
        return
      }
      const result = registerWrongPin(record)
      writePinRecord(userId, result.record)
      setWrongLeft(result.attemptsLeft)
      setDigits("")
    } finally {
      checking.current = false
      setBusy(false)
    }
  }

  const press = (digit: string) => {
    if (lockedOut || checking.current || digits.length >= record.length) return
    const next = digits + digit
    setDigits(next)
    if (next.length === record.length) void check(next)
  }

  const erase = () => setDigits((current) => current.slice(0, -1))

  // The keyboard listener is added once and always calls the latest handlers.
  const keys = useRef({ press, erase })
  useEffect(() => {
    keys.current = { press, erase }
  })
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (confirmOpen) return
      if (/^\d$/.test(event.key)) keys.current.press(event.key)
      else if (event.key === "Backspace") keys.current.erase()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [confirmOpen])

  const status = lockedOut
    ? t("lock.lockedOut")
    : wrongLeft !== null
      ? t("lock.wrong", { count: wrongLeft })
      : t("lock.prompt")

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-lock-title"
      className="bg-background fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 overflow-y-auto p-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <Icons.logo aria-hidden className="size-9" />
      <h1 id="pwa-lock-title" className="text-xl font-semibold">
        {t("lock.title")}
      </h1>
      <p
        role="status"
        className={`text-sm ${wrongLeft !== null || lockedOut ? "text-destructive" : "text-muted-foreground"}`}
      >
        {status}
      </p>
      <PinDots length={record.length} filled={digits.length} />
      <PinKeypad disabled={busy || lockedOut} onDigit={press} onDelete={erase} />
      {signOutFailed ? (
        <div role="alert" className="flex max-w-xs flex-col items-center gap-2 text-center text-sm">
          <p>{t("lock.signOutFailed")}</p>
          <Button variant="outline" className="min-h-11" onClick={() => void signOut()}>
            {t("lock.retry")}
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="min-h-11"
          disabled={lockedOut || signingOut}
          onClick={() => setConfirmOpen(true)}
        >
          {t("lock.forgot")}
        </Button>
      )}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("lock.forgotTitle")}
        description={t("lock.forgotText")}
        confirmLabel={t("lock.forgotConfirm")}
        destructive
        loading={signingOut}
        onConfirm={() => {
          // The dialog closes first: a failed sign-out is reported on the lock screen itself.
          setConfirmOpen(false)
          return signOut()
        }}
      />
    </div>
  )
}
