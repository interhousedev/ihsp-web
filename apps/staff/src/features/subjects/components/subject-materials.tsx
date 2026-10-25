"use client"

import { deleteStaffSubjectMaterial, getStaffSubjectMaterialsQuery, type SubjectMaterial } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"
import { byGroup } from "../utils/groups"
import { MaterialForm } from "./material-form"
import { MaterialList } from "./material-list"

/**
 * The materials of a subject in three tiers: from the administration (read-only), mine (every group I teach the
 * subject to) and per group (only that group, or its subgroup).
 */
export function SubjectMaterials({ subjectId }: { subjectId: string }) {
  const t = useT("subjects.materials")
  const errorMessage = useErrorMessage()
  const client = useQueryClient()
  const query = useQuery(getStaffSubjectMaterialsQuery(subjectId))
  const remove = useMutation({
    mutationFn: (material: SubjectMaterial) => deleteStaffSubjectMaterial(subjectId, material.id),
    onSuccess: () => client.invalidateQueries({ queryKey: ["staff-subjects"] }),
  })
  return (
    <section aria-labelledby="subject-materials" className="flex flex-col gap-4">
      <h2 id="subject-materials" className="text-lg font-semibold">
        {t("heading")}
      </h2>
      <QueryState query={query} rows={3}>
        {(data) => (
          <>
            <section aria-labelledby="tier-admin" className="flex flex-col gap-2">
              <h3 id="tier-admin" className="font-medium">
                {t("tier.admin")}
              </h3>
              <p className="text-muted-foreground text-sm">{t("tier.adminHint")}</p>
              <MaterialList materials={data.admin} label={t("tier.admin")} empty={t("emptyAdmin")} />
            </section>
            <section aria-labelledby="tier-mine" className="flex flex-col gap-2">
              <h3 id="tier-mine" className="font-medium">
                {t("tier.mine")}
              </h3>
              <p className="text-muted-foreground text-sm">{t("tier.mineHint")}</p>
              <MaterialList
                materials={data.mine}
                label={t("tier.mine")}
                empty={t("empty")}
                onRemove={(material) => remove.mutate(material)}
                removing={remove.isPending}
              />
              <MaterialForm subjectId={subjectId} heading={t("add.headingMine")} />
            </section>
            <section aria-labelledby="tier-groups" className="flex flex-col gap-3">
              <h3 id="tier-groups" className="font-medium">
                {t("tier.groups")}
              </h3>
              <p className="text-muted-foreground text-sm">{t("tier.groupsHint")}</p>
              {data.subject.groups.map((group) => {
                const label =
                  group.subgroup === null
                    ? group.group_name
                    : t("groupHalf", { group: group.group_name, number: group.subgroup })
                return (
                  <div
                    key={`${group.group_id}:${group.subgroup ?? ""}`}
                    aria-label={label}
                    role="group"
                    className="flex flex-col gap-2"
                  >
                    <h4 className="text-sm font-medium">{label}</h4>
                    <MaterialList
                      materials={data.groups.filter(
                        (material) => material.group_id === group.group_id && material.subgroup === group.subgroup,
                      )}
                      label={label}
                      empty={t("empty")}
                      onRemove={(material) => remove.mutate(material)}
                      removing={remove.isPending}
                    />
                    <MaterialForm
                      subjectId={subjectId}
                      group={{ group_id: group.group_id, subgroup: group.subgroup }}
                      heading={t("add.headingGroup", { group: label })}
                    />
                  </div>
                )
              })}
              {byGroup(data.subject.groups).length === 0 ? <p className="text-sm">{t("emptyGroups")}</p> : null}
            </section>
          </>
        )}
      </QueryState>
      {remove.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(remove.error)}
        </p>
      ) : null}
    </section>
  )
}
