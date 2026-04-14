import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

type CurrencySelectProps = {
  currencies: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
};

export function CurrencySelect({ currencies, value, onValueChange }: CurrencySelectProps) {
  const currencyItems = useMemo(
    () => currencies.map((c) => ({ value: c, label: c })),
    [currencies],
  );

  return (
    <div className="grid gap-1.5">
      <Label>Currency</Label>
      <SearchableSelect
        items={currencyItems}
        value={value}
        onValueChange={onValueChange}
        placeholder="Select currency"
        searchPlaceholder="Search currencies..."
      />
    </div>
  );
}
