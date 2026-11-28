"use client"

import { useT } from "@ihsp/i18n"
import { Button, Input, ResponsiveDialog, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { UserPicker } from "../../shared/components/user-picker"
import { useCreateClub } from "../clubs-api"

const SLUG_MAX = 60

function slugOf(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
}

/** Admin creates a club that is approved at once and owned by the chosen user. */
export function CreateClubDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (name: string) => void
}) {
  const t = useT("activities")
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState("")
  const [owner, setOwner] = useState<string | null>(null)

  const close = () => {
    setName("")
    setSlug("")
    setSlugTouched(false)
    setDescription("")
    setOwner(null)
    onClose()
  }
  const create = useCreateClub((club) => {
    onCreated(club.name)
    close()
  })
  const valid = name.trim() !== "" && slug !== "" && owner !== null

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => !o && close()}
      title={t("clubs.createTitle")}
      description={t("clubs.createBody")}
      footer={
        <>
          <Button type="button" variant="outline" onClick={close}>
            {t("form.back")}
          </Button>
          <Button
            type="button"
            disabled={!valid || create.isPending}
            onClick={() =>
              owner && create.mutate({ name: name.trim(), slug, description: description.trim(), ownerUserId: owner })
            }
          >
            {t("clubs.createSubmit")}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="club-name" className="text-sm font-medium">
            {t("clubs.createName")} <span className="text-destructive">*</span>
          </label>
          <Input
            id="club-name"
            value={name}
            maxLength={120}
            onChange={(e) => {
              setName(e.target.value)
              if (!slugTouched) setSlug(slugOf(e.target.value))
            }}
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="club-slug" className="text-sm font-medium">
            {t("clubs.createSlug")} <span className="text-destructive">*</span>
          </label>
          <Input
            id="club-slug"
            value={slug}
            maxLength={SLUG_MAX}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(slugOf(e.target.value))
            }}
          />
          <p className="text-muted-foreground text-xs">{t("clubs.createSlugHint")}</p>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="club-description" className="text-sm font-medium">
            {t("clubs.createDescription")}
          </label>
          <Textarea
            id="club-description"
            rows={3}
            maxLength={4000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="club-owner" className="text-sm font-medium">
            {t("clubs.createOwner")} <span className="text-destructive">*</span>
          </label>
          <UserPicker id="club-owner" value={owner} onChange={setOwner} />
        </div>
      </div>
    </ResponsiveDialog>
  )
}
