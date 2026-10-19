import { useCallback, useEffect, useState } from "react";
import { withClock, withCraftingItem, withQuality, withStation } from "../lib/blueprint";
import { emptyInput, hydrateInput, loadSaved, readStored, storageKeys } from "../lib/input-state";
import { resizeParty } from "../lib/players";
import { mergeSaved, parseBackup, serializeBackup } from "../lib/backup";
import type { ClockMode, StationId } from "../types/crafting";
import type { CalculatorInput, CraftingItem, PartyPlayer, QualityId } from "../types/calculator";

type Metadata = { activeSavedId: string; calculationName: string };

export const useCalculatorState = (items: CraftingItem[]) => {
  const [input, setInput] = useState<CalculatorInput>(() => hydrateInput(readStored(storageKeys.draft, emptyInput()), items));
  const [saved, setSaved] = useState(() => loadSaved(items));
  const [metadata, setMetadata] = useState<Metadata>(() => {
    const stored = readStored<Partial<Metadata>>(storageKeys.metadata, {});
    return {
      activeSavedId: saved.some(({ id }) => id === stored.activeSavedId) ? stored.activeSavedId || "" : "",
      calculationName: typeof stored.calculationName === "string" ? stored.calculationName : "",
    };
  });
  const { activeSavedId, calculationName } = metadata;

  useEffect(() => localStorage.setItem(storageKeys.draft, JSON.stringify(input)), [input]);
  useEffect(() => localStorage.setItem(storageKeys.saved, JSON.stringify(saved)), [saved]);
  useEffect(() => localStorage.setItem(storageKeys.metadata, JSON.stringify(metadata)), [metadata]);

  const selectItem = (item: CraftingItem) => setInput((current) => withCraftingItem(current, item));
  const selectQuality = (qualityId: QualityId) => setInput((current) => withQuality(current, qualityId));
  const selectStation = (stationId: StationId) => setInput((current) => withStation(current, stationId));
  const updateClock = (clockEnabled: boolean, clockMode: ClockMode | "") =>
    setInput((current) => withClock(current, clockEnabled, clockMode));
  const updatePlayerCount = (count: number) => setInput((current) => resizeParty(current, count));
  const updatePlayer = useCallback((index: number, changes: Partial<PartyPlayer>) => setInput((current) => ({
    ...current, players: current.players.map((player, position) => position === index ? { ...player, ...changes } : player),
  })), []);
  const updateResourceQuantity = (id: string, quantity: string) => setInput((current) => ({
    ...current, resources: current.resources.map((resource) => resource.id === id ? { ...resource, quantity } : resource),
  }));
  const setCalculationName = (name: string) => setMetadata((current) => ({ ...current, calculationName: name }));
  const saveNew = () => {
    const name = calculationName.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    setSaved((current) => [...current, { id, name, input }]);
    setMetadata((current) => ({ ...current, activeSavedId: id }));
  };
  const updateSaved = () => {
    const name = calculationName.trim();
    if (!activeSavedId || !name) return;
    setSaved((current) => current.map((entry) => entry.id === activeSavedId ? { ...entry, name, input } : entry));
  };
  const loadCalculation = (id: string) => {
    const calculation = saved.find((entry) => entry.id === id);
    if (!calculation) return;
    setInput(hydrateInput(calculation.input, items));
    setMetadata({ activeSavedId: id, calculationName: calculation.name });
  };
  const exportData = () => serializeBackup({ input, saved, ...metadata });
  const importData = (text: string) => {
    const backup = parseBackup(text, items);
    const merged = mergeSaved(saved, backup.saved, backup.activeSavedId);
    setInput(backup.input);
    setSaved(merged.saved);
    setMetadata({ activeSavedId: merged.activeSavedId, calculationName: backup.calculationName });
  };

  return {
    input, setInput, saved, activeSavedId, calculationName, setCalculationName, selectItem, selectQuality,
    selectStation, updateClock, updatePlayerCount, updatePlayer, updateResourceQuantity,
    saveNew, updateSaved, loadCalculation, exportData, importData,
  };
};
