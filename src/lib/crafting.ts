import { buffs } from "../data/buffs.ts";
import { craftingRecipes, craftingStations } from "../data/crafting.ts";
import { stationSpeed } from "./blueprint.ts";
import type { CalculatorInput } from "../types/calculator.ts";
import type { CraftingTiming } from "../types/crafting.ts";

export const recipeForInput = (input: CalculatorInput) => craftingRecipes[input.item?.name || ""];

export const stationsForInput = (input: CalculatorInput) => {
  const stations = recipeForInput(input)?.stations.map((name) => name.toLowerCase()) || [];
  return craftingStations.filter(({ id, label }) => stations.includes(label.toLowerCase())
    || (id === "replicator" && (stations.includes("smithy") || stations.includes("fabricator"))));
};

export const baseCraftSeconds = (input: CalculatorInput) => {
  const seconds = Number(input.craftSeconds);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * stationSpeed(input.stationId) : null;
};

export const getTimingIssues = (input: CalculatorInput) => {
  const available = stationsForInput(input);
  if (!available.length) return ["Timing is unavailable: this item's wiki recipe does not list a Smithy or Tek Replicator."];
  const issues: string[] = [];
  if (input.clockEnabled && !input.clockMode) issues.push("Select the active Clockface boost mode.");
  if (!available.some(({ id }) => id === input.stationId)) {
    issues.push("The selected station cannot craft this item. Choose a compatible station to calculate time and supplies.");
  }
  if (!baseCraftSeconds(input)) issues.push("Enter a craft time above zero in seconds.");
  return issues;
};

export const calculateTiming = (input: CalculatorInput, craftsPerStation: number): CraftingTiming | null => {
  if (getTimingIssues(input).length) return null;
  const seconds = baseCraftSeconds(input)!;
  const stations = stationsForInput(input).map(({ id, label, speed }) => {
    const secondsPerCraft = id === input.stationId ? Number(input.craftSeconds) : seconds / speed;
    return { id, label, secondsPerCraft, partySeconds: craftsPerStation * secondsPerCraft };
  });
  const selected = stations.find(({ id }) => id === input.stationId)!;
  if (!Number.isFinite(selected.partySeconds) || selected.partySeconds <= 0) return null;
  const consumables = buffs.filter(({ id, durationSeconds }) => input.buffIds.includes(id) && durationSeconds)
    .map(({ id, label, durationSeconds }) => {
      const doses = selected.partySeconds / durationSeconds!;
      const perPlayer = Math.max(1, Math.ceil(doses - Number.EPSILON * Math.max(1, doses) * 4));
      return { id, label, durationSeconds: durationSeconds!, perPlayer, total: perPlayer * input.playerCount };
    });
  return { secondsPerCraft: selected.secondsPerCraft, partySeconds: selected.partySeconds, stations, consumables };
};
