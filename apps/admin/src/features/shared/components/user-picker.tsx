"use client"

import { getAdminUsersQuery, type AdminUser } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Input } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

const DEBOUNCE_MS = 300

function nameOf(user: AdminUser): string {
  return [user.last_name, user.first_name, user.middle_name].filter(Boolean).join(" ")
}

/** Finds a user by name, login or e-mail (debounced); the parent only ever sees the chosen user id. */
export function UserPicker({
  id,
  value,
  onChange,
  className,
}: {
  id: string
  value: string | null
  onChange: (userId: string | null) => void
  className?: string
}) {
  const t = useT("userPicker")
  const [text, setText] = useState("")
  const [term, setTerm] = useState("")
  const [chosen, setChosen] = useState<AdminUser | null>(null)
  useEffect(() => {
    const timer = setTimeout(() => setTerm(text.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text])
  const found = useQuery({ ...getAdminUsersQuery({ query: term, limit: 8 }), enabled: term.length >= 2 && !value })

  if (value) {
    return (
      <div className="flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm">
        <span className="min-w-0 flex-1 truncate">{chosen ? nameOf(chosen) : t("selected")}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setChosen(null)
            setText("")
            onChange(null)
          }}
        >
          {t("clear")}
        </Button>
      </div>
    )
  }
  const items = found.data?.items ?? []
  return (
    <div className={`relative ${className ?? ""}`}>
      <Input
        id={id}
        value={text}
        autoComplete="off"
        placeholder={t("placeholder")}
        onChange={(event) => setText(event.target.value)}
        className="h-11 md:h-8"
      />
      {term.length >= 2 ? (
        <ul className="bg-popover absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border shadow-md">
          {items.length === 0 && !found.isPending ? (
            <li className="text-muted-foreground px-3 py-2 text-sm">{t("none")}</li>
          ) : null}
          {items.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                className="hover:bg-accent flex min-h-11 w-full flex-col items-start px-3 py-1 text-left text-sm"
                onClick={() => {
                  setChosen(user)
                  onChange(user.id)
                }}
              >
                <span>{nameOf(user)}</span>
                <span className="text-muted-foreground text-xs">{user.login ?? user.recovery_email ?? ""}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
