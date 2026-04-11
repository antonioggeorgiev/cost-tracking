export function toMinorUnits(amount: number) {
  return Math.round(amount * 100);
}

export function formatMoney(amountMinor: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amountMinor / 100);
}
