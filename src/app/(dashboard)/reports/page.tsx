"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Calendar, DollarSign, TrendingUp, ShoppingBag, 
  Activity, ArrowDownRight, ArrowUpRight, FileText, Download,
  PieChart as PieIcon
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface ReportData {
  summary: {
    totalRevenue: number;
    totalCostOfGoods: number;
    totalDiscount: number;
    totalTax: number;
    netProfit: number;
    orderCount: number;
    avgOrderValue: number;
  };
  salesByDate: {
    date: string;
    revenue: number;
    cost: number;
    profit: number;
    orders: number;
  }[];
  salesByCategory: {
    category: string;
    revenue: number;
    quantity: number;
  }[];
  salesByCashier: {
    cashier: string;
    revenue: number;
    orders: number;
  }[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e'];

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const { user } = useAuthStore();

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = "/api/reports";
      if (dateRange.start && dateRange.end) {
        url += `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch reports");
      }
      
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading reports");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Activity size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Access Denied</h2>
        <p className="text-slate-500 mt-2">Only administrators can view reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="text-indigo-600" /> Business Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Analyze your store&apos;s performance and metrics.
          </p>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <input 
              type="date" 
              className="bg-transparent text-sm border-none focus:ring-0 text-slate-700 dark:text-slate-300 outline-none px-2"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
            <span className="text-slate-400 mx-1">to</span>
            <input 
              type="date" 
              className="bg-transparent text-sm border-none focus:ring-0 text-slate-700 dark:text-slate-300 outline-none px-2"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 h-32 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-6 rounded-2xl border border-rose-200 dark:border-rose-800">
          <p className="font-semibold text-lg mb-2">Error loading reports</p>
          <p>{error}</p>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Revenue" 
              value={formatCurrency(data.summary.totalRevenue)} 
              icon={DollarSign} 
              color="text-indigo-600" 
              bg="bg-indigo-100 dark:bg-indigo-900/40" 
            />
            <StatCard 
              title="Net Profit" 
              value={formatCurrency(data.summary.netProfit)} 
              icon={TrendingUp} 
              color="text-emerald-600" 
              bg="bg-emerald-100 dark:bg-emerald-900/40" 
            />
            <StatCard 
              title="Total Orders" 
              value={data.summary.orderCount.toString()} 
              icon={ShoppingBag} 
              color="text-violet-600" 
              bg="bg-violet-100 dark:bg-violet-900/40" 
            />
            <StatCard 
              title="Avg. Order Value" 
              value={formatCurrency(data.summary.avgOrderValue)} 
              icon={Activity} 
              color="text-amber-600" 
              bg="bg-amber-100 dark:bg-amber-900/40" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue & Profit Over Time Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Calendar className="text-indigo-600" size={20} /> Revenue & Profit Trend
              </h3>
              <div className="h-80 w-full">
                {data.salesByDate.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.salesByDate} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => formatCurrency(Number(value))}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No data available for this period</div>
                )}
              </div>
            </div>

            {/* Sales By Category Pie Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <PieIcon className="text-violet-600" size={20} /> Sales by Category
              </h3>
              <div className="h-64 w-full">
                {data.salesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.salesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="revenue"
                        nameKey="category"
                      >
                        {data.salesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
                )}
              </div>
            </div>

            {/* Sales By Cashier */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <FileText className="text-emerald-600" size={20} /> Performance by Cashier
              </h3>
              <div className="h-72 w-full">
                {data.salesByCashier.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.salesByCashier} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                      <YAxis dataKey="cashier" type="category" width={100} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        formatter={(value: any) => formatCurrency(Number(value))}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: { title: string, value: string, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${bg}`}>
          <Icon className={color} size={24} />
        </div>
      </div>
    </div>
  );
}
