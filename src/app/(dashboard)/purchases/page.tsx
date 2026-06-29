"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PackageCheck, Search, Plus, X, Loader2, Warehouse, Truck, ShoppingBag
} from "lucide-react";

interface Supplier { id: number; name: string; }
interface Product { id: number; name: string; code: string; cost: number; stock: number; }
interface PurchaseItem { id: number; product: Product; quantity: number; cost: number; subtotal: number; }
interface Purchase {
  id: number; reference: string; totalAmount: number; note: string;
  createdAt: string; supplier: Supplier; user: { name: string };
  items: PurchaseItem[];
}

interface NewPurchaseItem {
  productId: string;
  quantity: string;
  cost: string;
  product?: Product; // for UI display
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<NewPurchaseItem[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
      fetch("/api/purchases"),
      fetch("/api/suppliers"),
      fetch("/api/products")
    ]);
    if (purchasesRes.ok) setPurchases(await purchasesRes.json());
    if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
    if (productsRes.ok) setProducts(await productsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredPurchases = purchases.filter(p => 
    p.reference.toLowerCase().includes(query.toLowerCase()) || 
    p.supplier.name.toLowerCase().includes(query.toLowerCase())
  );

  const openAdd = () => {
    setSupplierId("");
    setNote("");
    setItems([{ productId: "", quantity: "1", cost: "0" }]);
    setError("");
    setShowModal(true);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId,
      cost: product ? String(product.cost) : "0",
      product
    };
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof NewPurchaseItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItemRow = () => setItems([...items, { productId: "", quantity: "1", cost: "0" }]);
  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const totalCost = items.reduce((sum, item) => sum + (parseFloat(item.cost) || 0) * (parseInt(item.quantity) || 0), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate
    if (!supplierId) return setError("Please select a supplier");
    if (items.some(i => !i.productId || parseInt(i.quantity) <= 0 || parseFloat(i.cost) < 0)) {
      return setError("Please fill all item fields correctly");
    }

    setSaving(true);
    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId, note, items }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to save purchase");
      setSaving(false);
      return;
    }
    
    setShowModal(false);
    fetchData();
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PackageCheck size={24} className="text-indigo-600 dark:text-indigo-400" />
            Purchases & Receiving
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage stock purchases from suppliers</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer">
          <Plus size={16} /> New Purchase
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Search by PO Reference or Supplier..." value={query} onChange={e => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
        ) : purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <Warehouse size={36} className="opacity-40" /><p>No purchases recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  {["Reference", "Supplier", "Items", "Total Amount", "Note", "By", "Date"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPurchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">{p.reference}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2"><Truck size={14} className="text-slate-400"/> {p.supplier.name}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {p.items.reduce((s, i) => s + i.quantity, 0)} items ({p.items.length} types)
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">${Number(p.totalAmount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{p.note || "-"}</td>
                    <td className="px-4 py-3 text-slate-500">{p.user.name}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShoppingBag size={18} className="text-indigo-500" /> Receive New Stock
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><X size={18} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="purchaseForm" onSubmit={handleSave} className="space-y-6">
                {error && <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-xl text-sm">{error}</div>}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier</label>
                    <select value={supplierId} onChange={e => setSupplierId(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Note (Optional)</label>
                    <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="PO-12345 or comments" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-bold text-slate-900 dark:text-slate-100">Order Items</label>
                    <button type="button" onClick={addItemRow} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"><Plus size={12}/> Add Item</button>
                  </div>
                  
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start bg-slate-50 dark:bg-slate-950/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <div className="flex-1">
                          <select value={item.productId} onChange={e => handleProductSelect(index, e.target.value)} required className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
                            <option value="">Select Product...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                          </select>
                        </div>
                        <div className="w-24">
                          <input type="number" min="1" required placeholder="Qty" value={item.quantity} onChange={e => updateItem(index, "quantity", e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
                        </div>
                        <div className="w-32">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                            <input type="number" min="0" step="0.01" required placeholder="Cost" value={item.cost} onChange={e => updateItem(index, "cost", e.target.value)} className="w-full pl-7 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
                          </div>
                        </div>
                        <div className="w-32 py-2 text-right font-semibold text-slate-700 dark:text-slate-300 text-sm shrink-0">
                          ${((parseInt(item.quantity) || 0) * (parseFloat(item.cost) || 0)).toFixed(2)}
                        </div>
                        <button type="button" onClick={() => removeItemRow(index)} disabled={items.length === 1} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg disabled:opacity-30 cursor-pointer"><X size={16}/></button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Total Purchase Value</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">${totalCost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
              <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">Cancel</button>
              <button type="submit" form="purchaseForm" disabled={saving || !supplierId || items.some(i => !i.productId)} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer transition-colors">
                {saving && <Loader2 size={14} className="animate-spin" />} Confirm Receipt & Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
