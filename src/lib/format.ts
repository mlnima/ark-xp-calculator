const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const durationFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 });

export const formatNumber = (value: number) => numberFormatter.format(value);

export const formatDuration = (seconds: number): string => {
  if (seconds < 0.000001) return "<0.000001 s";
  if (seconds < 60) return `${durationFormatter.format(seconds)} s`;
  const rounded = Math.ceil(seconds);
  const days = Math.floor(rounded / 86400);
  const hours = Math.floor(rounded % 86400 / 3600);
  const minutes = Math.floor(rounded % 3600 / 60);
  const remainder = rounded % 60;
  return `${days ? `${days}d ` : ""}${hours ? `${hours}h ` : ""}${minutes ? `${minutes}m ` : ""}${remainder ? `${remainder}s` : ""}`.trim();
};

export const formatCompact = (value: number) =>
  new Intl.NumberFormat(undefined, {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(value);
