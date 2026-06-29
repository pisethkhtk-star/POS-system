"use client";

import { useState, useEffect, useCallback } from "react";
import { Warehouse, Search, Plus, RefreshCw, ArrowUp, ArrowDown, SlidersHorizontal, Loader2, X } from "lucide-react";

interface InventoryLog {
  id: number;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  beforeQty: number | null;
  afterQty: number | null;
  note: string | null;
  createdAt: string;
  product: { name: string; code: string; stock: number };
  user: { name: string } | null;
}

interface Product { id: number; name: string; code: string; stock: number; minStock: number; }

const typeBadge: Record<string, string> = {
  IN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  OUT: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
  ADJUST: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
};

export default function InventoryPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ productId: "", type: "IN", quantity: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/inventory");
    if (res.ok) setLogs(await res.json());
    setLoading(false);
  }, []);

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    if (res.ok) setProducts(await res.json());
  };

  useEffect(() => { fetchLogs(); fetchProducts(); }, [fetchLogs]);

  const filtered = logs.filter(l =>
    l.product.name.toLowerCase().includes(search.toLowerCase()) ||
    l.product.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantity: parseInt(form.quantity) }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); setSaving(false); return; }
    setShowModal(false);
    setForm({ productId: "", type: "IN", quantity: "", note: "" });
    fetchLogs(); fetchProducts();
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Warehouse size={24} className="text-indigo-600 dark:text-indigo-400" />
            Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{logs.length} stock movement records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchLogs} className="p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => { setError(""); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer">
            <Plus size={16} /> Adjust Stock
          </button>
        </div>
      </div>

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Products", value: products.length, icon: SlidersHorizontal, color: "indigo" },
          { label: "Low Stock Items", value: products.filter(p => p.stock <= p.minStock).length, icon: ArrowDown, color: "rose" },
          { label: "Total IN Today", value: logs.filter(l => l.type === "IN" && new Date(l.createdAt).toDateString() === new Date().toDateString()).reduce((s, l) => s + l.quantity, 0), icon: ArrowUp, color: "emerald" },
          { label: "Total OUT Today", value: logs.filter(l => l.type === "OUT" && new Date(l.createdAt).toDateString() === new Date().toDateString()).reduce((s, l) => s + l.quantity, 0), icon: ArrowDown, color: "amber" },
        ].map(s => {
          const Icon = s.icon;
          const colors: Record<string, string> = { indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400", rose: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400", emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400", amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400" };
          return (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 shadow-sm">
              <div className={`p-2.5 rounded-xl ${colors[s.color]}`}><Icon size={18} /></div>
              <div><p className="text-xs text-slate-500">{s.label}</p><p className="text-xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p></div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Filter by product name/code..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  {["Product", "Code", "Type", "Qty", "Before", "After", "Note", "By", "Date"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{log.product.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-xs">{log.product.code}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${typeBadge[log.type]}`}>{log.type}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{log.quantity}</td>
                    <td className="px-4 py-3 text-slate-500">{log.beforeQty ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-500">{log.afterQty ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{log.note || "-"}</td>
                    <td className="px-4 py-3 text-slate-500">{log.user?.name || "System"}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
                <Warehouse size={28} className="opacity-40" /><p className="text-sm">No inventory logs</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Adjust Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Adjust Stock</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleAdjust} className="p-6 space-y-4">
              {error && <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-xl text-sm">{error}</div>}
              {[{ label: "Product", key: "productId", type: "select" }, { label: "Type", key: "type", type: "typeSelect" }, { label: "Quantity", key: "quantity", type: "number" }, { label: "Note", key: "note", type: "text" }].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{f.label}</label>
                  {f.type === "select" ? (
                    <select value={form.productId} onChange={e => setForm(p => ({ ...p, productId: e.target.value }))} required className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none">
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                    </select>
                  ) : f.type === "typeSelect" ? (
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none">
                      <option value="IN">IN — Stock Received</option>
                      <option value="OUT">OUT — Stock Removed</option>
                      <option value="ADJUST">ADJUST — Manual Correction</option>
                    </select>
                  ) : (
                    <input type={f.type} required={f.key !== "note"} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} min={f.type === "number" ? 1 : undefined}
                      className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none" />
                  )}
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer transition-colors">
                  {saving && <Loader2 size={14} className="animate-spin" />} Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
