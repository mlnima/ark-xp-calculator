import { buffs } from "../data/buffs.ts";
import { qualities } from "../data/qualities.ts";
import { clockModes, craftingStations } from "../data/crafting.ts";
import { partyLimits } from "../data/party.ts";
import { clockSpeed, defaultCraftSeconds, resourcesForItem, stationSpeed } from "./blueprint.ts";
import { restorePartyCounts } from "./party.ts";
import { newPlayer } from "./players.ts";
import type { BuffId, CalculatorInput, CraftingItem, ResourceInput, SavedCalculation, PartyPlayer } from "../types/calculator.ts";

export const storageKeys = {
  draft: "ark-crafting-xp:draft:v2", saved: "ark-crafting-xp:saved:v2", metadata: "ark-crafting-xp:metadata:v1",
};

export const emptyInput = (): CalculatorInput => ({
  item: null, qualityId: "", stationId: "smithy", craftSeconds: "", craftTimeBasis: "station",
  clockEnabled: false, clockMode: "", serverRate: "", players: [newPlayer(0)], playerCount: 1,
  stationCount: 1, buffIds: [], tribeTowerBonus: "", grinding: false, recycler: false,
  splitResources: false, resources: [],
});

const stringValue = (value: unknown) => typeof value === "string" ? value : "";

const restorePlayers = (value: Record<string, unknown>, count: number): PartyPlayer[] => {
  const stored = Array.isArray(value.players) ? value.players.slice(0, partyLimits.players) : [];
  const first = stored[0] || { currentLevel: stringValue(value.currentLevel), targetLevel: stringValue(value.targetLevel) };
  return Array.from({ length: Math.max(count, stored.length) }, (_, index) => {
    const player = stored[index];
    return player && typeof player === "object" ? {
      name: typeof player.name === "string" ? player.name : newPlayer(index).name,
      currentLevel: stringValue(player.currentLevel), targetLevel: stringValue(player.targetLevel),
    } : newPlayer(index, first);
  });
};

export const hydrateInput = (stored: unknown, items: CraftingItem[]): CalculatorInput => {
  const value = (stored && typeof stored === "object" ? stored : {}) as Partial<CalculatorInput> & Record<string, unknown>;
  const item = items.find(({ name }) => name === value.item?.name) || null;
  const previous = Array.isArray(value.resources) ? value.resources.filter((resource): resource is ResourceInput =>
    Boolean(resource && typeof resource.name === "string" && typeof resource.quantity === "string")) : [];
  const { playerCount, stationCount } = restorePartyCounts(value);
  const clockEnabled = value.clockEnabled === true;
  const clockMode = clockModes.find(({ id }) => id === value.clockMode)?.id || "";
  const stationId = craftingStations.find(({ id }) => id === value.stationId)?.id || "smithy";
  const defaultSeconds = defaultCraftSeconds(item, stationId);
  const storedSeconds = stringValue(value.craftSeconds);
  const craftSeconds = typeof value.craftSeconds !== "string"
    ? defaultSeconds ? String(Number(defaultSeconds) / clockSpeed({ clockEnabled, clockMode })) : ""
    : value.craftTimeBasis === "station" || !storedSeconds ? storedSeconds : String(Number(storedSeconds) / stationSpeed(stationId));
  return {
    item, stationId, craftSeconds, craftTimeBasis: "station", clockEnabled, clockMode,
    qualityId: qualities.find(({ id }) => id === value.qualityId)?.id || "",
    serverRate: stringValue(value.serverRate), playerCount, stationCount,
    players: restorePlayers(value, playerCount),
    buffIds: Array.isArray(value.buffIds) ? value.buffIds.filter((id): id is BuffId => buffs.some((buff) => buff.id === id)) : [],
    tribeTowerBonus: stringValue(value.tribeTowerBonus), grinding: value.grinding === true,
    recycler: value.grinding === true && value.recycler === true, splitResources: value.splitResources === true,
    resources: resourcesForItem(item, previous),
  };
};

export const readStored = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
};

export const loadSaved = (items: CraftingItem[]): SavedCalculation[] => {
  const stored = readStored<unknown>(storageKeys.saved, []);
  return Array.isArray(stored) ? stored.filter((entry) =>
    entry && typeof entry.id === "string" && typeof entry.name === "string" && entry.input
  ).map((entry) => ({ id: entry.id, name: entry.name, input: hydrateInput(entry.input, items) })) : [];
};
