"use client"

import type { Role } from "@ihsp/api"
import { hasRole, useSession } from "@ihsp/auth"
import { useMemo } from "react"

export type LibraryAccess = {
  /** `loading` until the silent session restore has finished; pages for visitors render while it runs. */
  status: "loading" | "authenticated" | "anonymous"
  signedIn: boolean
  roles: readonly Role[]
  isStudent: boolean
  isTeacher: boolean
  /** Role `librarian` or `admin` (Administration has every librarian power, § 2.2). */
  isLibrarian: boolean
  isAdmin: boolean
  /** May open `/manage/` (librarian or admin). */
  canManage: boolean
  /** May write reading lists (teacher, librarian, admin; § 2.3). */
  canWriteLists: boolean
  /** Teachers publish at once; students go through the librarian queue (§ 3.5). */
  publishesDirectly: boolean
}

/**
 * Who is looking at the library: the session status and the role flags every screen needs, so no screen reads roles
 * by itself. Calling it starts the silent session restore (refresh cookie); an anonymous visitor is not sent to a login.
 */
export function useLibraryAccess(): LibraryAccess {
  const { status, session } = useSession()
  const roles = session?.user.roles
  return useMemo(() => {
    const list: readonly Role[] = roles ?? []
    const isAdmin = hasRole(list, "admin")
    const isLibrarian = isAdmin || hasRole(list, "librarian")
    const isTeacher = hasRole(list, "teacher")
    return {
      status,
      signedIn: status === "authenticated",
      roles: list,
      isStudent: hasRole(list, "student"),
      isTeacher,
      isLibrarian,
      isAdmin,
      canManage: isLibrarian,
      canWriteLists: isTeacher || isLibrarian,
      publishesDirectly: isTeacher || isAdmin,
    }
  }, [status, roles])
}
