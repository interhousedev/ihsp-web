import type { ItemCard } from "@ihsp/api"

export const isExternalCard = (card: Pick<ItemCard, "kind">): boolean => card.kind === "external"

/** What the item page is addressed by: the id, or the slug when the card has no id yet. `null` for an unstored record. */
export function cardRouteId(card: Pick<ItemCard, "id" | "slug">): string | null {
  return card.id ?? card.slug ?? null
}

/** The card as the shelf and report components need it, for a card or a detail. */
export type ShelfSubject = Pick<ItemCard, "id" | "kind" | "shelf_state"> & { external?: ItemCard["external"] }

/** A stable list key: unstored UniLibrary records have no id, so the external id stands in. */
export function cardKey(card: ItemCard): string {
  return card.id ?? `${card.kind}:${card.external?.external_id ?? card.slug ?? card.title}`
}
