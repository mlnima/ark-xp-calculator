import { buffs } from "../data/buffs.ts";
import { qualities } from "../data/qualities.ts";
import { clockModes, craftingStations } from "../data/crafting.ts";
import { partyLimits } from "../data/party.ts";
import levels from "../data/levels.json" with { type: "json" };
import { resourcesForItem } from "./blueprint.ts";
import { hydrateInput } from "./input-state.ts";
import type { CalculatorInput, CraftingItem } from "../types/calculator.ts";

export const objectValue = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
};

export const requireValue = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const numberText = (value: unknown) => typeof value === "string" && (!value.trim() || Number.isFinite(Number(value)));
const levelValues = new Set(["", ...levels.map(({ level }) => String(level))]);

export const validateInput = (stored: unknown, items: CraftingItem[]): CalculatorInput => {
  const value = objectValue(stored, "Calculation");
  const itemValue = value.item === null ? null : objectValue(value.item, "Crafting item");
  const item = items.find(({ name }) => name === itemValue?.name) || null;
  requireValue(value.item === null || item, "This file contains an unknown crafting item.");
  requireValue(value.qualityId === "" || qualities.some(({ id }) => id === value.qualityId), "Invalid blueprint quality.");
  requireValue(craftingStations.some(({ id }) => id === value.stationId) && value.craftTimeBasis === "station", "Invalid crafting station or time basis.");
  requireValue(value.clockMode === "" || clockModes.some(({ id }) => id === value.clockMode), "Invalid clock mode.");
  for (const field of ["clockEnabled", "grinding", "recycler", "splitResources"]) {
    requireValue(typeof value[field] === "boolean", `Invalid ${field} setting.`);
  }
  for (const field of ["craftSeconds", "serverRate", "tribeTowerBonus"]) {
    requireValue(numberText(value[field]), `Invalid ${field} value.`);
  }
  requireValue(Number.isInteger(value.playerCount) && Number(value.playerCount) >= 1 && Number(value.playerCount) <= partyLimits.players, "Invalid party size.");
  requireValue(Number.isInteger(value.stationCount) && Number(value.stationCount) >= 1 && Number(value.stationCount) <= partyLimits.stations, "Invalid station count.");
  const players = value.players;
  requireValue(Array.isArray(players) && players.length >= Number(value.playerCount) && players.length <= partyLimits.players, "Player rows do not match the party size.");
  for (const entry of players as unknown[]) {
    const player = objectValue(entry, "Player");
    requireValue(typeof player.name === "string", "Invalid player name.");
    requireValue(typeof player.currentLevel === "string" && levelValues.has(player.currentLevel), "Invalid current player level.");
    requireValue(typeof player.targetLevel === "string" && levelValues.has(player.targetLevel), "Invalid target player level.");
  }
  requireValue(Array.isArray(value.buffIds) && value.buffIds.every((id) => buffs.some((buff) => buff.id === id))
    && new Set(value.buffIds as unknown[]).size === (value.buffIds as unknown[]).length, "Invalid experience boosts.");
  const expected = resourcesForItem(item);
  requireValue(Array.isArray(value.resources) && value.resources.length === expected.length, "Resource fields do not match the crafting item.");
  (value.resources as unknown[]).forEach((entry, index) => {
    const resource = objectValue(entry, "Resource");
    requireValue(resource.name === expected[index].name && numberText(resource.quantity), "Invalid blueprint resource.");
  });
  requireValue(!value.recycler || value.grinding, "Recycler requires grinding to be enabled.");
  return hydrateInput(value, items);
};
