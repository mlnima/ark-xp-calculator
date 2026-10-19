import { clockModes, craftingRecipes, craftingStations } from "../data/crafting.ts";
import type { CalculatorInput, CraftingItem, QualityId, ResourceInput } from "../types/calculator.ts";
import type { ClockMode, StationId } from "../types/crafting.ts";

export const stationSpeed = (id: StationId) => craftingStations.find((station) => station.id === id)!.speed;

export const clockSpeed = (input: Pick<CalculatorInput, "clockEnabled" | "clockMode">) =>
  input.clockEnabled ? 1 + (clockModes.find(({ id }) => id === input.clockMode)?.bonusPercent || 0) / 100 : 1;

export const defaultCraftSeconds = (item: CraftingItem | null, stationId: StationId) => {
  const seconds = craftingRecipes[item?.name || ""]?.baseSeconds;
  return seconds ? String(seconds / stationSpeed(stationId)) : "";
};

export const resourcesForItem = (item: CraftingItem | null, previous: ResourceInput[] = []): ResourceInput[] => {
  const ingredients = craftingRecipes[item?.name || ""]?.ingredients || [];
  const names = ingredients.length ? ingredients.map(({ name }) => name) : item?.resources || [];
  return names.map((name, index) => ({
    id: `resource-${index}`,
    name,
    quantity: previous.find((resource) => resource.name === name)?.quantity || "",
  }));
};

export const fillPrimitiveResources = (input: CalculatorInput): ResourceInput[] => {
  if (input.qualityId !== "primitive") return input.resources;
  const ingredients = craftingRecipes[input.item?.name || ""]?.ingredients || [];
  return input.resources.map((resource) => {
    const quantity = ingredients.find(({ name }) => name === resource.name)?.quantity;
    return resource.quantity.trim() || !quantity ? resource : { ...resource, quantity: String(quantity) };
  });
};

export const withQuality = (input: CalculatorInput, qualityId: QualityId): CalculatorInput => {
  const next = { ...input, qualityId };
  return { ...next, resources: fillPrimitiveResources(next) };
};

export const withCraftingItem = (input: CalculatorInput, item: CraftingItem): CalculatorInput => {
  if (input.item?.name === item.name) return input;
  const defaultSeconds = defaultCraftSeconds(item, input.stationId);
  const craftSeconds = defaultSeconds ? String(Number(defaultSeconds) / clockSpeed(input)) : "";
  const next = { ...input, item, craftSeconds, resources: resourcesForItem(item) };
  return { ...next, resources: fillPrimitiveResources(next) };
};

export const withStation = (input: CalculatorInput, stationId: StationId): CalculatorInput => {
  if (stationId === input.stationId) return input;
  const seconds = Number(input.craftSeconds);
  const defaultSeconds = defaultCraftSeconds(input.item, stationId);
  const craftSeconds = input.craftSeconds.trim() && Number.isFinite(seconds) && seconds > 0
    ? String(seconds * stationSpeed(input.stationId) / stationSpeed(stationId))
    : defaultSeconds ? String(Number(defaultSeconds) / clockSpeed(input)) : "";
  return { ...input, stationId, craftSeconds };
};

export const withClock = (input: CalculatorInput, clockEnabled: boolean, clockMode: ClockMode | ""): CalculatorInput => {
  const next = { ...input, clockEnabled, clockMode };
  const seconds = Number(input.craftSeconds);
  const craftSeconds = input.craftSeconds.trim() && Number.isFinite(seconds) && seconds > 0
    ? String(seconds * clockSpeed(input) / clockSpeed(next))
    : input.craftSeconds;
  return { ...next, craftSeconds };
};
