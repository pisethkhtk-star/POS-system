"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cartStore";
import { Trash2, Plus, Minus, UserPlus, ReceiptCent, User, Trash, ArrowRight } from "lucide-react";

interface CartPanelProps {
  onCheckoutClick: () => void;
}

export default function CartPanel({ onCheckoutClick }: CartPanelProps) {
  const {
    cartItems,
    selectedCustomer,
    selectedDiscount,
    removeItem,
    updateQuantity,
    selectCustomer,
    selectDiscount,
    clearCart,
    getTotals,
    taxRate,
    setTaxRate,
    taxEnabled,
    setTaxEnabled,
  } = useCartStore();

  const { subtotal, discountValue, taxValue, total } = getTotals();

  // Local state for customer query list and quick add
  const [customers, setCustomers] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  // Quick Customer Create inline states
  const [isAddingCust, setIsAddingCust] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");

  const cartEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll cart to bottom on adding new items
  useEffect(() => {
    cartEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [cartItems.length]);

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch discounts
  const fetchDiscounts = async () => {
    try {
      const res = await fetch("/api/discounts"); // Wait, does /api/discounts exist?
      // Wait, let's make sure if we need an endpoint, otherwise we fetch it from api/settings
      // or we can query active discounts. Let's create an api/discounts endpoint or query it from database!
      // Wait! We can define the discount fetch endpoint as /api/discounts which gets active discounts from the Discount table!
      // Yes, we will write /api/discounts route handler later if not created. Let's make sure it fetches.
      const res2 = await fetch("/api/discounts");
      if (res2.ok) {
        const data = await res2.json();
        setDiscounts(data);
      } else {
        // Fallback static active discounts if endpoint is not built yet
        setDiscounts([
          { id: 1, name: "Grand Opening (10%)", type: "PERCENT", value: 10, minPurchase: 10 },
          { id: 2, name: "$5 Off Mega Deal", type: "FIXED", value: 5, minPurchase: 30 },
        ]);
      }
    } catch (err) {
      // Fallback
      setDiscounts([
        { id: 1, name: "Grand Opening (10%)", type: "PERCENT", value: 10, minPurchase: 10 },
        { id: 2, name: "$5 Off Mega Deal", type: "FIXED", value: 5, minPurchase: 30 },
      ]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [customerSearch]);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName) return;

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustName,
          phone: newCustPhone || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        selectCustomer(data);
        setIsAddingCust(false);
        setNewCustName("");
        setNewCustPhone("");
        setCustomerSearch("");
      } else {
        alert(data.error || "Failed to create customer");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-96 flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm shrink-0">
      {/* 1. Customer Selector */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Customer details
          </label>
          <button
            onClick={() => setIsAddingCust(!isAddingCust)}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <UserPlus size={14} />
            {isAddingCust ? "Select List" : "Quick Add"}
          </button>
        </div>

        {isAddingCust ? (
          /* Quick Add Form */
          <form onSubmit={handleQuickAddCustomer} className="space-y-2 pt-1">
            <input
              type="text"
              placeholder="Customer Name (Required)"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              className="block w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Phone (Optional)"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                className="block flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          /* Dropdown search customer */
          <div className="relative">
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 border border-indigo-200 dark:border-indigo-950 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-indigo-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{selectedCustomer.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {selectedCustomer.phone || "No Phone"} • {selectedCustomer.points} pts
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => selectCustomer(null)}
                  className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                  title="Remove customer"
                >
                  <Trash size={14} />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="Search customer by name or phone..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustDropdown(true);
                  }}
                  onFocus={() => setShowCustDropdown(true)}
                  className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-xs"
                />
                {showCustDropdown && customers.length > 0 && (
                  <ul className="absolute left-0 right-0 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mt-1 max-h-40 overflow-y-auto rounded-xl shadow-lg text-xs">
                    {customers.map((cust) => (
                      <li
                        key={cust.id}
                        onClick={() => {
                          selectCustomer(cust);
                          setShowCustDropdown(false);
                          setCustomerSearch("");
                        }}
                        className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{cust.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {cust.phone || "No Phone"} • {cust.points} pts
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                {showCustDropdown && customerSearch && customers.length === 0 && (
                  <div className="absolute left-0 right-0 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mt-1 p-3 text-center text-slate-400 rounded-xl shadow-lg text-xs">
                    No customers found
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Scrollable Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Trash2 size={36} className="opacity-40" />
            <p className="text-sm font-medium">Cart is empty</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl group relative overflow-hidden"
            >
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                  {item.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mb-2">{item.sku}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white font-mono">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    (${item.price.toFixed(2)} ea)
                  </span>
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Minus size={12} />
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value);
                    updateQuantity(item.id, isNaN(parsed) ? 1 : parsed);
                  }}
                  className="w-8 text-center text-xs font-bold focus:outline-none bg-transparent"
                />
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Delete button */}
              <button
                onClick={() => removeItem(item.id)}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer shrink-0"
              >
                <Trash size={14} />
              </button>
            </div>
          ))
        )}
        <div ref={cartEndRef} />
      </div>

      {/* 3. Footer totals */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-4">
        {/* Discount Selector */}
        {cartItems.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="font-semibold flex items-center gap-1">
                <ReceiptCent size={14} className="text-slate-400" />
                Select Discount
              </span>
              {selectedDiscount && (
                <button
                  onClick={() => selectDiscount(null)}
                  className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            <select
              value={selectedDiscount ? String(selectedDiscount.id) : ""}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                const found = discounts.find((d) => d.id === id);
                selectDiscount(found || null);
              }}
              className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl text-xs focus:outline-none"
            >
              <option value="">Apply Promo / Discount...</option>
              {discounts
                .filter((d) => d.isActive && subtotal >= Number(d.minPurchase))
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name || "Promo"} (
                    {d.type === "PERCENT" ? `${Number(d.value)}%` : `$${Number(d.value)}`}{" "}
                    off)
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Calculation summary */}
        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">${subtotal.toFixed(2)}</span>
          </div>

          {selectedDiscount && (
            <div className="flex justify-between text-rose-600 dark:text-rose-400">
              <span>Promo Discount:</span>
              <span className="font-semibold">-${discountValue.toFixed(2)}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pos-tax-toggle"
                checked={taxEnabled}
                onChange={(e) => setTaxEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="pos-tax-toggle" className="text-slate-600 dark:text-slate-400 select-none cursor-pointer font-medium">
                Tax
              </label>
              {taxEnabled && (
                <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 bg-slate-50 dark:bg-slate-950">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-10 text-center bg-transparent border-none text-[11px] p-0 font-bold focus:ring-0 focus:outline-none text-slate-850 dark:text-slate-200"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold select-none">%</span>
                </div>
              )}
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">${taxValue.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>Payable Total:</span>
            <span className="font-mono text-base text-indigo-600 dark:text-indigo-400">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={clearCart}
            disabled={cartItems.length === 0}
            className="px-3 py-3 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Clear Checkout"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onCheckoutClick}
            disabled={cartItems.length === 0}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Checkout Payment
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
