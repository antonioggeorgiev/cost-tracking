import { supportedCurrencies } from "@/lib/currency";
import type { FxProvider } from "./types";
import { createOpenExchangeRatesProvider } from "./providers/open-exchange-rates";

export type { FxProvider, ExchangeRateResult } from "./types";

function isSupportedCurrency(currency: string): currency is (typeof supportedCurrencies)[number] {
  return supportedCurrencies.includes(currency as (typeof supportedCurrencies)[number]);
}

function createProvider(): FxProvider {
  // Add new providers here as cases and switch via FX_PROVIDER env var.
  const providerName = process.env.FX_PROVIDER ?? "open-exchange-rates";

  switch (providerName) {
    case "open-exchange-rates":
      return createOpenExchangeRatesProvider();
    default:
      throw new Error(`Unknown FX provider: ${providerName}`);
  }
}

let _provider: FxProvider | null = null;
function getProvider(): FxProvider {
  if (!_provider) {
    _provider = createProvider();
  }
  return _provider;
}

export const fxService = {
  async getExchangeRateSnapshot(input: { fromCurrencyCode: string; toCurrencyCode: string; expenseDate: Date }) {
    if (!isSupportedCurrency(input.fromCurrencyCode) || !isSupportedCurrency(input.toCurrencyCode)) {
      throw new Error("Unsupported currency code.");
    }

    if (input.fromCurrencyCode === input.toCurrencyCode) {
      return { rate: 1, rateDate: input.expenseDate };
    }

    return getProvider().getRate(input.fromCurrencyCode, input.toCurrencyCode, input.expenseDate);
  },
};
