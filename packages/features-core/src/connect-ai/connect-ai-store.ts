"use client"

import { useSyncExternalStore } from "react"

type State = { open: boolean; hosts: number }

let state: State = { open: false, hosts: 0 }
const listeners = new Set<() => void>()

function set(next: Partial<State>) {
  state = { ...state, ...next }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Opens the "connect my AI" dialog of the mounted `ConnectAiDialogHost`. */
export function openConnectAi(): void {
  set({ open: true })
}

export function closeConnectAi(): void {
  set({ open: false })
}

/** Called by the host while it is mounted, so links know they can open the dialog instead of leaving the page. */
export function registerConnectAiHost(): () => void {
  set({ hosts: state.hosts + 1 })
  return () => set({ hosts: state.hosts - 1, open: state.hosts - 1 > 0 ? state.open : false })
}

export function useConnectAiState(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  )
}
