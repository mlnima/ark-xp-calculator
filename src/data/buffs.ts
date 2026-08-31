import type { Buff } from "../types/calculator";

export const buffs: Buff[] = [
  { id: "broth", label: "Broth of Enlightenment", multiplier: 1.5, detail: "+50% · 20 min" },
  { id: "toilet", label: "Toilet Buff", multiplier: 1.33, detail: "+33% · 2 min" },
  { id: "egg", label: "Golden Hesperornis Egg", multiplier: 1.1, detail: "+10% · 10 min" },
  { id: "note2", label: "Explorer Notes", multiplier: 2, detail: "2× XP" },
  { id: "note4", label: "??? & HLN-A Special Notes", multiplier: 4, detail: "4× XP" },
  { id: "tower", label: "Tribe Tower", multiplier: 1, detail: "+1% per day · base cap 20%" },
  { id: "drakeling", label: "Drakeling Native Biome", multiplier: 1.1, detail: "+10% XP" },
];
