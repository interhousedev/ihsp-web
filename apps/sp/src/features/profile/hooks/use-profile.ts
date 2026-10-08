"use client"

import { getIdMeQuery, getMeProfileQuery, getMeStorageQuery } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useQuery } from "@tanstack/react-query"

export function useProfile() {
  return useQuery(getMeProfileQuery())
}

/** The account (Telegram accounts, EMIS status); the session's copy is shown while the fresh one loads. */
export function useAccount() {
  const { session } = useSession()
  return useQuery({ ...getIdMeQuery(), placeholderData: session?.user })
}

export function useStorage() {
  return useQuery(getMeStorageQuery())
}
