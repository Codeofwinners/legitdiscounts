"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function NotionSearchBar() {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <motion.div
        animate={{
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused 
            ? "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" 
            : "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        }}
        className={cn(
          "relative flex items-center w-full h-14 px-4 rounded-xl bg-white border transition-colors",
          isFocused ? "border-black/20" : "border-black/5"
        )}
      >
        <Search className="w-5 h-5 mr-3 text-black/40" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search for iPhone, MacBook, or deals..."
          className="flex-1 h-full bg-transparent outline-none text-lg placeholder:text-black/30"
        />
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-black/5 text-black/40 text-xs font-medium">
          <Command className="w-3 h-3" />
          <span>K</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 p-2 rounded-xl bg-white border border-black/5 shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-3 py-2 text-xs font-semibold text-black/40 uppercase tracking-wider">
              Popular Searches
            </div>
            {["iPhone 15 Pro", "MacBook Air M2", "iPad Pro Refurbished"].map((item) => (
              <button
                key={item}
                className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-black/5 text-left transition-colors"
              >
                <Search className="w-4 h-4 mr-3 text-black/20" />
                <span className="text-sm font-medium">{item}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
