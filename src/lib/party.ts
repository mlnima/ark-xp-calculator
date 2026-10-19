import { partyLimits } from "../data/party.ts";
import type { CalculatorInput } from "../types/calculator.ts";

export const clampPartyCount = (value: number, maximum: number) =>
  Math.min(maximum, Math.max(1, Number.isFinite(value) ? Math.floor(value) : 1));

export const restorePartyCounts = (value: Partial<CalculatorInput>) => {
  const playerCount = clampPartyCount(Number(value.playerCount ?? 1), partyLimits.players);
  const stationCount = clampPartyCount(Number(value.stationCount ?? playerCount), partyLimits.stations);
  return { playerCount, stationCount };
};

export const partySetup = ({ playerCount, stationCount }: Pick<CalculatorInput, "playerCount" | "stationCount">) => {
  const craftingPlayers = Math.min(playerCount, stationCount);
  return {
    craftingPlayers,
    sharingPlayers: playerCount - craftingPlayers,
    minStationsPerCrafter: Math.floor(stationCount / craftingPlayers),
    maxStationsPerCrafter: Math.ceil(stationCount / craftingPlayers),
  };
};
