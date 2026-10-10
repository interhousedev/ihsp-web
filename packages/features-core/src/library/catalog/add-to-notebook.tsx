"use client"

import { getNotebooksQuery, postNotebook, postNotebookSources } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenuItem,
  Input,
  Label,
  NativeSelect,
  NativeSelectOption,
  cn,
} from "@ihsp/ui"
import { IconNotebook } from "@ihsp/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { useLibraryAccess } from "../hooks/use-library-access"
import { notebookHref } from "../utils/hrefs"
import { asSourcesBody, libraryItemSource, parsePage } from "./library-source"
import { SignInLink } from "./sign-in-link"

const NEW_NOTEBOOK = "__new__"

export type AddToNotebookProps = {
  itemId: string
  fileId: string
  title: string
  pageCount?: number | null
  /** Pre-selected range, for example the page the reader is on. */
  pageFrom?: number | null
  pageTo?: number | null
  /** `no_text` scans cannot be read by a notebook. */
  noText?: boolean
  /** Contents entries of the file, offered as chapter shortcuts. */
  toc?: readonly { title: string; page?: number | undefined; level: number }[]
  disabled?: boolean
  variant?: "button" | "menu-item"
  className?: string
}

/** The dialog of `AddToNotebookButton`, for callers that open it from their own control (the reader's selection toolbar). */
export function AddDialog({
  open,
  onOpenChange,
  itemId,
  fileId,
  title,
  pageCount,
  pageFrom,
  pageTo,
  noText,
  toc,
}: AddToNotebookProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("library.notebook")
  const errorMessage = useErrorMessage()
  const notebooks = useQuery({ ...getNotebooksQuery({ limit: 50 }), enabled: open })
  const [notebookId, setNotebookId] = useState<string>(NEW_NOTEBOOK)
  const [whole, setWhole] = useState(!(pageFrom || pageTo))
  const [from, setFrom] = useState(pageFrom ? String(pageFrom) : "")
  const [to, setTo] = useState(pageTo ? String(pageTo) : "")

  const add = useMutation({
    mutationFn: async () => {
      let target = notebookId
      let name = notebooks.data?.items.find((item) => item.id === notebookId)?.title ?? title
      if (target === NEW_NOTEBOOK) {
        const created = await postNotebook({ title })
        target = created.id
        name = created.title
      }
      const source = libraryItemSource({
        itemId,
        fileId,
        pageFrom: whole ? null : parsePage(from),
        pageTo: whole ? null : parsePage(to),
      })
      const result = await postNotebookSources(target, asSourcesBody([source]))
      return { id: target, name, rejected: result.rejected.length > 0 }
    },
    onSuccess: ({ id, name, rejected }) => {
      onOpenChange(false)
      if (rejected) {
        toast.error(t("rejected"))
        return
      }
      toast.success(t("added"), {
        description: name,
        action: { label: t("open"), onClick: () => window.location.assign(notebookHref(id)) },
      })
    },
  })

  const chapters = (toc ?? []).filter((entry) => entry.page !== undefined)
  const rangeInvalid = !whole && parsePage(from) === null && parsePage(to) === null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {noText ? (
          <p role="alert" className="text-sm text-amber-800 dark:text-amber-200">
            {t("noText")}
          </p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              add.mutate()
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="library-notebook">{t("choose")}</Label>
              <NativeSelect
                id="library-notebook"
                className="w-full"
                value={notebookId}
                onChange={(event) => setNotebookId(event.target.value)}
              >
                <NativeSelectOption value={NEW_NOTEBOOK}>{t("newNotebook")}</NativeSelectOption>
                {notebooks.data?.items.map((notebook) => (
                  <NativeSelectOption key={notebook.id} value={notebook.id}>
                    {notebook.title}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {notebooks.data && notebooks.data.items.length === 0 ? (
                <p className="text-muted-foreground text-xs">{t("noNotebooks")}</p>
              ) : null}
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">{t("range")}</legend>
              <Label className="min-h-11 gap-3 font-normal md:min-h-9">
                <input
                  type="radio"
                  name="library-range"
                  checked={whole}
                  onChange={() => setWhole(true)}
                  className="size-4"
                />
                {t("whole")}
              </Label>
              <Label className="min-h-11 gap-3 font-normal md:min-h-9">
                <input
                  type="radio"
                  name="library-range"
                  checked={!whole}
                  onChange={() => setWhole(false)}
                  className="size-4"
                />
                {t("range")}
              </Label>
              {whole ? null : (
                <div className="flex flex-col gap-3">
                  <p className="text-muted-foreground text-xs">{t("rangeHint")}</p>
                  {chapters.length > 0 ? (
                    <NativeSelect
                      aria-label={t("toc")}
                      className="w-full"
                      value=""
                      onChange={(event) => {
                        const index = Number(event.target.value)
                        const start = chapters[index]
                        if (!start?.page) return
                        const next = chapters.slice(index + 1).find((entry) => entry.level <= start.level)
                        setFrom(String(start.page))
                        setTo(
                          next?.page ? String(Math.max(start.page, next.page - 1)) : pageCount ? String(pageCount) : "",
                        )
                      }}
                    >
                      <NativeSelectOption value="">{t("tocPick")}</NativeSelectOption>
                      {chapters.map((entry, index) => (
                        <NativeSelectOption key={`${entry.title}-${index}`} value={String(index)}>
                          {" ".repeat(entry.level * 2)}
                          {entry.title}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  ) : null}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="library-from">{t("from")}</Label>
                      <Input
                        id="library-from"
                        inputMode="numeric"
                        value={from}
                        onChange={(event) => setFrom(event.target.value)}
                        className="min-h-11 md:min-h-8"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="library-to">{t("to")}</Label>
                      <Input
                        id="library-to"
                        inputMode="numeric"
                        value={to}
                        onChange={(event) => setTo(event.target.value)}
                        className="min-h-11 md:min-h-8"
                      />
                    </div>
                  </div>
                </div>
              )}
            </fieldset>
            {add.isError ? (
              <p role="alert" className="text-destructive text-sm">
                {errorMessage(add.error)}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" className="min-h-11 md:min-h-8" disabled={add.isPending || rangeInvalid}>
                {add.isPending ? t("adding") : t("add")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * "Add to notebook" for a book or material (never for UniLibrary): pick a notebook (or a new one), optionally a page
 * range or a chapter, and the item becomes a source of that notebook; a toast links to the notebook in `sp`.
 * Signed-out visitors get a "Sign in" button.
 */
export function AddToNotebookButton(props: AddToNotebookProps) {
  const t = useT("library.notebook")
  const { status, signedIn } = useLibraryAccess()
  const [open, setOpen] = useState(false)
  const variant = props.variant ?? "button"

  if (!signedIn) {
    if (status === "loading" || variant === "menu-item") return null
    return <SignInLink label={t("signIn")} className={props.className} />
  }
  return (
    <>
      {variant === "menu-item" ? (
        <DropdownMenuItem className="min-h-11 md:min-h-8" disabled={props.disabled} onClick={() => setOpen(true)}>
          <IconNotebook aria-hidden />
          {t("addTo")}
        </DropdownMenuItem>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={props.disabled}
          className={cn("min-h-11 md:min-h-8", props.className)}
          onClick={() => setOpen(true)}
        >
          <IconNotebook aria-hidden />
          {t("addTo")}
        </Button>
      )}
      {open ? <AddDialog {...props} open={open} onOpenChange={setOpen} /> : null}
    </>
  )
}
