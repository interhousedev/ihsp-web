"use client"

import { useT } from "@ihsp/i18n"
import { Button, Label, PasswordInput } from "@ihsp/ui"
import { useId, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { PIN_ITERATIONS, createPinRecord, isValidPin, verifyPin, type PinRecord } from "../utils/pin"
import { clearPinRecord, writePinRecord } from "../utils/pin-storage"

export type AppLockMode = "set" | "change" | "remove"

type FormError = "length" | "mismatch" | "wrong" | "storage"

const PIN_FIELD = { inputMode: "numeric", pattern: "[0-9]*", maxLength: 6, autoComplete: "off" } as const

/**
 * Sets, changes or removes the PIN of the app lock. Changing and removing ask for the current PIN first (a wrong one
 * here is not counted towards the five tries of the lock screen: the person is already inside).
 */
export function AppLockForm({
  mode,
  userId,
  record,
  onDone,
  onCancel,
}: {
  mode: AppLockMode
  userId: string
  record: PinRecord | null
  onDone: () => void
  onCancel: () => void
}) {
  const t = useT("pwa")
  const ids = { current: useId(), next: useId(), repeat: useId() }
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [repeat, setRepeat] = useState("")
  const [error, setError] = useState<FormError | null>(null)
  const [busy, setBusy] = useState(false)
  const needsCurrent = mode !== "set"
  const needsNew = mode !== "remove"

  const finish = (message: string) => {
    toast.success(message)
    onDone()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (needsNew && !isValidPin(next)) return setError("length")
    if (needsNew && next !== repeat) return setError("mismatch")
    setBusy(true)
    try {
      if (needsCurrent && !(record && (await verifyPin(record, current)))) return setError("wrong")
      if (mode === "remove") {
        clearPinRecord(userId)
        return finish(t("lock.settings.done.remove"))
      }
      if (!writePinRecord(userId, await createPinRecord(next, PIN_ITERATIONS, record?.relock)))
        return setError("storage")
      finish(mode === "set" ? t("lock.settings.done.set") : t("lock.settings.done.change"))
    } finally {
      setBusy(false)
    }
  }

  const errorText = error ? t(`lock.settings.errors.${error}`) : null

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="mt-4 flex max-w-sm flex-col gap-3">
      {needsCurrent ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.current}>{t("lock.settings.current")}</Label>
          <PasswordInput
            id={ids.current}
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            {...PIN_FIELD}
          />
        </div>
      ) : null}
      {needsNew ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.next}>{t("lock.settings.new")}</Label>
            <PasswordInput
              id={ids.next}
              value={next}
              onChange={(event) => setNext(event.target.value)}
              {...PIN_FIELD}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.repeat}>{t("lock.settings.repeat")}</Label>
            <PasswordInput
              id={ids.repeat}
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
              {...PIN_FIELD}
            />
          </div>
        </>
      ) : null}
      {errorText ? (
        <p role="alert" className="text-destructive text-sm">
          {errorText}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button
          type="submit"
          className="min-h-11"
          variant={mode === "remove" ? "destructive" : "default"}
          disabled={busy}
        >
          {mode === "remove" ? t("lock.settings.remove") : t("lock.settings.save")}
        </Button>
        <Button type="button" variant="ghost" className="min-h-11" disabled={busy} onClick={onCancel}>
          {t("lock.settings.cancel")}
        </Button>
      </div>
    </form>
  )
}
