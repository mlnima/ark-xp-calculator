export type StationId = "smithy" | "replicator";
export type ClockMode = "area" | "targeted";

export type CraftingRecipe = {
  baseSeconds: number | null;
  stations: string[];
  ingredients: { name: string; quantity: number }[];
  sourceUrl: string;
  timeSourceUrl?: string;
};

export type StationEstimate = {
  id: StationId;
  label: string;
  secondsPerCraft: number;
  partySeconds: number;
};

export type ConsumableTotal = {
  id: string;
  label: string;
  durationSeconds: number;
  perPlayer: number;
  total: number;
};

export type CraftingTiming = {
  secondsPerCraft: number;
  partySeconds: number;
  stations: StationEstimate[];
  consumables: ConsumableTotal[];
};
