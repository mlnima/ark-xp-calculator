import type { CalculatorInput, PartyPlayer } from "../types/calculator";

type Defaults = Omit<CalculatorInput, "item" | "players" | "resources" | "craftSeconds"> & {
  itemName: string;
  playerLevels: Pick<PartyPlayer, "currentLevel" | "targetLevel">;
};

export const calculatorDefaults: Defaults = {
  itemName: "Bronto Platform Saddle",
  qualityId: "primitive",
  stationId: "replicator",
  craftTimeBasis: "station",
  clockEnabled: true,
  clockMode: "targeted",
  serverRate: "2",
  playerCount: 1,
  stationCount: 10,
  buffIds: ["broth", "toilet", "egg", "note2", "note4", "tower", "drakeling"],
  tribeTowerBonus: "20",
  playerLevels: { currentLevel: "1", targetLevel: "245" },
  grinding: false,
  recycler: false,
  splitResources: true,
};
