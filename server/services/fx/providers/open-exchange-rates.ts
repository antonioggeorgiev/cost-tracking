import type { FxProvider, ExchangeRateResult } from "../types";
import type { SupportedCurrency } from "@/lib/currency";

type OpenExchangeRatesResponse = {
  timestamp: number;
  rates: Record<string, number>;
};

function buildUrl(date: string | null) {
  const base = date
    ? `https://openexchangerates.org/api/historical/${date}.json`
    : "https://openexchangerates.org/api/latest.json";

  return `${base}?app_id=${process.env.OPEN_EXCHANGE_RATES_APP_ID}`;
}

async function fetchRates(date: string | null): Promise<OpenExchangeRatesResponse> {
  const response = await fetch(buildUrl(date), { cache: "no-store" });

  if (response.ok) {
    return (await response.json()) as OpenExchangeRatesResponse;
  }

  // Fall back to latest rates if historical fetch fails
  if (date) {
    const fallback = await fetch(buildUrl(null), { cache: "no-store" });
    if (fallback.ok) {
      return (await fallback.json()) as OpenExchangeRatesResponse;
    }
  }

  throw new Error("Unable to fetch exchange rates from Open Exchange Rates.");
}

export function createOpenExchangeRatesProvider(): FxProvider {
  if (!process.env.OPEN_EXCHANGE_RATES_APP_ID) {
    throw new Error("OPEN_EXCHANGE_RATES_APP_ID env var is required.");
  }

  return {
    async getRate(from: SupportedCurrency, to: SupportedCurrency, date: Date): Promise<ExchangeRateResult> {
      const historicalDate = date.toISOString().slice(0, 10);
      const payload = await fetchRates(historicalDate);

      const fromRate = from === "USD" ? 1 : payload.rates[from];
      const toRate = to === "USD" ? 1 : payload.rates[to];

      if (!fromRate || !toRate) {
        throw new Error(`Exchange rate not available for ${from}/${to}.`);
      }

      return { rate: toRate / fromRate, rateDate: new Date(payload.timestamp * 1000) };
    },
  };
}
