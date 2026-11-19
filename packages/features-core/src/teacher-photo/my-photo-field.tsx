"use client"

import { deleteMePhoto, putMePhoto } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useQueryClient } from "@tanstack/react-query"
import { refreshSessionUser } from "../face-photo/refresh-session-user"
import { PhotoField } from "./photo-field"

/**
 * The caller's own profile photo, for every role (`PUT`/`DELETE /v1/me/photo`). After a change the session user is
 * reloaded, so the header and every avatar show the new photo (or the initials after a removal) at once.
 */
export function MyPhotoField({ name, removeDescription }: { name: string; removeDescription?: string }) {
  const { session } = useSession()
  const queryClient = useQueryClient()
  if (!session) return null
  return (
    <PhotoField
      name={name}
      removeDescription={removeDescription}
      photoUrl={session.user.photo_url}
      onUpload={async (file) => {
        await putMePhoto(file)
        await refreshSessionUser(queryClient)
      }}
      onRemove={async () => {
        await deleteMePhoto()
        await refreshSessionUser(queryClient)
      }}
    />
  )
}
