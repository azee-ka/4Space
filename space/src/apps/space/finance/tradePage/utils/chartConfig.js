// constants/chartConfig.js
export const TIMEFRAMES = {
  "1H": 60,
  "1D": 390,
  "1W": 390,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  YTD: null,
  "1Y": 365,
  "2Y": 730,
  "5Y": 1825,
  "10Y": 3650,
  MAX: 120,
};

export const TF_CONFIG = {
  "1H": { spanDays: 1 / 24, resolutionDays: 1 / 4 / 1440 },
  "1D": { spanDays: 1, resolutionDays: 3 / 1440 },
  "1W": { spanDays: 7, resolutionDays: 30 / 1440, tickUnit: "day", tickStep: 1, displayFormats: { day: "MMM d" } },
  "1M": { spanDays: 30, resolutionDays: 0.3, tickUnit: "week", tickStep: 1, displayFormats: { week: "MMM d" } },
  "3M": { spanDays: 90, resolutionDays: 1 },
  "6M": { spanDays: 180, resolutionDays: 1 },
  YTD: { spanDays: null, resolutionDays: 1 },
  "1Y": { spanDays: 365, resolutionDays: 1 },
  "2Y": { spanDays: 730, resolutionDays: 5 },
  "5Y": { spanDays: 1825, resolutionDays: 15 },
  "10Y": { spanDays: 3650, resolutionDays: 30 },
  MAX: { spanDays: 3650 * 2, resolutionDays: 50 },
};

export const MAX_TICKS = {
  "1H": 8,
  "1D": 8,
  "1W": 7,
  "1M": 10,
  "3M": 10,
  "6M": 10,
  YTD: 10,
  "1Y": 12,
  "2Y": 12,
  "5Y": 12,
  "10Y": 12,
  MAX: 12,
};

export const DEFAULT_TOKENS = {
  minute: "h:mm a",
  hour: "MMM d h a",
  day: "MMM d",
  week: "MMM d",
  month: "MMM yyyy",
  year: "yyyy",
};

export const COMPANY_NAMES = {
  AAPL: "Apple Inc.",
  TSLA: "Tesla, Inc.",
  MSFT: "Microsoft Corporation",
  GOOG: "Alphabet Inc.",
  AMZN: "Amazon.com, Inc.",
};

export function getTickConfig(resDays) {
  const m = resDays * 24 * 60;
  if (m < 60) return { unit: "minute", stepSize: Math.max(1, Math.round(m)) };
  if (m < 1440) return { unit: "hour", stepSize: Math.max(1, Math.round(m / 60)) };
  if (m < 43200) return { unit: "day", stepSize: Math.max(1, Math.round(m / 1440)) };
  if (m < 525600) return { unit: "month", stepSize: Math.max(1, Math.round(m / 43200)) };
  return { unit: "year", stepSize: Math.max(1, Math.round(m / 525600)) };
}
