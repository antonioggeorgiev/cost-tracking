import { Search } from "lucide-react";

type Props = {
  defaultValue: string;
  placeholder: string;
};

export function AdminSearchForm({ defaultValue, placeholder }: Props) {
  return (
    <form className="relative max-w-md">
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-body" />
      <input
        name="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface pl-11 pr-4 py-3 text-sm text-heading outline-none placeholder:text-body focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
    </form>
  );
}
