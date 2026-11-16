"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  ResponsiveDialog,
  Spinner,
} from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { ASSIGNABLE_SEARCH_MIN, useCoverMutations, useCoveringOfficers, useOfficerCandidates } from "../api"

function AddOfficer() {
  const t = useT("staff")
  const errorMessage = useErrorMessage()
  const { grant } = useCoverMutations()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const users = useOfficerCandidates(q, open)

  async function pick(userId: string) {
    try {
      await grant.mutateAsync(userId)
      toast.success(t("cover.done"))
      setOpen(false)
      setQ("")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t("cover.add")}
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title={t("cover.dialogTitle")}>
        <Command shouldFilter={false} className="rounded-card border">
          <CommandInput value={q} onValueChange={setQ} placeholder={t("cover.searchPlaceholder")} />
          <CommandList>
            {q.trim().length < ASSIGNABLE_SEARCH_MIN ? (
              <p className="text-muted-foreground p-3 text-sm">
                {t("cover.minChars", { count: ASSIGNABLE_SEARCH_MIN })}
              </p>
            ) : users.isPending ? (
              <div className="flex justify-center p-3">
                <Spinner />
              </div>
            ) : users.isError ? (
              <p role="alert" className="text-destructive p-3 text-sm">
                {errorMessage(users.error)}
              </p>
            ) : (
              <>
                <CommandEmpty>{t("cover.none")}</CommandEmpty>
                <CommandGroup>
                  {users.data.items.map((item) => (
                    <CommandItem key={item.user_id} value={item.user_id} onSelect={() => void pick(item.user_id)}>
                      {item.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </ResponsiveDialog>
    </>
  )
}

/** Admin-only list of transcript officers that cover every student; the server enforces the role. */
export function CoveringOfficers() {
  const t = useT("staff")
  const errorMessage = useErrorMessage()
  const officers = useCoveringOfficers(true)
  const { revoke } = useCoverMutations()

  async function remove(id: string) {
    try {
      await revoke.mutateAsync(id)
      toast.success(t("cover.revoked"))
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{t("cover.title")}</h2>
        <AddOfficer />
      </div>
      <p className="text-muted-foreground text-sm">{t("cover.hint")}</p>
      {officers.isPending ? (
        <Spinner />
      ) : officers.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(officers.error)}
        </p>
      ) : officers.data.items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("cover.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {officers.data.items.map((item) => (
            <li key={item.assignment_id} className="flex items-center justify-between gap-2 text-sm">
              <span>{item.name ?? item.login ?? item.user_id}</span>
              <Button variant="ghost" size="sm" onClick={() => void remove(item.assignment_id)}>
                {t("cover.revoke")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
