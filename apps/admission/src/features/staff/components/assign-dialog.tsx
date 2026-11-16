"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  LoadingButton,
  ResponsiveDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import {
  ASSIGNABLE_SEARCH_MIN,
  useAssignableRoles,
  useAssignableUsers,
  useAssignmentMutations,
  type AssignableRole,
  type AssignableUser,
} from "../api"

/** Gives a staff member a role for this student (scope `student`); both pickers are backed by the server. */
export function AssignDialog({ studentId }: { studentId: string }) {
  const t = useT("staff")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const { assign } = useAssignmentMutations()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [user, setUser] = useState<AssignableUser | null>(null)
  const [roleId, setRoleId] = useState("")
  const users = useAssignableUsers(studentId, q, open && !user)
  const roles = useAssignableRoles(studentId, open)
  const fits = (roles.data?.items ?? []).filter((role) => user?.kinds.includes(role.kind))
  const roleName = (role: AssignableRole) => role.name_i18n[locale] || role.name
  const ready = !!user && !!roleId

  function reset() {
    setQ("")
    setUser(null)
    setRoleId("")
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    try {
      await assign.mutateAsync({
        user_id: user.user_id,
        staff_role_id: roleId,
        scope_kind: "student",
        scope_ref: studentId,
      })
      toast.success(t("assign.done"))
      setOpen(false)
      reset()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t("assign.open")}
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={t("assign.title")}
        onSubmit={submit}
        footer={
          <LoadingButton type="submit" loading={assign.isPending} disabled={!ready}>
            {t("assign.submit")}
          </LoadingButton>
        }
      >
        <div className="flex flex-col gap-3">
          {user ? (
            <div className="flex items-center justify-between gap-2 rounded-card border p-2 text-sm">
              <span>{user.name}</span>
              <Button type="button" variant="ghost" size="sm" onClick={reset}>
                {t("assign.change")}
              </Button>
            </div>
          ) : (
            <Command shouldFilter={false} className="rounded-card border">
              <CommandInput value={q} onValueChange={setQ} placeholder={t("assign.searchPlaceholder")} />
              <CommandList>
                {q.trim().length < ASSIGNABLE_SEARCH_MIN ? (
                  <p className="text-muted-foreground p-3 text-sm">
                    {t("assign.minChars", { count: ASSIGNABLE_SEARCH_MIN })}
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
                    <CommandEmpty>{t("assign.none")}</CommandEmpty>
                    <CommandGroup>
                      {users.data.items.map((item) => (
                        <CommandItem
                          key={item.user_id}
                          value={item.user_id}
                          onSelect={() => {
                            setUser(item)
                            setRoleId("")
                          }}
                        >
                          {item.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          )}
          <Select value={roleId} onValueChange={(value) => setRoleId(value ?? "")} disabled={!user}>
            <SelectTrigger aria-label={t("assign.role")} className="min-h-11 w-full md:min-h-8">
              <SelectValue placeholder={t("assign.rolePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {fits.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {roleName(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ResponsiveDialog>
    </>
  )
}
