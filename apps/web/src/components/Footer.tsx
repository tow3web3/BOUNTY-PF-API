import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="border-t border-border py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple to-cyan flex items-center justify-center text-sm font-black text-white">
                G
              </div>
              <span className="font-bold text-lg tracking-tight">
                Agent<span className="text-gradient">GO</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              x402-powered API for AI agents to discover and execute
              automatable bounties from Pump.fun GO.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">API</h4>
            <div className="flex flex-col gap-3">
              {[
                { href: "/api/v1/health", label: "Health Check" },
                { href: "#endpoints", label: "Endpoints" },
                { href: "#how-it-works", label: "x402 Protocol" },
              ].map((l) => (
                <a key={l.label} href={l.href} className="text-sm text-slate-500 hover:text-white transition-colors">
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Stack */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Stack</h4>
            <div className="flex flex-wrap gap-2">
              {["Hono", "@x402/hono", "Drizzle ORM", "PostgreSQL", "Solana", "USDC", "Anthropic", "Vite + React"].map((t) => (
                <span key={t} className="text-xs px-2 py-1 rounded-md bg-surface border border-border text-slate-500">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            Agent GO · Built with x402 v2 · Solana devnet
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <a href="https://x402.org" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">
              x402.org
            </a>
            <a href="https://go.pump.fun" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">
              Pump.fun GO
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
