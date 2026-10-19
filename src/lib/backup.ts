import { objectValue, requireValue, validateInput } from "./backup-validation.ts";
import type { CalculatorInput, CraftingItem, SavedCalculation } from "../types/calculator.ts";

export type CalculatorBackup = {
  input: CalculatorInput;
  saved: SavedCalculation[];
  activeSavedId: string;
  calculationName: string;
};

const backupFormat = { format: "ark-crafting-xp", version: 1 };

export const serializeBackup = (backup: CalculatorBackup) => JSON.stringify({ ...backupFormat, ...backup }, null, 2);

export const parseBackup = (text: string, items: CraftingItem[]): CalculatorBackup => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
  const value = objectValue(parsed, "Backup");
  requireValue(value.format === backupFormat.format && value.version === backupFormat.version, "Choose a JSON file exported by this calculator (version 1).");
  const input = validateInput(value.input, items);
  requireValue(Array.isArray(value.saved), "Saved calculations must be a list.");
  const saved = (value.saved as unknown[]).map((entry): SavedCalculation => {
    const calculation = objectValue(entry, "Saved calculation");
    requireValue(typeof calculation.id === "string" && calculation.id.trim(), "A saved calculation has no ID.");
    requireValue(typeof calculation.name === "string" && calculation.name.trim(), "A saved calculation has no name.");
    return { id: calculation.id as string, name: calculation.name as string, input: validateInput(calculation.input, items) };
  });
  requireValue(new Set(saved.map(({ id }) => id)).size === saved.length, "Saved calculation IDs must be unique.");
  requireValue(typeof value.activeSavedId === "string" && (!value.activeSavedId || saved.some(({ id }) => id === value.activeSavedId)), "The active saved calculation is missing.");
  requireValue(typeof value.calculationName === "string", "Invalid current calculation name.");
  return { input, saved, activeSavedId: value.activeSavedId as string, calculationName: value.calculationName as string };
};

export const mergeSaved = (existing: SavedCalculation[], incoming: SavedCalculation[], activeId: string) => {
  const saved = [...existing];
  let activeSavedId = "";
  incoming.forEach((entry) => {
    const match = saved.find(({ name, input }) => name === entry.name && JSON.stringify(input) === JSON.stringify(entry.input));
    const id = match?.id || (saved.some((item) => item.id === entry.id) ? crypto.randomUUID() : entry.id);
    if (!match) saved.push({ ...entry, id });
    if (entry.id === activeId) activeSavedId = id;
  });
  return { saved, activeSavedId };
};
