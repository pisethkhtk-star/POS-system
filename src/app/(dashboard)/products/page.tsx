"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag, Search, Plus, Pencil, Trash2, X,
  AlertTriangle, ChevronDown, Package, Loader2
} from "lucide-react";

interface Category { id: number; name: string; icon?: string; }
interface Product {
  id: number; name: string; sku: string;
  price: number; cost: number; stock: number; minStock: number;
  image?: string; categoryId: number;
  category: Category;
}

const emptyForm = { name: "", sku: "", price: "", cost: "", stock: "", minStock: "5", image: "", categoryId: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
    const res = await fetch(`/api/products?${params}`);
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }, [query, categoryFilter]);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
  };

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setImageFile(null); setError(""); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setImageFile(null);
    setForm({ name: p.name, sku: p.sku, price: String(p.price), cost: String(p.cost), stock: String(p.stock), minStock: String(p.minStock), image: p.image || "", categoryId: String(p.categoryId) });
    setError(""); setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    
    try {
      let imageUrl = form.image;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) { setError(uploadData.error || "Failed to upload image"); setSaving(false); return; }
        imageUrl = uploadData.url;
      }

      const url = editing ? `/api/products/${editing.id}` : "/api/products";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, image: imageUrl, price: parseFloat(form.price), cost: parseFloat(form.cost), stock: parseInt(form.stock), minStock: parseInt(form.minStock), categoryId: parseInt(form.categoryId) }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); setSaving(false); return; }
      setShowModal(false); fetchProducts(); setSaving(false);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingBag size={24} className="text-indigo-600 dark:text-indigo-400" />
            Products
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{products.length} products in catalog</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by name or SKU..." value={query} onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
        </div>
        <div className="relative">
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl text-sm focus:outline-none cursor-pointer">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <Package size={36} className="opacity-40" /><p>No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  {["Product", "SKU", "Category", "Price", "Cost", "Stock", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-xs">{p.sku}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">{p.category.name}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">${Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-500">${Number(p.cost).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${p.stock <= p.minStock ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"}`}>
                        {p.stock <= p.minStock && <AlertTriangle size={10} />} {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-slate-100">{editing ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-xl text-sm">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                {[{ label: "Product Name", key: "name", type: "text", full: true }, { label: "SKU", key: "sku", type: "text" }, { label: "Category", key: "categoryId", type: "select" }, { label: "Price ($)", key: "price", type: "number" }, { label: "Cost ($)", key: "cost", type: "number" }, { label: "Stock", key: "stock", type: "number" }, { label: "Min Stock", key: "minStock", type: "number" }, { label: "Product Image", key: "image", type: "file", full: true }].map(f => (
                  <div key={f.key} className={f.full ? "col-span-2" : ""}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{f.label}</label>
                    {f.type === "select" ? (
                      <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} required
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
                        <option value="">Select category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    ) : f.type === "file" ? (
                      <input type="file" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setImageFile(file);
                      }}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
                    ) : (
                      <input type={f.type} required={f.key !== "image"} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} step={f.type === "number" ? "0.01" : undefined}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer transition-colors">
                  {saving && <Loader2 size={14} className="animate-spin" />} {editing ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
