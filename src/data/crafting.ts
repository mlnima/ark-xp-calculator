import snapshot from "./crafting.json" with { type: "json" };
import type { CraftingRecipe, StationId } from "../types/crafting.ts";

export const craftingRecipes = snapshot.recipes as Record<string, CraftingRecipe>;
export const craftingCheckedAt = snapshot.checkedAt;

export const craftingStations: { id: StationId; label: string; speed: number }[] = [
  { id: "smithy", label: "Smithy", speed: 1 },
  { id: "replicator", label: "Tek Replicator", speed: 12 },
];
