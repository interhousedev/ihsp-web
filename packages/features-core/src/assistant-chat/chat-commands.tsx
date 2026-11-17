"use client"

import { createContext, useContext } from "react"

type ChatCommands = {
  /** Sends `text` as the user's next message; false when a turn is already running. */
  say: (text: string) => Promise<boolean>
}

const ChatCommandsContext = createContext<ChatCommands | null>(null)

export const ChatCommandsProvider = ChatCommandsContext.Provider

/** Lets rich message parts (suggestion cards) speak in the chat; null outside a pane. */
export function useChatCommands(): ChatCommands | null {
  return useContext(ChatCommandsContext)
}
