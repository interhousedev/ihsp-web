"use client"

import {
  keys,
  patchAdminRoom,
  postAdminRoomArchive,
  postAdminRoomMerge,
  postAdminRoomRegeneratePin,
  type Room,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@ihsp/ui"
import { useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

export type RoomAction = { kind: "rename" | "pin" | "merge" | "archive"; room: Room }

const INVALIDATE = [keys.admin.rooms()] as const

function RenameDialog({ room, onClose }: { room: Room; onClose: () => void }) {
  const t = useT("rooms.rename")
  const [name, setName] = useState(room.name)
  const rename = useAdminMutation({
    mutationFn: () => patchAdminRoom(room.id, { name: name.trim() }),
    invalidate: INVALIDATE,
    success: t("done"),
    onSuccess: onClose,
  })
  const valid = name.trim() !== "" && name.trim() !== room.name
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (valid) rename.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title", { name: room.name })}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <LabeledField label={t("name")} htmlFor="room-name" required>
            <Input
              id="room-name"
              value={name}
              className={TOUCH}
              maxLength={32}
              onChange={(event) => setName(event.target.value)}
            />
          </LabeledField>
          <DialogFooter>
            <Button type="button" variant="outline" className={TOUCH} onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" className={TOUCH} disabled={!valid || rename.isPending}>
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MergeDialog({ room, rooms, onClose }: { room: Room; rooms: Room[]; onClose: () => void }) {
  const t = useT("rooms.merge")
  const [targetId, setTargetId] = useState("")
  const merge = useAdminMutation({
    mutationFn: () => postAdminRoomMerge(room.id, { into_room_id: targetId }),
    invalidate: INVALIDATE,
    success: t("done"),
    onSuccess: onClose,
  })
  const targets = rooms.filter((item) => item.id !== room.id && item.status === "active")
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (targetId) merge.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title", { name: room.name })}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <LabeledField label={t("target")} htmlFor="room-merge-target" required>
            <SelectField
              id="room-merge-target"
              value={targetId}
              emptyLabel={t("choose")}
              options={targets.map((item) => ({ value: item.id, label: item.name }))}
              onChange={setTargetId}
            />
          </LabeledField>
          <DialogFooter>
            <Button type="button" variant="outline" className={TOUCH} onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="destructive" className={TOUCH} disabled={!targetId || merge.isPending}>
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * The dialog of the chosen room action (UF-ADM-16): rename, regenerate the PIN (asks first: the old PIN and
 * bookmarks stop working), merge into another room, archive.
 */
export function RoomDialogs({
  action,
  rooms,
  onClose,
}: {
  action: RoomAction | null
  rooms: Room[]
  onClose: () => void
}) {
  const tPin = useT("rooms.pin")
  const tArchive = useT("rooms.archive")
  const regenerate = useAdminMutation({
    mutationFn: (room: Room) => postAdminRoomRegeneratePin(room.id),
    invalidate: INVALIDATE,
    success: tPin("done"),
    onSuccess: onClose,
  })
  const archive = useAdminMutation({
    mutationFn: (room: Room) => postAdminRoomArchive(room.id),
    invalidate: INVALIDATE,
    success: tArchive("done"),
    onSuccess: onClose,
  })

  if (!action) return null
  const { room } = action
  if (action.kind === "rename") return <RenameDialog key={room.id} room={room} onClose={onClose} />
  if (action.kind === "merge") return <MergeDialog key={room.id} room={room} rooms={rooms} onClose={onClose} />
  if (action.kind === "pin") {
    return (
      <ConfirmDialog
        open
        onOpenChange={(open) => (open ? undefined : onClose())}
        title={tPin("title", { name: room.name })}
        description={tPin("description")}
        confirmLabel={tPin("confirm")}
        destructive
        loading={regenerate.isPending}
        onConfirm={() => regenerate.mutate(room)}
      />
    )
  }
  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={tArchive("title", { name: room.name })}
      description={tArchive("description", { count: room.lessons_this_week })}
      confirmLabel={tArchive("confirm")}
      destructive
      loading={archive.isPending}
      onConfirm={() => archive.mutate(room)}
    />
  )
}
