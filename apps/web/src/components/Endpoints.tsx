import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/v1/health",
    price: "FREE",
    priceRaw: null,
    description: "API status, database connectivity, and revenue summary.",
    example: 'curl http://localhost:4021/v1/health',
    response: '{ "status": "ok", "db": "connected", "version": "1.0.0" }',
    highlight: false,
  },
  {
    method: "GET",
    path: "/v1/bounties",
    price: "$0.01",
    priceRaw: "0.01",
    description: "Paginated list of all active Pump.fun GO bounties, sorted by reward.",
    example: 'curl http://localhost:4021/v1/bounties \\\n  -H "X-PAYMENT: <proof>"',
    response: '{ "data": [...], "pagination": { "total": 42 } }',
    highlight: false,
  },
  {
    method: "GET",
    path: "/v1/bounties/automatable",
    price: "$0.05",
    priceRaw: "0.05",
    description: "AI-classified bounties an agent can complete autonomously, scored by reward/effort ratio.",
    example: 'curl http://localhost:4021/v1/bounties/automatable \\\n  -H "X-PAYMENT: <proof>"',
    response: '{ "data": [{ "rewardToEffortRatio": 75, "classification": { "category": "digital_automatable", ... } }] }',
    highlight: true,
  },
  {
    method: "GET",
    path: "/v1/bounties/:id",
    price: "$0.005",
    priceRaw: "0.005",
    description: "Full bounty detail with status history and classification reasoning.",
    example: 'curl http://localhost:4021/v1/bounties/abc-123 \\\n  -H "X-PAYMENT: <proof>"',
    response: '{ "title": "...", "statusHistory": [...], "classification": { "reasoning": "..." } }',
    highlight: false,
  },
  {
    method: "POST",
    path: "/v1/subscriptions",
    price: "$0.10",
    priceRaw: "0.10",
    description: "24-hour webhook subscription. Get notified when new automatable bounties appear.",
    example: 'curl -X POST http://localhost:4021/v1/subscriptions \\\n  -H "X-PAYMENT: <proof>" \\\n  -d \'{ "webhookUrl": "https://...", "filters": { "minRewardUsd": 50 } }\'',
    response: '{ "id": "sub_01J...", "expiresAt": "...", "hmacSecret": "..." }',
    highlight: false,
  },
];

export default function Endpoints() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [expanded, setExpanded] = useState<number | null>(2);

  return (
    <section id="endpoints" className="py-32 relative">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-dim border border-purple/20 text-purple text-xs font-semibold mb-6">
            5 endpoints
          </div>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
            <span className="text-gradient">API</span> Reference
          </h2>
          <p className="text-slate-400 text-lg">
            Click any endpoint to see a live example.
          </p>
        </motion.div>

        <div className="flex flex-col gap-3">
          {ENDPOINTS.map((ep, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
            >
              <motion.button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className={`w-full text-left rounded-xl border transition-all duration-200 overflow-hidden ${
                  ep.highlight
                    ? "border-purple/40 bg-purple/5"
                    : "border-border-bright bg-surface-2"
                } ${expanded === i ? "shadow-lg" : "hover:border-border-bright/80"}`}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.998 }}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Method badge */}
                  <span className={`shrink-0 text-[11px] font-black px-2.5 py-1 rounded-md font-mono ${
                    ep.method === "POST"
                      ? "bg-yellow/10 text-yellow border border-yellow/20"
                      : "bg-green/10 text-green border border-green/20"
                  }`}>
                    {ep.method}
                  </span>

                  {/* Path */}
                  <code className="text-sm font-mono text-slate-300 flex-1 text-left">
                    {ep.path}
                  </code>

                  {/* Price */}
                  <span className={`shrink-0 text-sm font-bold ${
                    ep.priceRaw === null ? "text-green" : "text-purple"
                  }`}>
                    {ep.price}
                  </span>

                  {/* Chevron */}
                  <motion.svg
                    animate={{ rotate: expanded === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4 text-slate-500 shrink-0"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </div>

                <AnimatePresence initial={false}>
                  {expanded === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 border-t border-border/50 pt-4">
                        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                          {ep.description}
                        </p>
                        <div className="grid lg:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-600 uppercase tracking-wider mb-2 font-semibold">Request</div>
                            <pre className="text-[12px] font-mono bg-[#050508] rounded-lg p-4 text-cyan border border-border overflow-x-auto leading-6">
                              {ep.example}
                            </pre>
                          </div>
                          <div>
                            <div className="text-xs text-slate-600 uppercase tracking-wider mb-2 font-semibold">Response</div>
                            <pre className="text-[12px] font-mono bg-[#050508] rounded-lg p-4 text-green border border-border overflow-x-auto leading-6 whitespace-pre-wrap">
                              {ep.response}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
