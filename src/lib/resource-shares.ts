export const wholeResourceTotal = (total: number) => Math.ceil(total - Number.EPSILON * total);

export const allocateResourceShares = (total: number, xpRequired: number[]): number[] => {
  const units = wholeResourceTotal(total);
  const totalXp = xpRequired.reduce((sum, xp) => sum + xp, 0);
  if (!totalXp) return xpRequired.map(() => 0);
  const shares = xpRequired.map((xp, index) => {
    const exact = units * (xp / totalXp);
    const quantity = Math.floor(exact);
    return { index, quantity, remainder: exact - quantity };
  });
  const remaining = units - shares.reduce((sum, share) => sum + share.quantity, 0);
  const tolerance = Number.EPSILON * units * 4;
  const ranked = [...shares].sort((left, right) => {
    const difference = right.remainder - left.remainder;
    return Math.abs(difference) > tolerance ? difference : left.index - right.index;
  });
  ranked.slice(0, remaining).forEach((share) => {
    share.quantity += 1;
  });
  return shares.map(({ quantity }) => quantity);
};
