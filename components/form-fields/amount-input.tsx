import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AmountInputProps = {
  value: number | string;
  onChange: (value: number) => void;
  onBlur?: () => void;
  currencyBadge?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  id?: string;
  placeholder?: string;
};

export function AmountInput({
  value,
  onChange,
  onBlur,
  currencyBadge,
  required,
  disabled,
  error,
  label = "Amount",
  id = "amount",
  placeholder = "0.00",
}: AmountInputProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          min="0.01"
          step="0.01"
          value={value || ""}
          onChange={(e) => onChange(e.target.valueAsNumber || 0)}
          onBlur={onBlur}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className={currencyBadge ? "pr-16" : undefined}
        />
        {currencyBadge && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
            {currencyBadge}
          </span>
        )}
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
