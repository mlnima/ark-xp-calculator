import { buffs } from "../data/buffs.ts";
import { qualities } from "../data/qualities.ts";
import { clockModes, craftingStations } from "../data/crafting.ts";
import { partyLimits } from "../data/party.ts";
import {
  clockSpeed,
  defaultCraftSeconds,
  fillPrimitiveResources,
  resourcesForItem,
  stationSpeed,
} from "./blueprint.ts";
import { restorePartyCounts } from "./party.ts";
import { newPlayer } from "./players.ts";
import { calculatorDefaults } from "../data/calculator-defaults.ts";
import itemsData from "../data/items.json" with { type: "json" };
import type {
  BuffId,
  CalculatorInput,
  CraftingItem,
  ResourceInput,
  SavedCalculation,
  PartyPlayer,
} from "../types/calculator.ts";

export const storageKeys = {
  draft: "ark-crafting-xp:draft:v2",
  saved: "ark-crafting-xp:saved:v2",
  metadata: "ark-crafting-xp:metadata:v1",
};

export const defaultInput = (items: CraftingItem[] = itemsData): CalculatorInput => {
  const { itemName, playerLevels, ...settings } = calculatorDefaults;
  const item = items.find(({ name }) => name === itemName) || null;
  const seconds = defaultCraftSeconds(item, settings.stationId);
  const input: CalculatorInput = {
    ...settings,
    item,
    buffIds: [...settings.buffIds],
    craftSeconds: seconds ? String(Number(seconds) / clockSpeed(settings)) : "",
    players: [newPlayer(0, playerLevels)],
    resources: resourcesForItem(item),
  };
  return { ...input, resources: fillPrimitiveResources(input) };
};

const stringValue = (value: unknown) => (typeof value === "string" ? value : "");

const restorePlayers = (value: Record<string, unknown>, count: number): PartyPlayer[] => {
  const stored = Array.isArray(value.players) ? value.players.slice(0, partyLimits.players) : [];
  const first = stored[0] || {
    currentLevel: stringValue(value.currentLevel),
    targetLevel: stringValue(value.targetLevel),
  };
  const players: PartyPlayer[] = [];
  for (let index = 0; index < Math.max(count, stored.length); index += 1) {
    const player = stored[index];
    const inherited = newPlayer(index, players[index - 1] || first);
    players.push(
      player && typeof player === "object"
        ? {
            name: typeof player.name === "string" ? player.name : inherited.name,
            currentLevel: stringValue(player.currentLevel).trim() || inherited.currentLevel,
            targetLevel: stringValue(player.targetLevel).trim() || inherited.targetLevel,
          }
        : inherited,
    );
  }
  return players;
};

export const hydrateInput = (stored: unknown, items: CraftingItem[]): CalculatorInput => {
  const value = (stored && typeof stored === "object" ? stored : {}) as Partial<CalculatorInput> &
    Record<string, unknown>;
  const defaults = defaultInput(items);
  const item = items.find(({ name }) => name === value.item?.name) || defaults.item;
  const previous = Array.isArray(value.resources)
    ? value.resources.filter((resource): resource is ResourceInput =>
        Boolean(
          resource && typeof resource.name === "string" && typeof resource.quantity === "string",
        ),
      )
    : [];
  const { playerCount, stationCount } = restorePartyCounts(value);
  const clockEnabled =
    typeof value.clockEnabled === "boolean" ? value.clockEnabled : defaults.clockEnabled;
  const clockMode = clockModes.find(({ id }) => id === value.clockMode)?.id || defaults.clockMode;
  const stationId =
    craftingStations.find(({ id }) => id === value.stationId)?.id || defaults.stationId;
  const defaultSeconds = defaultCraftSeconds(item, stationId);
  const storedSeconds = stringValue(value.craftSeconds);
  const craftSeconds =
    typeof value.craftSeconds !== "string"
      ? defaultSeconds
        ? String(Number(defaultSeconds) / clockSpeed({ clockEnabled, clockMode }))
        : ""
      : value.craftTimeBasis === "station" || !storedSeconds
        ? storedSeconds
        : String(Number(storedSeconds) / stationSpeed(stationId));
  const input: CalculatorInput = {
    item,
    stationId,
    craftSeconds,
    craftTimeBasis: "station",
    clockEnabled,
    clockMode,
    qualityId: qualities.find(({ id }) => id === value.qualityId)?.id || defaults.qualityId,
    serverRate: stringValue(value.serverRate).trim() || defaults.serverRate,
    playerCount,
    stationCount,
    players: restorePlayers(value, playerCount),
    buffIds: Array.isArray(value.buffIds)
      ? value.buffIds.filter((id): id is BuffId => buffs.some((buff) => buff.id === id))
      : defaults.buffIds,
    tribeTowerBonus: stringValue(value.tribeTowerBonus).trim() || defaults.tribeTowerBonus,
    grinding: value.grinding === true,
    recycler: value.grinding === true && value.recycler === true,
    splitResources:
      typeof value.splitResources === "boolean" ? value.splitResources : defaults.splitResources,
    resources: resourcesForItem(item, previous),
  };
  return previous.length ? input : { ...input, resources: fillPrimitiveResources(input) };
};

export const readStored = <T>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
};

export const loadSaved = (items: CraftingItem[]): SavedCalculation[] => {
  const stored = readStored<unknown>(storageKeys.saved, []);
  return Array.isArray(stored)
    ? stored
        .filter(
          (entry) =>
            entry && typeof entry.id === "string" && typeof entry.name === "string" && entry.input,
        )
        .map((entry) => ({
          id: entry.id,
          name: entry.name,
          input: hydrateInput(entry.input, items),
        }))
    : [];
};
