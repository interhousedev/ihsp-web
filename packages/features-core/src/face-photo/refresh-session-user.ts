"use client"

import { getMe, keys, type UserMe } from "@ihsp/api"
import { useAuthStore } from "@ihsp/auth"
import type { QueryClient } from "@tanstack/react-query"

/**
 * Reloads `GET /v1/id/me` into the session and the query cache after the face (and with it the profile photo) changed,
 * so every avatar shows the new photo at once. The student card is refetched too (its `has_photo` changed). The upload
 * has already succeeded, so a failed reload is not reported: the next page load shows the photo.
 */
export async function refreshSessionUser(queryClient: QueryClient): Promise<void> {
  const studentCard = queryClient.invalidateQueries({ queryKey: keys.me.studentCard() })
  try {
    const user = await getMe()
    useAuthStore.getState().setUser(user)
    queryClient.setQueryData<UserMe>(keys.id.me(), user)
  } catch {
    // keep the current session user
  }
  await studentCard
}
