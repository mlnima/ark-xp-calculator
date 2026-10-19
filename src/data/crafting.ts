import snapshot from "./crafting.json" with { type: "json" };
import type { ClockMode, CraftingRecipe, StationId } from "../types/crafting.ts";

export const craftingRecipes = snapshot.recipes as Record<string, CraftingRecipe>;
export const craftingCheckedAt = snapshot.checkedAt;

export const craftingStations: { id: StationId; label: string; speed: number }[] = [
  { id: "smithy", label: "Smithy", speed: 1 },
  { id: "replicator", label: "Tek Replicator", speed: 12 },
];

export const clockModes: { id: ClockMode; label: string; bonusPercent: number }[] = [
  { id: "area", label: "All nearby structures", bonusPercent: 100 },
  { id: "targeted", label: "Target selected station type", bonusPercent: 300 },
];
