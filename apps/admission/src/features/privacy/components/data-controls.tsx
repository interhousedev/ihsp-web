"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, Button, ConfirmDialog, Icons, Input } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { eraseData, getExport } from "../../consent/api"

function downloadJson(data: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }))
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

/** Export of the student's admission data as a JSON file, and erasure behind a typed confirmation. */
export function DataControls() {
  const t = useT("privacy")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState("")
  const word = t("erase.word")

  const exported = useMutation({
    mutationFn: getExport,
    onSuccess: (data) => downloadJson(data, `admission-data-${data.generated_at.slice(0, 10)}.json`),
  })
  const erase = useMutation({
    mutationFn: eraseData,
    onSuccess: () => {
      setOpen(false)
      setTyped("")
      queryClient.removeQueries({ queryKey: ["admission"] })
      router.replace("/setup/")
    },
  })
  const total = Object.values(erase.data?.deleted ?? {}).reduce((sum, count) => sum + count, 0)

  return (
    <section className="grid gap-3" aria-labelledby="data-title">
      <h2 id="data-title" className="text-base font-semibold">
        {t("data.title")}
      </h2>
      <div className="grid gap-1">
        <p className="text-muted-foreground text-sm">{t("export.text")}</p>
        <div>
          <Button type="button" variant="outline" disabled={exported.isPending} onClick={() => exported.mutate()}>
            <Icons.files className="size-4" />
            {t("export.action")}
          </Button>
        </div>
        {exported.isError ? <Alert variant="destructive">{errorMessage(exported.error)}</Alert> : null}
      </div>
      <div className="grid gap-1">
        <p className="text-muted-foreground text-sm">{t("erase.text")}</p>
        <div>
          <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
            <Icons.trash className="size-4" />
            {t("erase.action")}
          </Button>
        </div>
        {erase.isSuccess ? <Alert>{t("erase.done", { count: total })}</Alert> : null}
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setTyped("")
        }}
        title={t("erase.title")}
        description={t("erase.warning")}
        confirmLabel={t("erase.confirm")}
        destructive
        loading={erase.isPending}
        confirmDisabled={typed.trim() !== word}
        onConfirm={() => erase.mutate()}
      >
        <label className="grid gap-1.5 text-sm">
          {t("erase.typePrompt", { word })}
          <Input value={typed} autoComplete="off" onChange={(event) => setTyped(event.target.value)} />
        </label>
        {erase.isError ? <Alert variant="destructive">{errorMessage(erase.error)}</Alert> : null}
      </ConfirmDialog>
    </section>
  )
}
