const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

export const formatNumber = (value: number) => numberFormatter.format(value);

export const formatCompact = (value: number) =>
  new Intl.NumberFormat(undefined, {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(value);
