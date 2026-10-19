import type { ClockMode, CraftingTiming, StationId } from "./crafting";

export type QualityId =
  | "primitive"
  | "ramshackle"
  | "apprentice"
  | "journeyman"
  | "mastercraft"
  | "ascendant";

export type BuffId = "broth" | "toilet" | "egg" | "cake" | "note2" | "note4" | "tower" | "drakeling";

export type CraftingItem = {
  name: string;
  experience: number;
  resources: string[];
};

export type LevelEntry = {
  level: number;
  totalXp: number;
};

export type Quality = {
  id: QualityId;
  label: string;
  multiplier: number;
  ratingThreshold: number;
};

export type Buff = {
  id: BuffId;
  label: string;
  multiplier: number;
  detail: string;
  durationSeconds?: number;
};

export type ResourceInput = {
  id: string;
  name: string;
  quantity: string;
};

export type CalculatorInput = {
  item: CraftingItem | null;
  qualityId: QualityId | "";
  stationId: StationId;
  craftSeconds: string;
  craftTimeBasis: "station";
  clockEnabled: boolean;
  clockMode: ClockMode | "";
  serverRate: string;
  currentLevel: string;
  targetLevel: string;
  playerCount: number;
  buffIds: BuffId[];
  tribeTowerBonus: string;
  grinding: boolean;
  recycler: boolean;
  splitResources: boolean;
  resources: ResourceInput[];
};

export type SavedCalculation = {
  id: string;
  name: string;
  input: CalculatorInput;
};

export type ResourceTotal = {
  name: string;
  perCraft: number;
  total: number;
  perPlayer: number;
};

export type CalculationResult = {
  xpRequired: number;
  ownXpPerCraft: number;
  sharedXpPerRound: number;
  xpPerPlayerPerRound: number;
  craftsPerPlayer: number;
  totalCrafts: number;
  initialCraftsPerPlayer: number;
  recycledCraftsPerPlayer: number;
  projectedXp: number;
  xpOverTarget: number;
  combinedMultiplier: number;
  timing: CraftingTiming | null;
  resources: ResourceTotal[];
};
