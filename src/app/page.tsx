"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Command, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { fetcheBayDeals, eBayItem } from "@/lib/ebay";

type RetailerPrice = {
  retailer: string;
  price: number;
  url: string;
};

type PriceAnalysis = {
  index: number;
  productName: string;
  refurbPrice: number | string;
  retailerPrices?: RetailerPrice[];
  lowestNewPrice?: number;
  lowestRetailer?: string;
  savings?: number;
  savingsPercent?: number;
  verdict: string;
  webResults?: { title: string; url: string; site: string }[];
};

type PriceComparison = {
  success: boolean;
  analysis: PriceAnalysis[];
  topPick?: { index: number; reason: string };
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [deals, setDeals] = useState<eBayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [priceComparison, setPriceComparison] = useState<PriceComparison | null>(null);
  const [comparingPrices, setComparingPrices] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let isActive = true;
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        setPriceComparison(null);
        const data = await fetcheBayDeals(query.trim());
        if (isActive) {
          setDeals(data);
          // Run price comparison for searches
          if (query.trim() && data.length > 0) {
            setComparingPrices(true);
            try {
              const products = data.slice(0, 5).map((item, i) => ({
                index: i + 1,
                title: item.title,
                price: item.price,
                condition: item.condition,
              }));
              const res = await fetch("/api/compare", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ products, query: query.trim() }),
              });
              const result = await res.json();
              if (isActive && result.success) {
                setPriceComparison(result);
              }
            } catch {
              // Ignore price comparison errors
            } finally {
              if (isActive) setComparingPrices(false);
            }
          }
        }
      } catch (err) {
        if (isActive) {
          setDeals([]);
          setError(err instanceof Error ? err.message : "Unable to load deals.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [query]);

  return (
    <main className="min-h-screen bg-[#FBFBFB] selection:bg-black selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full h-14 border-b border-gray-100 bg-white z-50">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); setQuery(""); setPriceComparison(null); window.scrollTo(0, 0); }}
            className="flex items-center gap-2"
          >
            <div className="flex items-baseline leading-none">
              <span className="font-black text-xl text-slate-900 tracking-tighter">Epic</span>
              <span className="font-black text-xl text-emerald-500 tracking-tighter">.</span>
              <span className="font-black text-xl bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent tracking-tighter">Deals</span>
            </div>
          </a>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-xs font-semibold border border-gray-200">
              <span>🔥</span>
              <span className="hidden sm:inline">Deals</span>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-50 transition-colors">
              <span className="text-xl">🇺🇸</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-4 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-800 mb-1">
            Find the best refurbished deals
          </h1>
          <p className="text-sm text-slate-400 mb-4">
            Compare prices across eBay, Amazon, Best Buy & more
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <div className={cn(
              "relative flex items-center bg-white border rounded-lg transition-all shadow-sm",
              isFocused ? "border-slate-300 shadow-md" : "border-slate-200"
            )}>
              <div className="pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsFocused(false);
                    inputRef.current?.blur();
                  }
                }}
                placeholder="Search products..."
                className="flex-1 h-10 px-3 bg-transparent outline-none text-sm placeholder:text-slate-400"
              />
              <div className="pr-3 flex items-center gap-1 text-slate-300 text-[10px] font-medium">
                <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200">⌘</kbd>
                <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200">K</kbd>
              </div>
            </div>

            {/* Popular Searches Dropdown */}
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-3 p-3 bg-white border border-black/[0.08] rounded-2xl shadow-2xl z-40 text-left overflow-hidden"
                >
                  <div className="px-3 py-2 text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1">Trending Searches</div>
                  {["iPhone 15 Pro", "MacBook Air M2", "Deals under $400", "Certified Refurbished"].map((item) => (
                    <button
                      key={item}
                      onClick={() => setQuery(item)}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-black/[0.03] transition-colors flex items-center justify-between group/item"
                    >
                      <span className="text-sm font-semibold text-black/70 group-hover/item:text-black">{item}</span>
                      <ArrowRight className="w-3 h-3 text-black/0 group-hover/item:text-black/30 group-hover/item:-translate-x-1 transition-all" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Price Comparison - Notion database style */}
      {(comparingPrices || priceComparison) && query.trim() && (
        <section className="px-4 pb-6 max-w-3xl mx-auto">
          {comparingPrices ? (
            <div className="bg-slate-50 rounded-lg p-4 text-center text-sm text-slate-500">
              <div className="inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mr-2" />
              Comparing prices...
            </div>
          ) : priceComparison?.analysis && (
            <div className="bg-white rounded-lg overflow-hidden" style={{boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.05)'}}>
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                <div className="col-span-5">Store</div>
                <div className="col-span-3">New Price</div>
                <div className="col-span-4">You Save</div>
              </div>
              {/* Rows */}
              {priceComparison.analysis.map((item) => (
                <div key={item.index}>
                  {item.retailerPrices?.map((rp, i) => {
                    const savings = rp.price - Number(item.refurbPrice);
                    const savingsPct = Math.round((savings / rp.price) * 100);
                    return (
                      <a
                        key={i}
                        href={rp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid grid-cols-12 gap-2 px-3 py-2.5 hover:bg-blue-50 transition-colors border-t border-slate-100 items-center"
                      >
                        <div className="col-span-5 text-[13px] font-medium text-slate-800">{rp.retailer}</div>
                        <div className="col-span-3 text-[13px] text-slate-600">${rp.price}</div>
                        <div className="col-span-4 flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-emerald-600">${savings.toFixed(0)}</span>
                          <span className="text-[11px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">{savingsPct}%</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ))}
              {/* Footer */}
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400">
                Refurbished price: <span className="font-semibold text-emerald-600">${priceComparison.analysis[0]?.refurbPrice}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Product Grid */}
      <section className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">{query.trim() ? `Results for "${query}"` : "Today's Best Deals"}</h2>
            <button className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-lg bg-slate-100 animate-pulse" />
              ))
            ) : deals.length > 0 ? (
              deals.map((deal) => (
                <a
                  key={deal.id}
                  href={deal.itemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow border border-slate-100"
                >
                  <div className="aspect-square relative bg-slate-50">
                    <img
                      src={deal.imageUrl}
                      alt={deal.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                    />
                    {deal.savings && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold">
                        -{Math.round((deal.savings / (deal.originalPrice || deal.price)) * 100)}%
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="text-[10px] text-slate-400 mb-0.5">{deal.condition}</div>
                    <h3 className="text-xs font-medium text-slate-700 line-clamp-2 mb-1">{deal.title}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-slate-800">${deal.price}</span>
                      {deal.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through">${deal.originalPrice}</span>
                      )}
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-slate-400 text-sm">
                {error ? error : query ? `No deals found for "${query}"` : "No deals found."}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100 text-center">
        <p className="text-xs text-slate-400">Epic.Deals - Compare refurbished prices</p>
      </footer>
    </main>
  );
}
