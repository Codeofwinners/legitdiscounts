"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Command, ArrowRight, ShieldCheck, Zap, Sparkles, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { fetcheBayDeals, eBayItem } from "@/lib/ebay";

export default function Home() {
  const [query, setQuery] = useState("");
  const [deals, setDeals] = useState<eBayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadDeals() {
      setLoading(true);
      const data = await fetcheBayDeals();
      setDeals(data);
      setLoading(false);
    }
    loadDeals();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredDeals = query 
    ? deals.filter(d => d.title.toLowerCase().includes(query.toLowerCase()))
    : deals;

  return (
    <main className="min-h-screen bg-[#FBFBFB] selection:bg-black selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full h-16 border-b border-black/[0.04] bg-white/70 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">EpicDeals</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-black/50">
            <a href="#" className="hover:text-black transition-colors">iPhone</a>
            <a href="#" className="hover:text-black transition-colors">Mac</a>
            <a href="#" className="hover:text-black transition-colors">iPad</a>
            <a href="#" className="hover:text-black transition-colors">Watch</a>
          </div>
          <div className="flex items-center gap-4">
             <button className="hidden sm:block text-sm font-medium text-black/50 hover:text-black">Sign In</button>
             <button className="px-5 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-black/80 transition-all shadow-lg shadow-black/5 active:scale-95">
               Start Saving
             </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.03] text-[11px] font-bold uppercase tracking-wider mb-8 text-black/60">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Live Pricing active
            </div>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 leading-[0.9]">
              Premium tech. <br />
              <span className="text-black/30">Better than new.</span>
            </h1>
            <p className="text-lg md:text-2xl text-black/40 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
              Award-winning refurbished devices. <br className="hidden md:block" />
              Expertly verified. Perfectly priced.
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

          {/* Trust Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 border-t border-black/[0.05] pt-12"
          >
            {[
              { icon: ShieldCheck, title: "1-Year Warranty", sub: "Standard on all tech" },
              { icon: Zap, title: "Swift Delivery", sub: "Free shipping nationwide" },
              { icon: Star, title: "10k+ Reviews", sub: "4.9/5 average rating" },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <feature.icon className="w-5 h-5 text-black/40 mb-2" />
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-black">{feature.title}</span>
                <span className="text-xs font-medium text-black/30">{feature.sub}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] mb-2">Live Inventory</div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Today's Best Deals</h2>
            </div>
            <button className="flex items-center gap-2 text-sm font-bold hover:gap-3 transition-all text-black/60 hover:text-black">
              See all deals <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-96 rounded-3xl bg-black/[0.02] animate-pulse" />
              ))
            ) : filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
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
              <div className="col-span-full py-20 text-center text-black/40 font-medium">No deals found for "{query}"</div>
            )}
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-20 border-t border-black/[0.05] text-center">
        <div className="flex items-center justify-center gap-2 opacity-20 hover:opacity-100 transition-opacity cursor-default mb-4">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-bold tracking-tighter uppercase">EpicDeals 2026</span>
        </div>
        <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em]">Designed for trust. Built for value.</p>
      </footer>
    </main>
  );
}
