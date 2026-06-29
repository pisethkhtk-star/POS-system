"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  Shield,
  LayoutDashboard,
  Calculator,
  ShoppingBag,
  Tags,
  Ticket,
  Warehouse,
  PackageCheck,
  Truck,
  Users,
  ClipboardList,
  BarChart3,
  UserCog,
  Settings as SettingsIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  RotateCcw,
} from "lucide-react";

// List of all pages with metadata for nice rendering
const AVAILABLE_PAGES = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, description: "Main overview, statistics, and sales charts" },
  { name: "POS Terminal", href: "/pos", icon: Calculator, description: "Point of Sale interface for transaction checkouts" },
  { name: "Products", href: "/products", icon: ShoppingBag, description: "Manage product listings, pricing, and stock" },
  { name: "Categories", href: "/categories", icon: Tags, description: "Organize items into distinct product groups" },
  { name: "Discounts", href: "/discounts", icon: Ticket, description: "Create discount codes and promotional campaigns" },
  { name: "Inventory", href: "/inventory", icon: Warehouse, description: "Track stock quantities and inventory movements" },
  { name: "Purchases", href: "/purchases", icon: PackageCheck, description: "Record stock purchases and intake logs" },
  { name: "Suppliers", href: "/suppliers", icon: Truck, description: "Manage supplier directory and contact details" },
  { name: "Customers", href: "/customers", icon: Users, description: "View client records and customer loyalty points" },
  { name: "Orders", href: "/orders", icon: ClipboardList, description: "View transaction histories and print invoices" },
  { name: "Reports", href: "/reports", icon: BarChart3, description: "Generate sales dashboards and reports" },
  { name: "Users", href: "/users", icon: UserCog, description: "Manage user accounts, roles, and credentials" },
  { name: "Role Permissions", href: "/roles", icon: Shield, description: "Configure page access permissions for each role" },
  { name: "Settings", href: "/settings", icon: SettingsIcon, description: "System variables and configurations" },
];

const ROLES = ["ADMIN", "MANAGER", "CASHIER"] as const;
type RoleType = typeof ROLES[number];

