export type QualityId =
  | "primitive"
  | "ramshackle"
  | "apprentice"
  | "journeyman"
  | "mastercraft"
  | "ascendant";

export type BuffId = "broth" | "toilet" | "egg" | "note2" | "note4" | "tower" | "drakeling";

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
};

export type ResourceInput = {
  id: string;
  name: string;
  quantity: string;
};

export type CalculatorInput = {
  item: CraftingItem | null;
  qualityId: QualityId | "";
  serverRate: string;
  currentLevel: string;
  targetLevel: string;
  playerCount: number;
  buffIds: BuffId[];
  tribeTowerBonus: string;
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
};

export type CalculationResult = {
  xpRequired: number;
  ownXpPerCraft: number;
  sharedXpPerRound: number;
  xpPerPlayerPerRound: number;
  craftsPerPlayer: number;
  totalCrafts: number;
  projectedXp: number;
  xpOverTarget: number;
  combinedMultiplier: number;
  resources: ResourceTotal[];
};
