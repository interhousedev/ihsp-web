"use client"

import { getIdLoginCueGroupsQuery, type LoginCueGroup } from "@ihsp/api"
import { Button } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { ErrorAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { useTr } from "../../shared/hooks/use-tr"

type RegisterCueGroupStepProps = {
  onPicked: (group: LoginCueGroup) => void
  onBack: () => void
}

/** "Pick your name", step 1 of 2: the group the registrant belongs to. */
export function RegisterCueGroupStep({ onPicked, onBack }: RegisterCueGroupStepProps) {
  const t = useTr()
  const groups = useQuery(getIdLoginCueGroupsQuery())
  const [groupId, setGroupId] = useState("")
  const selected = groups.data?.find((group) => group.group_id === groupId)

  return (
    <FlowCard title={t("register.cue.title")}>
      <label className="grid gap-2 text-sm font-medium">
        {t("register.cue.group")}
        <select
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-base"
          value={groupId}
          disabled={groups.isPending || groups.isError}
          onChange={(event) => setGroupId(event.target.value)}
        >
          <option value="">{t("register.cue.chooseGroup")}</option>
          {(groups.data ?? []).map((group) => (
            <option key={group.group_id} value={group.group_id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
      <ErrorAlert error={groups.error} />
      <Button
        type="button"
        className="h-11 text-base"
        disabled={!selected}
        onClick={() => selected && onPicked(selected)}
      >
        {t("register.cue.continue")}
      </Button>
      <Button type="button" variant="outline" className="h-11 text-base" onClick={onBack}>
        {t("register.cue.back")}
      </Button>
    </FlowCard>
  )
}