export default function RolePermissionsPage() {
  const { user, checkSession } = useAuthStore();
  const router = useRouter();

  const [permissions, setPermissions] = useState<Record<RoleType, string[]>>({
    ADMIN: [],
    MANAGER: [],
    CASHIER: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchPermissions();
    } else if (user && user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [user, router]);

  const fetchPermissions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/roles");
      if (!res.ok) {
        if (res.status === 403) {
          router.replace("/");
          return;
        }
        throw new Error("Failed to fetch permissions from database");
      }
      const data = await res.json();

      const permMap: Record<RoleType, string[]> = {
        ADMIN: [],
        MANAGER: [],
        CASHIER: [],
      };

      data.forEach((item: { role: RoleType; pages: string[] }) => {
        if (permMap[item.role] !== undefined) {
          permMap[item.role] = item.pages;
        }
      });

      // Populate default configs as backup if data does not exist
      if (permMap.ADMIN.length === 0) {
        permMap.ADMIN = AVAILABLE_PAGES.map((p) => p.href);
      }
      if (permMap.MANAGER.length === 0) {
        permMap.MANAGER = ["/", "/pos", "/products", "/categories", "/discounts", "/inventory", "/purchases", "/suppliers", "/customers", "/orders"];
      }
      if (permMap.CASHIER.length === 0) {
        permMap.CASHIER = ["/pos"];
      }

      setPermissions(permMap);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading permissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (role: RoleType, href: string) => {
    if (role === "ADMIN") return; // Admin remains full access for safety

    setPermissions((prev) => {
      const currentPages = prev[role] || [];
      const updatedPages = currentPages.includes(href)
        ? currentPages.filter((p) => p !== href)
        : [...currentPages, href];
      return {
        ...prev,
        [role]: updatedPages,
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError("");
    try {
      for (const role of ROLES) {
        const res = await fetch("/api/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, pages: permissions[role] }),
        });
        if (!res.ok) {
          throw new Error(`Failed to save permissions for ${role}`);
        }
      }

      setSuccess(true);
      // Synchronize client-side authStore session state to instantly update sidebar
      await checkSession();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all roles to recommended system default permissions?")) {
      setPermissions({
        ADMIN: AVAILABLE_PAGES.map((p) => p.href),
        MANAGER: ["/", "/pos", "/products", "/categories", "/discounts", "/inventory", "/purchases", "/suppliers", "/customers", "/orders"],
        CASHIER: ["/pos"],
      });
    }
  };

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Shield size={26} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
            Role & Permissions Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Dynamically tick checkboxes to specify which navigation pages each user role is permitted to use.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            disabled={loading || saving}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-950 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={16} /> Reset Default
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none hover:shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving Changes..." : "Save Permissions"}
          </button>
        </div>
      </div>

      {/* Info notification */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/55 dark:border-amber-900/40 rounded-2xl flex items-start gap-3">
        <Shield size={18} className="text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-400">Security & Lockout Prevention</h4>
          <p className="text-xs text-amber-700/90 dark:text-amber-500/90 mt-0.5 leading-relaxed">
            For system integrity, <strong>ADMIN</strong> permissions are read-only and permanently granted to all modules. 
            Adjusting configurations for other roles takes effect immediately across all active browser sessions without requiring page logouts.
          </p>
        </div>
      </div>

      {/* Status Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/45 rounded-2xl flex items-center gap-2.5 text-rose-800 dark:text-rose-400 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/45 rounded-2xl flex items-center gap-2.5 text-emerald-800 dark:text-emerald-400 text-sm shadow-sm transition-all animate-bounce">
          <CheckCircle size={18} className="shrink-0" />
          <p>Permissions successfully saved and applied to active sessions!</p>
        </div>
      )}

      {/* Main Configuration Card Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3 text-slate-400">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
            <p className="text-sm">Fetching permission matrices...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50">
                  <th className="px-6 py-4.5 font-semibold text-slate-700 dark:text-slate-300 w-1/3">Application Module</th>
                  <th className="px-6 py-4.5 font-semibold text-slate-700 dark:text-slate-300 text-center w-1/6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      ADMIN
                    </span>
                  </th>
                  <th className="px-6 py-4.5 font-semibold text-slate-700 dark:text-slate-300 text-center w-1/6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      MANAGER
                    </span>
                  </th>
                  <th className="px-6 py-4.5 font-semibold text-slate-700 dark:text-slate-300 text-center w-1/6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                      CASHIER
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {AVAILABLE_PAGES.map((page) => {
                  const PageIcon = page.icon;
                  return (
                    <tr
                      key={page.href}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 shrink-0 mt-0.5">
                            <PageIcon size={18} />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-850 dark:text-slate-200">{page.name}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{page.description}</div>
                            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-600 mt-1">{page.href}</div>
                          </div>
                        </div>
                      </td>

                      {/* ADMIN COLUMN (Locked to true) */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <label className="relative flex items-center justify-center cursor-not-allowed">
                            <input
                              type="checkbox"
                              checked={true}
                              disabled={true}
                              className="w-5 h-5 accent-indigo-600 rounded border-slate-300 dark:border-slate-700 bg-slate-100 text-slate-400 opacity-60 pointer-events-none"
                              aria-label={`Admin access for ${page.name}`}
                            />
                          </label>
                        </div>
                      </td>

                      {/* MANAGER COLUMN */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <label className="relative flex items-center justify-center cursor-pointer p-2">
                            <input
                              type="checkbox"
                              checked={permissions.MANAGER?.includes(page.href) || false}
                              onChange={() => handleToggle("MANAGER", page.href)}
                              disabled={saving}
                              className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-indigo-600 accent-indigo-600 dark:accent-indigo-500 focus:ring-indigo-500 focus:ring-offset-2 hover:border-slate-400 dark:hover:border-slate-500 cursor-pointer disabled:opacity-50"
                              aria-label={`Manager access for ${page.name}`}
                            />
                          </label>
                        </div>
                      </td>

                      {/* CASHIER COLUMN */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <label className="relative flex items-center justify-center cursor-pointer p-2">
                            <input
                              type="checkbox"
                              checked={permissions.CASHIER?.includes(page.href) || false}
                              onChange={() => handleToggle("CASHIER", page.href)}
                              disabled={saving}
                              className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-indigo-600 accent-indigo-600 dark:accent-indigo-500 focus:ring-indigo-500 focus:ring-offset-2 hover:border-slate-400 dark:hover:border-slate-500 cursor-pointer disabled:opacity-50"
                              aria-label={`Cashier access for ${page.name}`}
                            />
                          </label>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Footer action buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={handleResetDefaults}
          disabled={loading || saving}
          className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-950 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset defaults
        </button>
        <button
          onClick={handleSave}
          disabled={loading || saving}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none hover:shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving Changes..." : "Save Permissions"}
        </button>
      </div>
    </div>
  );
}
