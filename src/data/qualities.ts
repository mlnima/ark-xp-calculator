import type { Quality } from "../types/calculator";

export const qualities: Quality[] = [
  { id: "primitive", label: "Primitive", multiplier: 1, ratingThreshold: 1 },
  { id: "ramshackle", label: "Ramshackle", multiplier: 2, ratingThreshold: 1.25 },
  { id: "apprentice", label: "Apprentice", multiplier: 3, ratingThreshold: 2.5 },
  { id: "journeyman", label: "Journeyman", multiplier: 4, ratingThreshold: 4.5 },
  { id: "mastercraft", label: "Mastercraft", multiplier: 5, ratingThreshold: 7 },
  { id: "ascendant", label: "Ascendant", multiplier: 6, ratingThreshold: 10 },
];

export const qualityForRating = (rating: number) =>
  [...qualities].reverse().find((quality) => rating >= quality.ratingThreshold) || qualities[0];
