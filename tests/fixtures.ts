import type { PartyPlayer } from "../src/types/calculator.ts";

export const testPlayers = (count: number, currentLevel = "1", targetLevel = "2"): PartyPlayer[] =>
  Array.from({ length: count }, (_, index) => ({ name: `Player ${index + 1}`, currentLevel, targetLevel }));
