"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [form, setForm] = useState({
    storeName: "",
    storeAddress: "",
    storePhone: "",
    taxRate: "10",
    receiptHeader: "",
    receiptFooter: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setForm({
          storeName: data.storeName || "",
          storeAddress: data.storeAddress || "",
          storePhone: data.storePhone || "",
          taxRate: String(data.taxRate ?? 10),
          receiptHeader: data.receiptHeader || "",
          receiptFooter: data.receiptFooter || "",
        });
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const taxVal = parseFloat(form.taxRate);
    if (isNaN(taxVal) || taxVal < 0) {
      setMessage({ type: "error", text: "Tax rate must be a positive number" });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          taxRate: taxVal,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Store settings updated successfully!" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to update settings" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "An unexpected error occurred while saving." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <SettingsIcon size={24} className="text-indigo-600 dark:text-indigo-400" />
          Store & Tax Settings
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure store information and tax rates for invoice calculations</p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        {message && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${
            message.type === "success" 
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400"
              : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-450"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" size={18} /> : <AlertCircle className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-450" size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Store Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Store Name</label>
            <input 
              type="text" 
              required
              value={form.storeName}
              onChange={e => setForm(p => ({ ...p, storeName: e.target.value }))}
              placeholder="e.g. Coffee Shop POS"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Store Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Contact Phone</label>
            <input 
              type="text"
              value={form.storePhone}
              onChange={e => setForm(p => ({ ...p, storePhone: e.target.value }))}
              placeholder="e.g. 012 345 678"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Tax Rate */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Tax Rate (%)</label>
            <input 
              type="number"
              required
              min="0"
              step="0.1"
              value={form.taxRate}
              onChange={e => setForm(p => ({ ...p, taxRate: e.target.value }))}
              placeholder="10"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Store Address */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Store Address</label>
            <textarea 
              rows={2}
              value={form.storeAddress}
              onChange={e => setForm(p => ({ ...p, storeAddress: e.target.value }))}
              placeholder="e.g. Phnom Penh, Cambodia"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Receipt Header */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Receipt Header Message</label>
            <textarea 
              rows={2}
              value={form.receiptHeader}
              onChange={e => setForm(p => ({ ...p, receiptHeader: e.target.value }))}
              placeholder="e.g. Welcome to our store!"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Receipt Footer */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Receipt Footer Message</label>
            <textarea 
              rows={2}
              value={form.receiptFooter}
              onChange={e => setForm(p => ({ ...p, receiptFooter: e.target.value }))}
              placeholder="e.g. Please come again!"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save Store Settings
          </button>
        </div>
      </form>
    </div>
  );
}
