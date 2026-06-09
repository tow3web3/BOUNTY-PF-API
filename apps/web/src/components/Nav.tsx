import { useState, useEffect } from "react";
import { useHealth } from "../hooks/useApi";
import type { Page } from "../App";

export default function Nav({ page = "home", onNavigate }: { page?: Page; onNavigate?: (p: Page) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const { data: health } = useHealth();
  const online = health?.db === "connected";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-10 flex items-center"
      style={{
        background: scrolled ? "rgba(6,6,6,0.97)" : "#060606",
        borderBottom: "1px solid #1a1a1a",
      }}
    >
      <div className="w-full max-w-[1400px] mx-auto px-5 flex items-center">

        {/* Logo */}
        <button
          onClick={() => onNavigate?.("home")}
          className="flex items-center h-10 pr-5 border-r border-[#1a1a1a] shrink-0"
          style={{ color: page === "home" ? "#c8ff00" : "#555" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#c8ff00")}
          onMouseLeave={e => (e.currentTarget.style.color = page === "home" ? "#c8ff00" : "#555")}
        >
          <span className="text-[11px] font-bold tracking-widest">AGENT_GO</span>
        </button>

        {/* Status */}
        <div className="flex items-center gap-1.5 px-4 h-10 border-r border-[#1a1a1a] shrink-0">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: online ? "#00ff88" : "#333", boxShadow: online ? "0 0 4px #00ff88" : "none" }}
          />
          <span className="text-[10px]" style={{ color: online ? "#00ff88" : "#333" }}>
            {online ? "DEVNET" : "OFFLINE"}
          </span>
        </div>

        {/* Home anchor links */}
        {page === "home" && (
          <div className="hidden md:flex items-center h-10 border-r border-[#1a1a1a]">
            {[
              { href: "#how-it-works", label: "PROTOCOL" },
              { href: "#endpoints",    label: "ENDPOINTS" },
              { href: "#earn",         label: "EARN" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="px-4 h-10 flex items-center text-[10px] tracking-widest transition-colors duration-100"
                style={{ color: "#2e2e2e" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#c8c8c8")}
                onMouseLeave={e => (e.currentTarget.style.color = "#2e2e2e")}
              >
                {l.label}
              </a>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Page nav buttons */}
        <div className="flex items-center border-l border-[#1a1a1a]">
          {(["bounties", "docs"] as const).map((p) => (
            <button
              key={p}
              onClick={() => onNavigate?.(page === p ? "home" : p)}
              className="flex items-center h-10 px-4 text-[10px] tracking-widest transition-colors duration-100 border-r border-[#1a1a1a] last:border-r-0"
              style={{ color: page === p ? "#c8ff00" : "#2e2e2e" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#c8ff00")}
              onMouseLeave={e => (e.currentTarget.style.color = page === p ? "#c8ff00" : "#2e2e2e")}
            >
              {page === p ? "← HOME" : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
