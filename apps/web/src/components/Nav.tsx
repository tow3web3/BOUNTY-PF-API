import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Nav({ page = "home" }: { page?: "home" | "docs" }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links =
    page === "docs"
      ? [
          { href: "#overview", label: "Overview" },
          { href: "#architecture", label: "Architecture" },
          { href: "#x402-deep-dive", label: "x402" },
          { href: "#integration", label: "Integration" },
        ]
      : [
          { href: "#how-it-works", label: "Protocol" },
          { href: "#endpoints", label: "Endpoints" },
          { href: "#bounties", label: "Bounties" },
        ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bg/80 backdrop-blur-xl border-b border-border/60"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-sm font-black text-white">
            G
          </div>
          <span className="font-bold text-lg tracking-tight">
            Agent<span className="text-gradient">GO</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noreferrer" : undefined}
              className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green/10 border border-green/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse-slow" />
            <span className="text-xs font-medium text-green">devnet live</span>
          </div>
          {page === "docs" ? (
            <a
              href="#"
              className="px-4 py-2 rounded-lg border border-border-bright text-white text-sm font-semibold hover:bg-white/5 transition-all duration-200"
            >
              ← Home
            </a>
          ) : (
            <a
              href="#docs"
              className="px-4 py-2 rounded-lg border border-border-bright text-white text-sm font-semibold hover:bg-white/5 transition-all duration-200"
            >
              Docs
            </a>
          )}
          <a
            href={page === "docs" ? "#" : "#endpoints"}
            className="px-4 py-2 rounded-lg bg-purple text-white text-sm font-semibold hover:bg-purple/90 transition-all duration-200 hover:shadow-lg hover:shadow-purple/30"
          >
            {page === "docs" ? "← Back" : "Explore API"}
          </a>
        </div>

        {/* Mobile menu btn */}
        <button
          className="md:hidden text-slate-400 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface border-b border-border"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
