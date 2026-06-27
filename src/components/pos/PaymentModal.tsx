"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cartStore";
import { X, CreditCard, Banknote, QrCode, ArrowRightLeft, Loader2, StickyNote } from "lucide-react";

interface PaymentModalProps {
  onClose: () => void;
  onPaymentSuccess: (order: any) => void;
}

export default function PaymentModal({ onClose, onPaymentSuccess }: PaymentModalProps) {
  const { cartItems, selectedCustomer, selectedDiscount, taxRate, getTotals, clearCart } = useCartStore();
  const { subtotal, discountValue, taxValue, total } = getTotals();

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "QR_CODE" | "BANK_TRANSFER">("CASH");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Set default amount paid based on payment method
  useEffect(() => {
    if (paymentMethod === "CASH") {
      setAmountPaid("");
      setTimeout(() => amountInputRef.current?.focus(), 100);
    } else {
      setAmountPaid(total.toFixed(2));
    }
  }, [paymentMethod, total]);

  const numAmountPaid = parseFloat(amountPaid) || 0;
  const change = Math.max(0, numAmountPaid - total);

  const handleQuickCash = (value: number) => {
    const current = parseFloat(amountPaid) || 0;
    setAmountPaid((current + value).toFixed(2));
  };

  const handleSetExactCash = () => {
    setAmountPaid(total.toFixed(2));
  };

  const handleCheckout = async () => {
    if (paymentMethod === "CASH" && numAmountPaid < total) {
      setError("Amount paid is less than the total checkout amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer?.id || null,
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal,
          discount: discountValue,
          tax: taxValue,
          total,
          paymentMethod,
          amountPaid: numAmountPaid,
          change,
          note,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      // Success: Clear cart, call callback to show receipt
      clearCart();
      onPaymentSuccess(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong during checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg flex flex-col max-h-[95vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">POS Payment Checkout</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Amount Due Summary */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl flex justify-between items-center">
            <span className="text-sm font-medium text-slate-500">Amount Due:</span>
            <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              ${total.toFixed(2)}
            </span>
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "CASH", label: "Cash", icon: Banknote },
                { id: "CARD", label: "Card Payment", icon: CreditCard },
                { id: "QR_CODE", label: "QR Scan", icon: QrCode },
                { id: "BANK_TRANSFER", label: "Bank Transfer", icon: ArrowRightLeft },
              ].map((method) => {
                const Icon = method.icon;
                const active = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`flex items-center gap-3 p-4 border rounded-xl font-semibold transition-all cursor-pointer ${
                      active
                        ? "bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-950/30 dark:border-indigo-500 dark:text-indigo-400"
                        : "border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={20} />
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Amount Paid and Change Calculator */}
          {paymentMethod === "CASH" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Amount Paid Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Cash Received ($)
                  </label>
                  <input
                    ref={amountInputRef}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-bold text-lg"
                  />
                </div>

                {/* Change Due Display */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Change Due ($)
                  </label>
                  <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-lg rounded-xl h-[52px] flex items-center">
                    ${change.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Quick Cash Actions
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSetExactCash}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Exact Cash
                  </button>
                  {[1, 5, 10, 20, 50, 100].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleQuickCash(val)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      +${val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <StickyNote size={14} />
              Add Order Note
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g. Table 5, extra bag, etc."
              className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Submit Transaction"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
