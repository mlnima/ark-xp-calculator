import type { CalculatorInput, LevelEntry, PartyPlayer, PlayerResult } from "../types/calculator.ts";
import { clampPartyCount } from "./party.ts";
import { partyLimits } from "../data/party.ts";

export const newPlayer = (index: number, first?: Partial<PartyPlayer>): PartyPlayer => ({
  name: `Player ${index + 1}`,
  currentLevel: first?.currentLevel || "",
  targetLevel: first?.targetLevel || "",
});

export const resizeParty = (input: CalculatorInput, count: number): CalculatorInput => {
  const playerCount = clampPartyCount(count, partyLimits.players);
  const players = Array.from({ length: Math.max(playerCount, input.players.length) }, (_, index) =>
    input.players[index] || newPlayer(index, input.players[0]));
  return { ...input, playerCount, players };
};

export const playerIssues = (input: CalculatorInput, levels: LevelEntry[]) => {
  if (input.players.length < input.playerCount) return ["Complete the party's player details"];
  const available = new Set(levels.map(({ level }) => String(level)));
  return input.players.slice(0, input.playerCount).flatMap((player, index) => {
    const prefix = player.name.trim() || `Player ${index + 1}`;
    const issues: string[] = [];
    if (!player.name.trim()) issues.push(`Player ${index + 1}: Enter a player name`);
    if (!available.has(player.currentLevel)) issues.push(`${prefix}: Choose the current level`);
    if (!available.has(player.targetLevel)) issues.push(`${prefix}: Choose the target level`);
    if (available.has(player.currentLevel) && available.has(player.targetLevel) && Number(player.targetLevel) <= Number(player.currentLevel)) {
      issues.push(`${prefix}: Target level must be higher than current level`);
    }
    return issues;
  });
};

export const calculatePlayers = (input: CalculatorInput, levels: LevelEntry[], xpPerCraft: number): PlayerResult[] => {
  const totals = new Map(levels.map(({ level, totalXp }) => [String(level), totalXp]));
  return input.players.slice(0, input.playerCount).map((player, index) => {
    const stations = Math.floor(input.stationCount / input.playerCount) + Number(index < input.stationCount % input.playerCount);
    const xpRequired = totals.get(player.targetLevel)! - totals.get(player.currentLevel)!;
    const sharedXpPerRound = xpPerCraft * 0.5 * (input.stationCount - stations);
    const xpPerRound = xpPerCraft * stations + sharedXpPerRound;
    return {
      ...player, index, stations, xpRequired, xpPerRound, sharedXpPerRound,
      roundsToTarget: Math.ceil(xpRequired / xpPerRound),
      projectedXp: 0, xpOverTarget: 0, secondsToTarget: null,
    };
  });
};
