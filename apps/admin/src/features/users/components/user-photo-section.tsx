"use client"

import { deleteAdminUserPhoto, keys, putAdminUserPhoto, type AdminUserDetail, type TeacherProfile } from "@ihsp/api"
import { PhotoField } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { useQueryClient } from "@tanstack/react-query"

/**
 * The profile photo of a teacher or staff member, shown to their students. The saved link goes into the cached user
 * (detail and teacher profile) so the page shows it at once; the lists are not refetched.
 */
export function UserPhotoSection({
  userId,
  name,
  photoUrl,
}: {
  userId: string
  name: string
  photoUrl: string | null
}) {
  const t = useT("teacherPhoto")
  const queryClient = useQueryClient()

  function remember(url: string | null) {
    queryClient.setQueryData<AdminUserDetail>(keys.admin.users.detail(userId), (user) =>
      user ? { ...user, photo_url: url } : user,
    )
    queryClient.setQueryData<TeacherProfile>(keys.admin.teachers.profile(userId), (profile) =>
      profile ? { ...profile, user: { ...profile.user, photo_url: url } } : profile,
    )
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{t("label")}</h2>
      <PhotoField
        name={name}
        photoUrl={photoUrl}
        onUpload={async (file) => remember((await putAdminUserPhoto(userId, file)).photo_url)}
        onRemove={async () => remember((await deleteAdminUserPhoto(userId)).photo_url)}
      />
    </section>
  )
}
