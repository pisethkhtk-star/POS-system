"use client";

import { useState, useEffect } from "react";
import ProductGrid from "@/components/pos/ProductGrid";
import CartPanel from "@/components/pos/CartPanel";
import PaymentModal from "@/components/pos/PaymentModal";
import Receipt from "@/components/pos/Receipt";
import { useCartStore } from "@/store/cartStore";

export default function PosPage() {
  const { cartItems, clearCart, setTaxRate } = useCartStore();

  const [showPayment, setShowPayment] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [storeSettings, setStoreSettings] = useState<any>(null);

  // Load store settings (tax rate, name) on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setStoreSettings(data);
          if (data.taxRate !== undefined) {
            setTaxRate(Number(data.taxRate));
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    fetchSettings();
  }, [setTaxRate]);

  // Bind keyboard shortcuts: F1 = Reset Cart, F2 = Open Checkout, ESC = Close Checkout
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        clearCart();
      } else if (e.key === "F2") {
        e.preventDefault();
        if (cartItems.length > 0) {
          setShowPayment(true);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowPayment(false);
        setActiveOrder(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cartItems.length, clearCart]);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full min-h-0 bg-slate-50 dark:bg-slate-950 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      {/* Product Grid Panel (Left) */}
      <ProductGrid />

      {/* Cart Summary Panel (Right) */}
      <CartPanel onCheckoutClick={() => setShowPayment(true)} />

      {/* 1. Payment Modal Overlay */}
      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onPaymentSuccess={(order) => {
            setShowPayment(false);
            setActiveOrder(order);
          }}
        />
      )}

      {/* 2. Thermal Receipt Modal Overlay */}
      {activeOrder && (
        <Receipt
          order={activeOrder}
          settings={storeSettings}
          onClose={() => setActiveOrder(null)}
        />
      )}
    </div>
  );
}
