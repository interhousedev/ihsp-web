"use client"

import { useEffect, useState } from "react"
import { publicClubsApi } from "./public-clubs-api"

type State<T> = { data: T | null; loading: boolean; failed: boolean }

function useLoad<T>(load: (() => Promise<T>) | null, key: string): State<T> {
  const [state, setState] = useState<State<T>>({ data: null, loading: load !== null, failed: false })
  useEffect(() => {
    if (!load) return
    let live = true
    setState({ data: null, loading: true, failed: false })
    load().then(
      (data) => live && setState({ data, loading: false, failed: false }),
      () => live && setState({ data: null, loading: false, failed: true }),
    )
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return state
}

export function usePublicClubList() {
  return useLoad(() => publicClubsApi.list(), "list")
}

export function usePublicClubPage(slug: string | null) {
  return useLoad(slug ? () => publicClubsApi.get(slug) : null, slug ?? "")
}
