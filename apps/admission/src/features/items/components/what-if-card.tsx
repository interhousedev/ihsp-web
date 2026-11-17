"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { postAiChatMessages, postAiChats } from "@ihsp/api"
import { Button, Icons, Label, Textarea } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"
import { AiTabCard } from "../../../components/ai-tab-card"

/** The assistant reads the application itself; the prefix fixes the task and the tone of the verdict. */
const PREFIX =
  "Activity what-if. Evaluate how the change below would affect my activities list for college applications. " +
  "Keep the texture of my profile: a small club I love and have invested in is valuable even without numbers or " +
  "awards, so never dismiss it for lacking metrics; weigh depth, commitment, leadership and growth. " +
  "Be concrete and short: verdict, what improves, what is at risk, one next step.\n\nChange: "

/** A free-text "what if I add or drop this activity" evaluator. */
export function WhatIfCard() {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const send = useMutation({
    mutationFn: async (message: string) => {
      const chat = await postAiChats({ assistant: "admission" })
      const turn = await postAiChatMessages(chat.id, { text: message, file_ids: [] })
      return turn.new_messages.filter((m) => m.role === "assistant").at(-1)?.text ?? ""
    },
  })
  const [text, setText] = useState("")
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const change = text.trim()
    if (change) send.mutate(PREFIX + change)
  }
  return (
    <AiTabCard label={t("whatIf.label")} icon={<Icons.sparkles aria-hidden />}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Label htmlFor="what-if">{t("whatIf.title")}</Label>
        <Textarea
          id="what-if"
          rows={3}
          maxLength={1000}
          value={text}
          placeholder={t("whatIf.placeholder")}
          onChange={(e) => setText(e.target.value)}
        />
        <div>
          <Button type="submit" size="sm" disabled={text.trim() === "" || send.isPending}>
            {send.isPending ? t("whatIf.running") : t("whatIf.submit")}
          </Button>
        </div>
      </form>
      {send.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(send.error)}
        </p>
      ) : null}
      {send.data ? <p className="text-sm whitespace-pre-wrap">{send.data}</p> : null}
    </AiTabCard>
  )
}
