"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useAddToList, useList } from "../hooks"

/** Adds an institution to the student's list; shows "In your list" once it is there. */
export function AddToListButton({
  institutionId,
  className,
  compact = false,
}: {
  institutionId: string
  className?: string
  /** Icon only (a catalogue row); the label stays as the accessible name. */
  compact?: boolean
}) {
  const t = useT("chooser")
  const errorMessage = useErrorMessage()
  const list = useList()
  const add = useAddToList()
  const inList = list.data?.some((entry) => entry.institution.id === institutionId) ?? false
  return (
    <div className={className}>
      <Button
        type="button"
        variant={inList ? "outline" : "default"}
        size={compact ? "icon" : undefined}
        aria-label={compact ? (inList ? t("inList") : t("addToList")) : undefined}
        title={compact ? (inList ? t("inList") : t("addToList")) : undefined}
        disabled={inList || add.isPending || list.isLoading}
        onClick={() => add.mutate({ institution_id: institutionId })}
      >
        {inList ? <Icons.check aria-hidden /> : <Icons.add aria-hidden />}
        {compact ? null : inList ? t("inList") : t("addToList")}
      </Button>
      {add.isError ? (
        <p role="alert" className="text-destructive pt-1 text-xs">
          {errorMessage(add.error)}
        </p>
      ) : null}
    </div>
  )
}
