"use client"

import { useT } from "@ihsp/i18n"
import * as React from "react"

import { useUnsavedGuard } from "../../hooks/use-unsaved-guard"
import { cn } from "../../lib/utils"
import { Icons } from "../icons"
import { Button } from "./button"
import { LoadingButton } from "./loading-button"

type SaveBarProps = {
  dirty: boolean
  saving: boolean
  /** Omit together with `submit` to let the surrounding form handle the click. */
  onSave?: () => void
  /** Without it there is no Discard button. */
  onDiscard?: () => void
  /** An already translated message of a failed save. */
  error?: React.ReactNode
  /** Whether Save can be pressed; defaults to `dirty`. */
  canSave?: boolean
  /** Save submits the surrounding form. */
  submit?: boolean
  saveLabel?: string
  /** Show "Saved" while clean; off for a form that was never saved. */
  showSaved?: boolean
  /** Extra actions, such as Cancel or Delete. */
  children?: React.ReactNode
  className?: string
}

/**
 * The sticky bar of a long form: the dirty indicator, Save and Discard, with the error of a failed save. It sits above
 * the bottom navigation and the safe area, and guards leaving the page while dirty.
 */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onDiscard,
  error,
  canSave = dirty,
  submit = false,
  saveLabel,
  showSaved = true,
  children,
  className,
}: SaveBarProps) {
  const t = useT()
  useUnsavedGuard(dirty)
  return (
    <div
      data-testid="save-bar"
      className={cn(
        "bg-card sticky bottom-[var(--save-bar-bottom,calc(var(--safe-bottom)+0.5rem))] z-10 flex flex-wrap items-center gap-2 rounded-card border p-2 shadow-sm",
        className,
      )}
    >
      <p
        role="status"
        className="flex min-w-0 flex-1 basis-32 items-center gap-1.5 text-sm"
        data-dirty={dirty ? "true" : "false"}
      >
        {dirty ? (
          <>
            <span aria-hidden className="bg-primary size-2 shrink-0 rounded-full" />
            {t("common.saveBar.unsaved")}
          </>
        ) : showSaved ? (
          <>
            <Icons.check className="text-muted-foreground size-4 shrink-0" aria-hidden />
            <span className="text-muted-foreground">{t("common.saveBar.saved")}</span>
          </>
        ) : null}
      </p>
      {children}
      {onDiscard ? (
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 md:min-h-8"
          disabled={!dirty || saving}
          onClick={onDiscard}
        >
          {t("common.saveBar.discard")}
        </Button>
      ) : null}
      <LoadingButton
        type={submit ? "submit" : "button"}
        className="min-h-11 md:min-h-8"
        loading={saving}
        loadingLabel={t("common.saving")}
        disabled={!canSave}
        onClick={onSave}
      >
        {saveLabel ?? t("common.save")}
      </LoadingButton>
      {error ? (
        <p role="alert" className="text-destructive w-full text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}
