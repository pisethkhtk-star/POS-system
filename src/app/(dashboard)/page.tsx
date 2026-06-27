"use client";

import { useAuthStore } from "@/store/authStore";
import {
  ShoppingBag,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";

const stats = [
  {
    label: "Today's Revenue",
    value: "$4,280",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "indigo",
  },
  {
    label: "Orders Today",
    value: "38",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingBag,
    color: "emerald",
  },
  {
    label: "Total Customers",
    value: "1,243",
    change: "+3.1%",
    trend: "up",
    icon: Users,
    color: "violet",
  },
  {
    label: "Low Stock Items",
    value: "7",
    change: "-2",
    trend: "down",
    icon: AlertTriangle,
    color: "amber",
  },
];

const recentOrders = [
  { id: "#ORD-0038", customer: "Sophea Keo", amount: "$128.50", status: "COMPLETED", time: "2 min ago" },
  { id: "#ORD-0037", customer: "Walk-in", amount: "$45.00", status: "COMPLETED", time: "15 min ago" },
  { id: "#ORD-0036", customer: "Dara Mao", amount: "$210.75", status: "COMPLETED", time: "32 min ago" },
  { id: "#ORD-0035", customer: "Walk-in", amount: "$32.00", status: "REFUNDED", time: "1 hr ago" },
  { id: "#ORD-0034", customer: "Sreymom Chan", amount: "$95.25", status: "COMPLETED", time: "2 hr ago" },
];

const colorMap: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`p-2.5 rounded-xl ${colorMap[stat.color]}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {stat.value}
                </p>
                <p
                  className={`text-xs font-medium mt-1 flex items-center gap-1 ${
                    stat.trend === "up"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  {stat.change} vs yesterday
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              Recent Orders
            </h2>
          </div>
          <a
            href="/orders"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
          >
            View all <ArrowUpRight size={12} />
          </a>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                  <Package size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {order.id}
                  </p>
                  <p className="text-xs text-slate-500">{order.customer}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {order.amount}
                </p>
                <div className="flex items-center justify-end gap-2 mt-0.5">
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      order.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="text-[10px] text-slate-400">{order.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Open POS", href: "/pos", icon: TrendingUp, desc: "Process a new sale" },
          { label: "Add Product", href: "/products", icon: ShoppingBag, desc: "Manage inventory" },
          { label: "View Reports", href: "/reports", icon: Activity, desc: "Analyse performance" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <a
              key={action.label}
              href={action.href}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
            >
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950 rounded-xl w-fit mb-3 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors">
                <Icon size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {action.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{action.desc}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
