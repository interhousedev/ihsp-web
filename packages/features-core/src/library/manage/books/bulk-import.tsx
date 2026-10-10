"use client"

import { keys, postManageImport, type FileItem, type ImportResult } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ihsp/ui"
import { IconCircleCheck, IconFileImport } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { UploadZone } from "../editor/upload-zone"

function ImportOutcome({ result }: { result: ImportResult }) {
  const t = useT("library.manage.import")
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <IconCircleCheck className="size-5 text-emerald-700 dark:text-emerald-300" aria-hidden />
        {t("created", { count: result.created })}
      </p>
      {result.errors.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-destructive text-sm font-medium">{t("errors", { count: result.errors.length })}</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{t("row")}</TableHead>
                <TableHead scope="col">{t("problem")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.errors.map((error) => (
                <TableRow key={`${error.row}-${error.message}`}>
                  <TableCell>{error.row}</TableCell>
                  <TableCell className="whitespace-normal">{error.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{t("noErrors")}</p>
      )}
    </div>
  )
}

/**
 * Bulk import (§ 3.4): upload a CSV (one row per book), then **Import**: good rows become draft books, rows with
 * errors are listed with their row number. The book files are uploaded first and named in the CSV.
 */
export function BulkImport({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("library.manage.import")
  const common = useT("common")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [csv, setCsv] = useState<FileItem | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const run = useMutation({
    mutationFn: (file: FileItem) => postManageImport({ csv_file_id: file.id }),
    onSuccess: (data) => {
      setResult(data)
      void queryClient.invalidateQueries({ queryKey: keys.library.manage.all() })
    },
  })

  function reset() {
    setCsv(null)
    setResult(null)
    run.reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {result ? (
          <ImportOutcome result={result} />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-xs">{t("columns")}</p>
            <UploadZone
              purpose="library_book"
              extensions={[".csv"]}
              label={t("zone")}
              hint={t("hint")}
              chooseLabel={csv ? t("replace") : t("choose")}
              disabled={run.isPending}
              onUploaded={(file) => {
                run.reset()
                setCsv(file)
              }}
            />
            {csv ? <p className="text-sm">{t("ready", { name: csv.name })}</p> : null}
            {run.isError ? (
              <p role="alert" className="text-destructive text-sm">
                {errorMessage(run.error)}
              </p>
            ) : null}
          </div>
        )}
        <DialogFooter>
          {result ? (
            <>
              <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={reset}>
                {t("another")}
              </Button>
              <Button type="button" className="min-h-11 md:min-h-8" onClick={() => onOpenChange(false)}>
                {t("done")}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 md:min-h-8"
                onClick={() => onOpenChange(false)}
              >
                {common("cancel")}
              </Button>
              <Button
                type="button"
                className="min-h-11 md:min-h-8"
                disabled={!csv || run.isPending}
                onClick={() => csv && run.mutate(csv)}
              >
                <IconFileImport aria-hidden />
                {t("run")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
