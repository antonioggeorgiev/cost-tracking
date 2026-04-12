import { supportedCurrencies } from "@/lib/currency";

type OpenExchangeRatesResponse = {
  timestamp: number;
  rates: Record<string, number>;
};

function isSupportedCurrency(currency: string): currency is (typeof supportedCurrencies)[number] {
  return supportedCurrencies.includes(currency as (typeof supportedCurrencies)[number]);
}

function buildRatesUrl(date: string | null) {
  const baseUrl = date
    ? `https://openexchangerates.org/api/historical/${date}.json`
    : "https://openexchangerates.org/api/latest.json";

  return `${baseUrl}?app_id=${process.env.OPEN_EXCHANGE_RATES_APP_ID}`;
}

export const fxService = {
  async getExchangeRateSnapshot(input: { fromCurrencyCode: string; toCurrencyCode: string; expenseDate: Date }) {
    if (!isSupportedCurrency(input.fromCurrencyCode) || !isSupportedCurrency(input.toCurrencyCode)) {
      throw new Error("Unsupported currency code.");
    }

    if (input.fromCurrencyCode === input.toCurrencyCode) {
      return { rate: 1, rateDate: input.expenseDate };
    }

    if (!process.env.OPEN_EXCHANGE_RATES_APP_ID) {
      throw new Error("OPEN_EXCHANGE_RATES_APP_ID is required for non-base currency expenses.");
    }

    const historicalDate = input.expenseDate.toISOString().slice(0, 10);
    const response = await fetch(buildRatesUrl(historicalDate), { cache: "no-store" });

    let payload: OpenExchangeRatesResponse | null = null;
    if (response.ok) {
      payload = (await response.json()) as OpenExchangeRatesResponse;
    }

    if (!payload) {
      const fallbackResponse = await fetch(buildRatesUrl(null), { cache: "no-store" });
      if (!fallbackResponse.ok) {
        throw new Error("Unable to fetch exchange rates.");
      }
      payload = (await fallbackResponse.json()) as OpenExchangeRatesResponse;
    }

    const fromRate = input.fromCurrencyCode === "USD" ? 1 : payload.rates[input.fromCurrencyCode];
    const toRate = input.toCurrencyCode === "USD" ? 1 : payload.rates[input.toCurrencyCode];
    if (!fromRate || !toRate) {
      throw new Error("The required exchange rate is not available.");
    }

    return { rate: toRate / fromRate, rateDate: new Date(payload.timestamp * 1000) };
  },
};
