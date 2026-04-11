export const supportedCurrencies = [
  "BGN",
  "EUR",
  "USD",
  "GBP",
  "RON",
  "TRY",
] as const;

export type SupportedCurrency = (typeof supportedCurrencies)[number];
