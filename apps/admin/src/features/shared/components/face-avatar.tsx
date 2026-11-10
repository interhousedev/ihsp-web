"use client"

import { ApiError, getAdminUserFacePhotoQuery } from "@ihsp/api"
import { UserAvatar } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

/** Thumbnail of a user's face photo for list rows: fetched once the row scrolls into view, initials when there is none. */
export function FaceAvatar({ userId, name }: { userId: string; name: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true)
        observer.disconnect()
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const photo = useQuery({
    ...getAdminUserFacePhotoQuery(userId),
    enabled: visible,
    staleTime: 4 * 60_000,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 1,
  })

  return (
    <span ref={ref} className="inline-flex">
      <UserAvatar name={name} imageUrl={photo.data?.photo_url ?? null} />
    </span>
  )
}
