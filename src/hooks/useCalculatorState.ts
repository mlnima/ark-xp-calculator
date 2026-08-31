import { useEffect, useState } from "react";
import { buffs } from "../data/buffs";
import { qualities } from "../data/qualities";
import type {
  BuffId,
  CalculatorInput,
  CraftingItem,
  ResourceInput,
  SavedCalculation,
} from "../types/calculator";

const draftKey = "ark-crafting-xp:draft:v2";
const savedKey = "ark-crafting-xp:saved:v2";

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
};

const resourcesForItem = (item: CraftingItem | null, previous: ResourceInput[] = []): ResourceInput[] =>
  item?.resources.map((name, index) => ({
    id: `resource-${index}`,
    name,
    quantity: previous.find((resource) => resource.name === name)?.quantity || "",
  })) || [];

const emptyInput = (): CalculatorInput => ({
  item: null,
  qualityId: "",
  serverRate: "",
  currentLevel: "",
  targetLevel: "",
  playerCount: 1,
  buffIds: [],
  tribeTowerBonus: "",
  resources: [],
});

const hydrateInput = (stored: unknown, items: CraftingItem[]): CalculatorInput => {
  const value = (stored && typeof stored === "object" ? stored : {}) as Partial<CalculatorInput>;
  const item = items.find(({ name }) => name === value.item?.name) || null;
  const previous = Array.isArray(value.resources) ? value.resources : [];
  const qualityId = qualities.some(({ id }) => id === value.qualityId) ? value.qualityId || "" : "";
  const buffIds = Array.isArray(value.buffIds)
    ? value.buffIds.filter((id): id is BuffId => buffs.some((buff) => buff.id === id))
    : [];
  const players = Number(value.playerCount);
  return {
    item,
    qualityId,
    serverRate: typeof value.serverRate === "string" ? value.serverRate : "",
    currentLevel: typeof value.currentLevel === "string" ? value.currentLevel : "",
    targetLevel: typeof value.targetLevel === "string" ? value.targetLevel : "",
    playerCount: Number.isFinite(players) ? Math.min(70, Math.max(1, players)) : 1,
    buffIds,
    tribeTowerBonus: typeof value.tribeTowerBonus === "string" ? value.tribeTowerBonus : "",
    resources: resourcesForItem(item, previous),
  };
};

const loadSaved = (items: CraftingItem[]): SavedCalculation[] => {
  const stored = readStored<SavedCalculation[]>(savedKey, []);
  return Array.isArray(stored)
    ? stored
      .filter(({ id, name, input }) => Boolean(id && name && input))
      .map((entry) => ({ ...entry, input: hydrateInput(entry.input, items) }))
    : [];
};

export const useCalculatorState = (items: CraftingItem[]) => {
  const [input, setInput] = useState<CalculatorInput>(() =>
    hydrateInput(readStored(draftKey, emptyInput()), items));
  const [saved, setSaved] = useState<SavedCalculation[]>(() => loadSaved(items));
  const [activeSavedId, setActiveSavedId] = useState("");
  const [calculationName, setCalculationName] = useState("");

  useEffect(() => localStorage.setItem(draftKey, JSON.stringify(input)), [input]);
  useEffect(() => localStorage.setItem(savedKey, JSON.stringify(saved)), [saved]);

  const selectItem = (item: CraftingItem) => setInput((current) => ({
    ...current,
    item,
    resources: resourcesForItem(item),
  }));
  const updateResourceQuantity = (id: string, quantity: string) => setInput((current) => ({
    ...current,
    resources: current.resources.map((resource) =>
      resource.id === id ? { ...resource, quantity } : resource),
  }));
  const saveNew = () => {
    const name = calculationName.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    setSaved((current) => [...current, { id, name, input }]);
    setActiveSavedId(id);
  };
  const updateSaved = () => {
    const name = calculationName.trim();
    if (!activeSavedId || !name) return;
    setSaved((current) => current.map((entry) =>
      entry.id === activeSavedId ? { ...entry, name, input } : entry));
  };
  const loadCalculation = (id: string) => {
    const calculation = saved.find((entry) => entry.id === id);
    if (!calculation) return;
    setInput(hydrateInput(calculation.input, items));
    setActiveSavedId(id);
    setCalculationName(calculation.name);
  };

  return {
    input,
    setInput,
    saved,
    activeSavedId,
    calculationName,
    setCalculationName,
    selectItem,
    updateResourceQuantity,
    saveNew,
    updateSaved,
    loadCalculation,
  };
};
