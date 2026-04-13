import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

const statusItems = [
  { value: "planned", label: "Planned" },
  { value: "pending", label: "Pending" },
  { value: "posted", label: "Posted" },
];

type StatusSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
};

export function StatusSelect({ value, onValueChange, label = "Status" }: StatusSelectProps) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <SearchableSelect
        items={statusItems}
        value={value}
        onValueChange={onValueChange}
        placeholder="Select status"
        searchPlaceholder="Search status..."
      />
    </div>
  );
}
