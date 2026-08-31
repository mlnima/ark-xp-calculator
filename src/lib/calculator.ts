import { buffs } from "../data/buffs.ts";
import { qualities } from "../data/qualities.ts";
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
  if (!input.resources.length) return [];
  return input.resources.flatMap(({ name, quantity }) => {
    if (!positiveNumber(quantity)) return [`Enter a valid quantity for ${name.trim()}`];
    return [];
  });
};

export const getInputIssues = (input: CalculatorInput, levels: LevelEntry[]) => {
  const issues: string[] = [];
  if (!input.item) issues.push("Choose a crafting item");
  if (!input.qualityId) issues.push("Choose the blueprint quality");
  if (!positiveNumber(input.serverRate)) issues.push("Enter a server XP rate above zero");
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

const totalResources = (input: CalculatorInput, totalCrafts: number): ResourceTotal[] => {
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
    .map(({ name, perCraft }) => ({ name, perCraft, total: perCraft * totalCrafts }))
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
  const sharedXpPerRound = ownXpPerCraft * 0.5 * (input.playerCount - 1);
  const xpPerPlayerPerRound = ownXpPerCraft + sharedXpPerRound;
  const xpRequired = target.totalXp - current.totalXp;
  const craftsPerPlayer = Math.ceil(xpRequired / xpPerPlayerPerRound);
  const totalCrafts = craftsPerPlayer * input.playerCount;
  const projectedXp = craftsPerPlayer * xpPerPlayerPerRound;
  return {
    xpRequired,
    ownXpPerCraft,
    sharedXpPerRound,
    xpPerPlayerPerRound,
    craftsPerPlayer,
    totalCrafts,
    projectedXp,
    xpOverTarget: projectedXp - xpRequired,
    combinedMultiplier,
    resources: totalResources(input, totalCrafts),
  };
};
