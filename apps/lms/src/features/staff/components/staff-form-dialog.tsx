"use client"

import type { CourseStaffItem } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  NativeSelect,
  NativeSelectOption,
  Spinner,
  Switch,
} from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { ALL_PERMISSIONS, ROLE_PRESETS, type CoursePermission } from "../../shared/utils/permissions"

export type StaffFormValues = {
  login: string
  role: string
  permissions: CoursePermission[]
  show_on_page: boolean
  position: number
}

/** Adds a staff member by login or edits one: role preset or free-text role, permissions, visibility and order. */
export function StaffFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  nextPosition,
  pending,
  error,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit"
  initial?: CourseStaffItem
  nextPosition: number
  pending: boolean
  error: unknown
  onSubmit: (values: StaffFormValues) => void
}) {
  const t = useT("staff")
  const tc = useT("common")
  const errorMessage = useErrorMessage()
  const [login, setLogin] = useState("")
  const [preset, setPreset] = useState("custom")
  const [role, setRole] = useState(initial?.role ?? "")
  const [permissions, setPermissions] = useState<CoursePermission[]>(initial?.permissions ?? [])
  const [showOnPage, setShowOnPage] = useState(initial?.show_on_page ?? true)
  const [position, setPosition] = useState(initial?.position ?? nextPosition)

  function choosePreset(key: string) {
    setPreset(key)
    const found = ROLE_PRESETS.find((item) => item.key === key)
    if (found) {
      setRole(t(`presets.${found.key}`))
      setPermissions([...found.permissions])
    }
  }

  function toggle(permission: CoursePermission) {
    setPermissions((current) =>
      current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission],
    )
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    onSubmit({ login: login.trim(), role: role.trim(), permissions, show_on_page: showOnPage, position })
  }

  const valid = role.trim() !== "" && (mode === "edit" || login.trim() !== "")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? t("addTitle") : t("editTitle")}</DialogTitle>
            <DialogDescription>{mode === "add" ? t("addDescription") : t("editDescription")}</DialogDescription>
          </DialogHeader>

          {mode === "add" ? (
            <Field>
              <FieldLabel htmlFor="staff-login">{t("login")}</FieldLabel>
              <Input
                id="staff-login"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder={t("loginPlaceholder")}
                className="h-11 md:h-8"
              />
            </Field>
          ) : null}

          <Field>
            <FieldLabel htmlFor="staff-preset">{t("preset")}</FieldLabel>
            <NativeSelect
              id="staff-preset"
              value={preset}
              onChange={(event) => choosePreset(event.target.value)}
              className="w-full"
            >
              <NativeSelectOption value="custom">{t("presets.custom")}</NativeSelectOption>
              {ROLE_PRESETS.map((item) => (
                <NativeSelectOption key={item.key} value={item.key}>
                  {t(`presets.${item.key}`)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="staff-role">{t("role")}</FieldLabel>
            <Input
              id="staff-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              maxLength={40}
              className="h-11 md:h-8"
            />
            <FieldDescription>{t("roleHint")}</FieldDescription>
          </Field>

          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-sm font-medium">{t("permissions")}</legend>
            {ALL_PERMISSIONS.map((permission) => (
              <label
                key={permission}
                htmlFor={`permission-${permission}`}
                className="flex min-h-11 items-start gap-2 py-1 text-sm md:min-h-8"
              >
                <input
                  id={`permission-${permission}`}
                  type="checkbox"
                  checked={permissions.includes(permission)}
                  onChange={() => toggle(permission)}
                  className="accent-primary mt-0.5 size-5"
                />
                <span>
                  <span className="font-medium">{t(`permissionNames.${permission}`)}</span>
                  <span className="text-muted-foreground block text-xs">{t(`permissionHints.${permission}`)}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex min-h-11 items-center gap-3">
              <Switch id="staff-show" checked={showOnPage} onCheckedChange={setShowOnPage} />
              <label htmlFor="staff-show" className="text-sm">
                {t("showOnPage")}
              </label>
            </div>
            <Field>
              <FieldLabel htmlFor="staff-position">{t("position")}</FieldLabel>
              <Input
                id="staff-position"
                type="number"
                min={0}
                value={position}
                onChange={(event) => setPosition(Number(event.target.value))}
                className="h-11 md:h-8"
              />
            </Field>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(error)}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="min-h-11 md:min-h-8">
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={!valid || pending} className="min-h-11 md:min-h-8">
              {pending ? <Spinner aria-hidden /> : null}
              {mode === "add" ? t("addSubmit") : tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
