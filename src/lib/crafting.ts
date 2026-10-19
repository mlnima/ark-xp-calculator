import { buffs } from "../data/buffs.ts";
import { craftingRecipes, craftingStations } from "../data/crafting.ts";
import type { CalculatorInput } from "../types/calculator.ts";
import type { CraftingTiming } from "../types/crafting.ts";

export const recipeForInput = (input: CalculatorInput) => craftingRecipes[input.item?.name || ""];

export const stationsForInput = (input: CalculatorInput) => {
  const stations = recipeForInput(input)?.stations || [];
  return craftingStations.filter(({ id, label }) => stations.includes(label)
    || (id === "replicator" && (stations.includes("Smithy") || stations.includes("Fabricator"))));
};

export const baseCraftSeconds = (input: CalculatorInput) => {
  const seconds = input.craftSeconds.trim() ? Number(input.craftSeconds) : recipeForInput(input)?.baseSeconds;
  return seconds && Number.isFinite(seconds) && seconds > 0 ? seconds : null;
};

export const getTimingIssues = (input: CalculatorInput) => {
  const available = stationsForInput(input);
  if (!available.length) return ["Timing is unavailable: this item's wiki recipe does not list a Smithy or Tek Replicator."];
  const issues: string[] = [];
  if (!input.stationId) issues.push("Choose a crafting station for time and consumable totals.");
  if (input.stationId && !available.some(({ id }) => id === input.stationId)) {
    issues.push("The selected station cannot craft this item.");
  }
  if (!baseCraftSeconds(input)) issues.push("Enter the blueprint's base craft time in seconds.");
  return issues;
};

export const calculateTiming = (input: CalculatorInput, craftsPerPlayer: number): CraftingTiming | null => {
  if (getTimingIssues(input).length) return null;
  const seconds = baseCraftSeconds(input)!;
  const stations = stationsForInput(input).map(({ id, label, speed }) => ({
    id, label, secondsPerCraft: seconds / speed, partySeconds: craftsPerPlayer * seconds / speed,
  }));
  const selected = stations.find(({ id }) => id === input.stationId)!;
  if (!Number.isFinite(selected.partySeconds) || selected.partySeconds <= 0) return null;
  const consumables = buffs.filter(({ id, durationSeconds }) => input.buffIds.includes(id) && durationSeconds)
    .map(({ id, label, durationSeconds }) => {
      const perPlayer = Math.ceil(selected.partySeconds / durationSeconds!);
      return { id, label, durationSeconds: durationSeconds!, perPlayer, total: perPlayer * input.playerCount };
    });
  return { secondsPerCraft: selected.secondsPerCraft, partySeconds: selected.partySeconds, stations, consumables };
};
