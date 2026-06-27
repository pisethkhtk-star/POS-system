"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Search, ChevronDown, Eye, X, Loader2, Package } from "lucide-react";

interface OrderItem { id: number; quantity: number; price: number; subtotal: number; product: { name: string; sku: string }; }
interface Order {
  id: number; orderNumber: string; status: string;
  subtotal: number; discount: number; tax: number; total: number;
  paymentMethod: string; amountPaid: number; change: number;
  note?: string; createdAt: string;
  customer: { name: string; phone?: string } | null;
  user: { name: string };
  items: OrderItem[];
}

const statusColors: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  REFUNDED: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
  CANCELLED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const res = await fetch(`/api/orders?${params}`);
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, [search, statusFilter, startDate, endDate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const totalRevenue = orders.filter(o => o.status === "COMPLETED").reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList size={24} className="text-indigo-600 dark:text-indigo-400" />
            Orders
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{orders.length} orders · Revenue: ${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search order # or customer..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl text-sm focus:outline-none cursor-pointer">
            {["ALL", "COMPLETED", "PENDING", "REFUNDED", "CANCELLED"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl text-sm focus:outline-none" />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl text-sm focus:outline-none" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <Package size={36} className="opacity-40" /><p>No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  {["Order #", "Customer", "Cashier", "Payment", "Items", "Total", "Status", "Date", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400 text-xs">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{o.customer?.name || <span className="text-slate-400">Walk-in</span>}</td>
                    <td className="px-4 py-3 text-slate-500">{o.user.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium">{o.paymentMethod.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{o.items.length}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">${Number(o.total).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[o.status] || ""}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(o)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><Eye size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 font-mono">{selected.orderNumber}</h2>
                <p className="text-xs text-slate-400">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[{ l: "Customer", v: selected.customer?.name || "Walk-in" }, { l: "Cashier", v: selected.user.name }, { l: "Payment", v: selected.paymentMethod.replace("_", " ") }, { l: "Status", v: selected.status }].map(row => (
                  <div key={row.l}><p className="text-xs text-slate-400">{row.l}</p><p className="font-semibold text-slate-800 dark:text-slate-200">{row.v}</p></div>
                ))}
              </div>
              {/* Items */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                      {["Product", "Qty", "Price", "Subtotal"].map(h => <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selected.items.map(item => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{item.product.name}</td>
                        <td className="px-3 py-2 text-slate-500">{item.quantity}</td>
                        <td className="px-3 py-2 text-slate-500">${Number(item.price).toFixed(2)}</td>
                        <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-200">${Number(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Totals */}
              <div className="space-y-1 text-sm border-t border-slate-200 dark:border-slate-800 pt-3">
                {[{ l: "Subtotal", v: `$${Number(selected.subtotal).toFixed(2)}` }, { l: "Discount", v: `-$${Number(selected.discount).toFixed(2)}` }, { l: "Tax", v: `$${Number(selected.tax).toFixed(2)}` }].map(r => (
                  <div key={r.l} className="flex justify-between text-slate-500"><span>{r.l}</span><span>{r.v}</span></div>
                ))}
                <div className="flex justify-between font-bold text-base text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>Total</span><span className="text-indigo-600 dark:text-indigo-400">${Number(selected.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500"><span>Paid</span><span>${Number(selected.amountPaid).toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-500"><span>Change</span><span>${Number(selected.change).toFixed(2)}</span></div>
              </div>
              {selected.note && <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs text-slate-500"><span className="font-semibold">Note: </span>{selected.note}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
