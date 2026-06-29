"use client";

import React, { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { Search, Loader2, RefreshCw, Layers, Image as ImageIcon } from "lucide-react";

export default function ProductGrid() {
  const addItem = useCartStore((state) => state.addItem);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<string>("all");

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const url = `/api/products?query=${encodeURIComponent(search)}&categoryId=${selectedCatId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Re-fetch products when search or category selection changes
  useEffect(() => {
    fetchProducts();
  }, [search, selectedCatId]);

  // Initial fetch for categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearchEnter = async () => {
    const currentSearch = search.trim();
    if (!currentSearch) return;

    // 1. If products are already fetched, not loading, and match is available in state, use it
    if (!loadingProducts && products.length > 0) {
      const productToAdd = products.find((p) => p.stock > 0);
      if (productToAdd) {
        addItem(productToAdd);
        setSearch("");
        return;
      }
    }

    // 2. Otherwise, perform a quick direct fetch to catch any pending scans or state updates
    try {
      const url = `/api/products?query=${encodeURIComponent(currentSearch)}&categoryId=${selectedCatId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const productToAdd = data.find((p: any) => p.stock > 0);
          if (productToAdd) {
            addItem(productToAdd);
            setSearch("");
          }
        }
      }
    } catch (err) {
      console.error("Error adding product on Enter key:", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search products by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearchEnter();
            }
          }}
          className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm shadow-sm"
        />
      </div>

      {/* Category selector row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        <button
          onClick={() => setSelectedCatId("all")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
            selectedCatId === "all"
              ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          <Layers size={14} />
          All Categories
        </button>

        {loadingCategories ? (
          <Loader2 className="animate-spin text-slate-400" size={16} />
        ) : (
          categories.map((cat) => {
            const active = selectedCatId === String(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(String(cat.id))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                  active
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {cat.name}
              </button>
            );
          })
        )}
      </div>

      {/* Product Card grid */}
      <div className="flex-1 overflow-y-auto">
        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl h-44 animate-pulse space-y-3"
              >
                <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <RefreshCw size={36} className="animate-spin-slow" />
            <p className="text-sm font-medium">No matching products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock <= product.minStock && !isOutOfStock;

              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => addItem(product)}
                  className={`flex flex-col text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group select-none min-h-[160px] cursor-pointer relative ${
                    isOutOfStock ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {/* Stock tag */}
                  <span
                    className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white z-10 ${
                      isOutOfStock
                        ? "bg-rose-500"
                        : isLowStock
                        ? "bg-amber-500"
                        : "bg-slate-400 dark:bg-slate-700"
                    }`}
                  >
                    {isOutOfStock ? "OUT" : `${product.stock} left`}
                  </span>

                  {/* Product Image */}
                  <div className="h-32 w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex-shrink-0">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                        <ImageIcon size={32} className="opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* Product body */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 tracking-wider mb-0.5 truncate uppercase">
                        {product.code || product.sku}
                      </p>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 leading-tight">
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                        ${Number(product.price).toFixed(2)}
                      </span>
                      {isLowStock && (
                        <span className="text-[9px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
                          Low Stock
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
