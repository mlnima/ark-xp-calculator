import { buffs } from "../data/buffs.ts";
import { grindingRules } from "../data/grinding.ts";
import { qualities } from "../data/qualities.ts";
import { partyLimits } from "../data/party.ts";
import { partySetup } from "./party.ts";
import { calculateTiming } from "./crafting.ts";
import type {
  CalculationResult,
  CalculatorInput,
  LevelEntry,
  ResourceTotal,
} from "../types/calculator.ts";

const positiveNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const selectedLevel = (levels: LevelEntry[], value: string) =>
  levels.find(({ level }) => level === Number(value));

const resourceIssues = (input: CalculatorInput) => {
  if (input.grinding && !input.resources.length) return ["Enter blueprint resources to calculate grinding"];
  if (!input.resources.length) return [];
  return input.resources.flatMap(({ name, quantity }) => {
    if (!positiveNumber(quantity)) return [`Enter a valid quantity for ${name.trim()}`];
    if (input.grinding && !Number.isSafeInteger(Number(quantity))) {
      return [`Enter a whole-number quantity for ${name.trim()} when grinding`];
    }
    return [];
  });
};

export const getInputIssues = (input: CalculatorInput, levels: LevelEntry[]) => {
  const issues: string[] = [];
  if (!input.item) issues.push("Choose a crafting item");
  if (!input.qualityId) issues.push("Choose the blueprint quality");
  if (!positiveNumber(input.serverRate)) issues.push("Enter a server XP rate above zero");
  if (!Number.isInteger(input.playerCount) || input.playerCount < 1 || input.playerCount > partyLimits.players) {
    issues.push(`Choose between 1 and ${partyLimits.players} players`);
  }
  if (!Number.isInteger(input.stationCount) || input.stationCount < 1 || input.stationCount > partyLimits.stations) {
    issues.push(`Choose between 1 and ${partyLimits.stations} active stations`);
  }
  if (input.buffIds.includes("tower") && !positiveNumber(input.tribeTowerBonus)) {
    issues.push("Enter the active Tribe Tower XP bonus");
  }
  const current = selectedLevel(levels, input.currentLevel);
  const target = selectedLevel(levels, input.targetLevel);
  if (!current) issues.push("Choose the current level");
  if (!target) issues.push("Choose the target level");
  if (current && target && target.level <= current.level) {
    issues.push("Target level must be higher than current level");
  }
  return [...issues, ...resourceIssues(input)];
};

const totalResources = (input: CalculatorInput, craftsPerStation: number): ResourceTotal[] => {
  const grouped = new Map<string, { name: string; perCraft: number }>();
  input.resources.forEach(({ name, quantity }) => {
    const trimmed = name.trim();
    const amount = positiveNumber(quantity);
    if (!trimmed || !amount) return;
    const key = trimmed.toLocaleLowerCase();
    const current = grouped.get(key);
    grouped.set(key, {
      name: current?.name || trimmed,
      perCraft: (current?.perCraft || 0) + amount,
    });
  });
  return [...grouped.values()]
    .map(({ name, perCraft }) => {
      const bonus = input.recycler ? grindingRules.recyclerBonusPercent : 0;
      const returned = input.grinding
        ? Math.min(perCraft, Math.ceil(perCraft * grindingRules.returnPercent * (100 + bonus) / 10000))
        : 0;
      const perStation = perCraft + (craftsPerStation - 1) * (perCraft - returned);
      const total = input.grinding ? perStation * input.stationCount : perCraft * (craftsPerStation * input.stationCount);
      return { name, perCraft, total, perPlayer: Math.ceil(total / input.playerCount) };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
};

export const calculate = (
  input: CalculatorInput,
  levels: LevelEntry[],
): CalculationResult | null => {
  if (getInputIssues(input, levels).length || !input.item || !input.qualityId) return null;
  const current = selectedLevel(levels, input.currentLevel);
  const target = selectedLevel(levels, input.targetLevel);
  const quality = qualities.find(({ id }) => id === input.qualityId);
  if (!current || !target || !quality) return null;
  const rate = positiveNumber(input.serverRate) || 0;
  const buffMultiplier = input.buffIds.reduce((total, id) => {
    const buff = buffs.find((entry) => entry.id === id);
    const multiplier = id === "tower"
      ? 1 + (positiveNumber(input.tribeTowerBonus) || 0) / 100
      : buff?.multiplier || 1;
    return total * multiplier;
  }, 1);
  const combinedMultiplier = quality.multiplier * rate * buffMultiplier;
  const ownXpPerCraft = input.item.experience * combinedMultiplier;
  const party = partySetup(input);
  const fewestOwnedStations = Math.floor(input.stationCount / input.playerCount);
  const sharedXpPerRound = ownXpPerCraft * 0.5 * (input.stationCount - fewestOwnedStations);
  const xpPerPlayerPerRound = ownXpPerCraft * fewestOwnedStations + sharedXpPerRound;
  const crafterXpPerRound = ownXpPerCraft * (party.minStationsPerCrafter + input.stationCount) / 2;
  const passiveXpPerRound = ownXpPerCraft * input.stationCount / 2;
  const xpRequired = target.totalXp - current.totalXp;
  const craftsPerStation = Math.ceil(xpRequired / xpPerPlayerPerRound);
  const totalCrafts = craftsPerStation * input.stationCount;
  const resources = totalResources(input, craftsPerStation);
  const initialCraftsPerStation = input.grinding
    ? Math.min(craftsPerStation, ...resources.map(({ perCraft, total }) =>
      Math.floor(total / input.stationCount / perCraft)))
    : craftsPerStation;
  const projectedXp = craftsPerStation * xpPerPlayerPerRound;
  return {
    xpRequired,
    ownXpPerCraft,
    sharedXpPerRound,
    xpPerPlayerPerRound,
    craftsPerStation,
    totalCrafts,
    initialCraftsPerStation,
    recycledCraftsPerStation: craftsPerStation - initialCraftsPerStation,
    crafterXpPerRound,
    passiveXpPerRound,
    projectedXp,
    xpOverTarget: projectedXp - xpRequired,
    combinedMultiplier,
    timing: calculateTiming(input, craftsPerStation),
    resources,
  };
};
