"use client";

import Link from "next/link";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/money";
import { routes } from "@/lib/routes";

type Expense = {
  id: string;
  title: string;
  categoryPath: string;
  expenseDate: string | Date;
  createdAt: string | Date;
  originalAmountMinor: number;
  originalCurrencyCode: string;
  workspaceAmountMinor: number;
  workspaceCurrencyCode: string;
  status: string;
};

type RecentExpensesTableProps = {
  expenses: Expense[];
  spaceSlug: string;
};

const columnHelper = createColumnHelper<Expense>();

const columns = [
  columnHelper.accessor("title", {
    header: "Description",
    cell: (info) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-heading">{info.getValue()}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{info.row.original.categoryPath}</p>
      </div>
    ),
  }),
  columnHelper.accessor("expenseDate", {
    header: "Date",
    cell: (info) => (
      <span className="text-sm text-body">
        {new Date(info.getValue()).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>
    ),
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => (
      <span className="text-sm text-body">
        {new Date(info.getValue()).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>
    ),
  }),
  columnHelper.accessor("workspaceAmountMinor", {
    header: "Amount",
    cell: (info) => (
      <div className="text-right">
        <p className="font-medium text-heading">
          {formatMoney(info.getValue(), info.row.original.workspaceCurrencyCode)}
        </p>
      </div>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <div className="text-right">
        <StatusBadge status={info.getValue()} />
      </div>
    ),
  }),
];

export function RecentExpensesTable({ expenses, spaceSlug }: RecentExpensesTableProps) {
  const table = useReactTable({
    data: expenses,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="font-heading text-base font-semibold text-heading">Recent Expenses</h2>
        <Link
          href={routes.expenses}
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {/* Table header (desktop) */}
      <div className="hidden border-t border-border px-6 py-3 sm:grid sm:grid-cols-[1fr_100px_100px_120px_80px] sm:gap-4">
        {table.getHeaderGroups().map((headerGroup) =>
          headerGroup.headers.map((header) => (
            <span
              key={header.id}
              className={`text-xs font-semibold uppercase tracking-widest text-muted-foreground ${
                header.id === "workspaceAmountMinor" || header.id === "status" ? "text-right" : ""
              }`}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </span>
          ))
        )}
      </div>

      {table.getRowModel().rows.length > 0 ? (
        <div className="divide-y divide-border border-t border-border">
          {table.getRowModel().rows.map((row) => (
            <Link
              key={row.id}
              href={routes.expense(row.original.id)}
              className="block px-6 py-3.5 transition hover:bg-surface-secondary sm:grid sm:grid-cols-[1fr_100px_100px_120px_80px] sm:items-center sm:gap-4"
            >
              {row.getVisibleCells().map((cell) => (
                <div key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </Link>
          ))}
        </div>
      ) : (
        <div className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
          No expenses yet. Add your first expense above.
        </div>
      )}
    </section>
  );
}
