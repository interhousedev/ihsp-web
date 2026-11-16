"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useAddToList, useList } from "../hooks"

/** Adds an institution to the student's list; shows "In your list" once it is there. */
export function AddToListButton({ institutionId, className }: { institutionId: string; className?: string }) {
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
        disabled={inList || add.isPending || list.isLoading}
        onClick={() => add.mutate({ institution_id: institutionId })}
      >
        {inList ? <Icons.check aria-hidden /> : <Icons.add aria-hidden />}
        {inList ? t("inList") : t("addToList")}
      </Button>
      {add.isError ? (
        <p role="alert" className="text-destructive pt-1 text-xs">
          {errorMessage(add.error)}
        </p>
      ) : null}
    </div>
  )
}
