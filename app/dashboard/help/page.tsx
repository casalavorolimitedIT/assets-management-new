"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import { faqs } from "@/constants";

type Category =
  | "all"
  | "account"
  | "verification"
  | "investment"
  | "bank"
  | "security";

export interface FAQ {
  category: Exclude<Category, "all">;
  section: string;
  q: string;
  a: string;
}

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "account", label: "Account" },
  { key: "verification", label: "Verification" },
  { key: "investment", label: "Investment" },
  { key: "bank", label: "Bank & payments" },
  { key: "security", label: "Security" },
];

const FAQItem = ({ faq }: { faq: FAQ }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-gray-800 leading-snug">
          {faq.q}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <p className="text-sm text-gray-500 leading-relaxed px-4 pb-4">
          {faq.a}
        </p>
      )}
    </div>
  );
};

const Help = () => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return faqs.filter((faq) => {
      const matchesCategory =
        activeCategory === "all" || faq.category === activeCategory;
      const matchesQuery =
        !q ||
        faq.q.toLowerCase().includes(q) ||
        faq.a.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  const grouped = useMemo(() => {
    const groups: Record<string, FAQ[]> = {};
    filtered.forEach((faq) => {
      if (!groups[faq.section]) groups[faq.section] = [];
      groups[faq.section].push(faq);
    });
    return groups;
  }, [filtered]);

  const handleCategoryChange = (cat: Category) => {
    setActiveCategory(cat);
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Help</h1>

        {/* Search */}
        <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-2xl px-4 mb-4 shadow-sm">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for help…"
            className="w-full py-3 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-gray-400 hover:text-gray-600 text-xs shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                activeCategory === key
                  ? "bg-primary/10 border-primary text-gray-800"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* FAQ groups */}
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">
              No results found. Try a different search.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([section, items]) => (
            <div key={section} className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                {section}
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {items.map((faq, i) => (
                  <FAQItem key={i} faq={faq} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Help;
