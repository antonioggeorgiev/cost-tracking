"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { DebtPaymentForm } from "@/components/debt/debt-payment-form";

type DebtAccountOption = {
  id: string;
  name: string;
  currencyCode: string;
  isActive: boolean;
  monthlyAmountMinor?: number | null;
  unpaidDueDates?: string[];
};

type DebtPaymentModalProps = {
  workspaceSlug: string;
  baseCurrencyCode: string;
  currencies: readonly string[];
  debtAccounts: DebtAccountOption[];
  createDebtPayment: (formData: FormData) => Promise<void>;
};

export function DebtPaymentModal({ workspaceSlug, baseCurrencyCode, currencies, debtAccounts, createDebtPayment }: DebtPaymentModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = searchParams.get("modal") === "record-payment";
  const defaultDebtId = searchParams.get("debtId") ?? undefined;
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  function close() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("modal");
    params.delete("debtId");
    const qs = params.toString();
    router.push(qs ? `?${qs}` : window.location.pathname);
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) close();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-[4px] lg:items-center lg:p-4"
    >
      <div className="w-full max-w-lg rounded-t-3xl bg-surface p-6 shadow-2xl lg:rounded-2xl lg:max-h-[90vh] lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-heading">Record Payment</h2>
            <p className="mt-1 text-sm text-body">Log a payment against a debt account</p>
          </div>
          <button onClick={close} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-secondary text-body">
            <X size={20} />
          </button>
        </div>

        <DebtPaymentForm
          workspaceSlug={workspaceSlug}
          baseCurrencyCode={baseCurrencyCode}
          currencies={currencies}
          debtAccounts={debtAccounts}
          createDebtPayment={createDebtPayment}
          defaultDebtAccountId={defaultDebtId}
          onSuccess={close}
        />
      </div>
    </div>
  );
}
