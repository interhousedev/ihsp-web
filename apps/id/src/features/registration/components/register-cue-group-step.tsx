"use client"

import { getIdLoginCueGroupsQuery, type LoginCueGroup } from "@ihsp/api"
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ihsp/ui"
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
      <div className="grid gap-2 text-sm font-medium">
        {t("register.cue.group")}
        <Select
          value={groupId || null}
          disabled={groups.isPending || groups.isError}
          items={[
            { value: null, label: t("register.cue.chooseGroup") },
            ...(groups.data ?? []).map((group) => ({ value: group.group_id, label: group.name })),
          ]}
          onValueChange={(next: string | null) => setGroupId(next ?? "")}
        >
          <SelectTrigger aria-label={t("register.cue.group")} className="h-11 w-full text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(groups.data ?? []).map((group) => (
              <SelectItem key={group.group_id} value={group.group_id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
