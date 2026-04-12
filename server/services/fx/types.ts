import type { SupportedCurrency } from "@/lib/currency";

export type ExchangeRateResult = {
  rate: number;
  rateDate: Date;
};

export interface FxProvider {
  /** Fetch the exchange rate to convert 1 unit of `from` into `to` on the given date. */
  getRate(from: SupportedCurrency, to: SupportedCurrency, date: Date): Promise<ExchangeRateResult>;
}
