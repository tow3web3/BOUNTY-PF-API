import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const STEPS = [
  {
    icon: "🤖",
    title: "Agent Request",
    desc: "AI agent calls the API endpoint — no auth header needed.",
    code: "GET /v1/bounties",
    color: "purple",
  },
  {
    icon: "🔒",
    title: "402 Returned",
    desc: "Server returns HTTP 402 with payment requirements in the header.",
    code: "payment-required: eyJ...",
    color: "red",
  },
  {
    icon: "💳",
    title: "Build & Sign Tx",
    desc: "Agent reads the header, creates a Solana USDC transaction and signs it.",
    code: "amount: 10000 (≈ $0.01)",
    color: "yellow",
  },
  {
    icon: "⚡",
    title: "Facilitator Settles",
    desc: "Coinbase CDP / x402.org verifies the payment proof on-chain.",
    code: "X-PAYMENT: <base64-proof>",
    color: "cyan",
  },
  {
    icon: "✅",
    title: "200 + Data",
    desc: "Payment confirmed — server returns the requested bounty data.",
    code: '{ "data": [...bounties] }',
    color: "green",
  },
];

const colorMap: Record<string, string> = {
  purple: "border-purple/40 bg-purple-dim text-purple",
  red: "border-red-500/30 bg-red-500/10 text-red-400",
  yellow: "border-yellow/30 bg-yellow-dim text-yellow",
  cyan: "border-cyan/30 bg-cyan-dim text-cyan",
  green: "border-green/30 bg-green-dim text-green",
};

const glowMap: Record<string, string> = {
  purple: "shadow-purple/30",
  red: "shadow-red-500/20",
  yellow: "shadow-yellow/20",
  cyan: "shadow-cyan/20",
  green: "shadow-green/20",
};

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-dim border border-cyan/20 text-cyan text-xs font-semibold mb-6">
            Zero API keys
          </div>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
            How <span className="text-gradient">x402</span> Works
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            HTTP-native micropayments. The protocol is entirely in the headers —
            no SDK, no dashboard, no billing cycle.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-px">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
              style={{ originX: 0 }}
              className="h-full bg-gradient-to-r from-purple via-cyan to-green opacity-30"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-4">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.12, ease: "easeOut" }}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Arrow between steps (mobile) */}
                {i < STEPS.length - 1 && (
                  <div className="lg:hidden w-px h-6 bg-border my-2" />
                )}

                {/* Icon circle */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`relative w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl mb-5 transition-shadow duration-300 group-hover:shadow-lg ${colorMap[step.color]} group-hover:${glowMap[step.color]}`}
                >
                  {step.icon}
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-bg border border-border flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {i + 1}
                  </div>
                </motion.div>

                <h3 className="font-bold text-sm mb-2 text-white">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{step.desc}</p>
                <code className={`text-[11px] px-2 py-1 rounded-md font-mono border ${colorMap[step.color]} opacity-70`}>
                  {step.code}
                </code>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detail card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-16 p-6 lg:p-8 rounded-2xl glass border border-border-bright grid lg:grid-cols-2 gap-8"
        >
          <div>
            <h3 className="font-bold text-white mb-2">The 402 Response Header</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              All payment requirements are encoded in a single base64 header.
              No JSON body to parse — just decode and build the transaction.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Solana", "USDC", "Exact scheme", "Max timeout", "Fee payer"].map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 rounded-md bg-surface border border-border text-slate-400">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-[#050508] rounded-xl p-4 font-mono text-[12px] leading-6 border border-border">
            <div className="text-slate-500">// payment-required (decoded)</div>
            <div><span className="text-slate-600">{"{"}</span></div>
            <div className="pl-4"><span className="text-cyan">"scheme"</span><span className="text-slate-600">: </span><span className="text-green">"exact"</span><span className="text-slate-600">,</span></div>
            <div className="pl-4"><span className="text-cyan">"network"</span><span className="text-slate-600">: </span><span className="text-green">"solana:EtWT..."</span><span className="text-slate-600">,</span></div>
            <div className="pl-4"><span className="text-cyan">"amount"</span><span className="text-slate-600">: </span><span className="text-yellow">"10000"</span><span className="text-slate-600">,  </span><span className="text-slate-600">// $0.01</span></div>
            <div className="pl-4"><span className="text-cyan">"payTo"</span><span className="text-slate-600">: </span><span className="text-green">"EPjFWdd..."</span></div>
            <div><span className="text-slate-600">{"}"}</span></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
