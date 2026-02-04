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
      <section className="pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Find the best refurbished deals
            </h1>
            <p className="text-base md:text-lg text-slate-500 mb-6">
              Compare prices across eBay, Amazon, Best Buy & more
            </p>
          </motion.div>

          {/* Notion-style Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-2xl mx-auto group"
          >
            <div className={cn(
              "relative flex items-center bg-white border rounded-2xl transition-all duration-300 shadow-sm overflow-hidden",
              isFocused ? "border-black shadow-2xl scale-[1.02]" : "border-black/[0.08] group-hover:border-black/[0.15]"
            )}>
              <div className="pl-5 text-black/30">
                <Search className="w-5 h-5" />
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
                placeholder="Search iPhone, MacBook, or 'deals under $500'..."
                className="flex-1 h-16 px-4 bg-transparent outline-none text-lg font-medium placeholder:text-black/20"
              />
              <div className="pr-5 flex items-center gap-1.5 text-black/20 font-bold text-xs">
                <div className="px-1.5 py-0.5 rounded border border-black/10 bg-black/[0.02]">
                  <Command className="w-3 h-3" />
                </div>
                <div className="px-1.5 py-0.5 rounded border border-black/10 bg-black/[0.02]">K</div>
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
          </motion.div>

        </div>
      </section>

      {/* Price Comparison - Seamless Apple-style */}
      {(comparingPrices || priceComparison) && query.trim() && (
        <section className="px-4 pb-2 max-w-4xl mx-auto">
          {comparingPrices && (
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              Checking prices across retailers...
            </div>
          )}
          {priceComparison?.analysis && (
            <div className="space-y-1">
              {priceComparison.analysis.map((item) => (
                <div key={item.index} className="group py-2">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-[13px] text-slate-600 truncate max-w-[200px] sm:max-w-none">{item.productName}</span>
                    <span className="text-[13px] font-semibold text-emerald-600">${item.refurbPrice}</span>
                    <span className="text-[11px] text-slate-300">→</span>
                    {item.retailerPrices && item.retailerPrices.length > 0 ? (
                      item.retailerPrices.map((rp, i) => (
                        <a
                          key={i}
                          href={rp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-[11px] transition-colors ${rp.price === item.lowestNewPrice ? "text-slate-800 font-semibold" : "text-slate-400 hover:text-slate-600"}`}
                        >
                          {rp.retailer} <span className="tabular-nums">${rp.price}</span>
                        </a>
                      ))
                    ) : (
                      item.webResults?.slice(0, 3).map((r, i) => {
                        const site = (r.site || "").replace("www.", "").split(".")[0];
                        return (
                          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
                            {site.charAt(0).toUpperCase() + site.slice(1)}
                          </a>
                        );
                      })
                    )}
                    {item.savingsPercent && (
                      <span className="text-[11px] font-medium text-emerald-600">−{Math.round(item.savingsPercent)}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Product Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] mb-2">Live Inventory</div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{query.trim() ? `Results for "${query}"` : "Today's Best Deals"}</h2>
            </div>
            <button className="flex items-center gap-2 text-sm font-bold hover:gap-3 transition-all text-black/60 hover:text-black">
              See all deals <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-96 rounded-3xl bg-black/[0.02] animate-pulse" />
              ))
            ) : deals.length > 0 ? (
              deals.map((deal) => (
                <motion.div 
                  key={deal.id}
                  whileHover={{ y: -5 }}
                  className="group relative flex flex-col bg-white border border-black/[0.05] rounded-[2.5rem] p-6 transition-all hover:shadow-2xl hover:border-black/[0.1] cursor-pointer"
                >
                  <div className="aspect-square relative mb-8 overflow-hidden rounded-[2rem] bg-[#f9f9f9]">
                    <img 
                      src={deal.imageUrl} 
                      alt={deal.title} 
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                    />
                    {deal.savings && (
                      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm text-[10px] font-bold text-black">
                        SAVE ${Math.round(deal.savings)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1">{deal.condition}</div>
                    <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-black transition-colors">{deal.title}</h3>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">${deal.price}</span>
                      {deal.originalPrice && (
                        <span className="text-xs font-medium text-black/20 line-through">${deal.originalPrice}</span>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-black/[0.03] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                      <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-black/40 font-medium">
                {error ? error : query ? `No deals found for \"${query}\"` : "No deals found."}
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
