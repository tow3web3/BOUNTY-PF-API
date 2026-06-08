import { motion } from "framer-motion";
import { useHealth } from "../hooks/useApi";

const TERMINAL_LINES = [
  { delay: 0, type: "comment", text: "# Agent requests bounties without paying" },
  { delay: 0.4, type: "cmd", text: "GET /v1/bounties HTTP/1.1" },
  { delay: 0.9, type: "response-bad", text: "← 402 Payment Required" },
  { delay: 1.3, type: "comment", text: "# Reads payment-required header, signs tx" },
  { delay: 1.8, type: "cmd", text: 'X-PAYMENT: "eyJzY2hlbWUiOiJleGFjdCIs..."' },
  { delay: 2.3, type: "response-good", text: "← 200 OK  +  bounties[]" },
];

export default function Hero() {
  const { data: health } = useHealth();
  const isLive = health?.db === "connected";

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan/15 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple/10 blur-3xl"
        />
        {/* Grid */}
        <div className="absolute inset-0 grid-bg opacity-40" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
        {/* Left — text */}
        <div className="flex-1 text-center lg:text-left">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-dim border border-purple/30 text-purple text-xs font-semibold mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple animate-pulse" />
            x402 Protocol · Solana USDC · Pump.fun GO
          </motion.div>

          {/* Heading */}
          <div className="overflow-hidden mb-6">
            <motion.h1
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl lg:text-7xl font-black tracking-tight leading-none"
            >
              Bounty API
              <br />
              <span className="text-gradient">for AI Agents</span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-slate-400 text-lg lg:text-xl leading-relaxed mb-10 max-w-xl"
          >
            Discover automatable Pump.fun GO bounties.
            Pay <em className="text-white not-italic font-semibold">per request</em> with Solana USDC —
            no signup, no API key, just{" "}
            <span className="text-purple font-semibold">HTTP 402</span>.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap gap-4 justify-center lg:justify-start"
          >
            <a
              href="#endpoints"
              className="group relative px-7 py-3.5 rounded-xl font-semibold text-white overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple to-cyan opacity-100 group-hover:opacity-90 transition-opacity" />
              <span className="absolute inset-0 shine opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2">
                Explore Endpoints
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </a>
            <a
              href="#how-it-works"
              className="px-7 py-3.5 rounded-xl font-semibold text-slate-300 border border-border-bright hover:border-purple/40 hover:text-white hover:bg-purple/5 transition-all duration-200"
            >
              How x402 Works
            </a>
          </motion.div>

          {/* Live stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-wrap gap-6 mt-10 justify-center lg:justify-start"
          >
            {[
              { label: "Protocol", value: "x402 v2" },
              { label: "Network", value: "Solana devnet" },
              { label: "API Status", value: isLive ? "Online" : "Connecting…", green: isLive },
            ].map((s) => (
              <div key={s.label} className="text-center lg:text-left">
                <div className={`text-sm font-bold ${s.green ? "text-green" : "text-white"}`}>
                  {s.value}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — terminal */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 w-full max-w-lg"
        >
          <div className="relative">
            {/* Glow behind terminal */}
            <div className="absolute -inset-4 bg-purple/10 rounded-2xl blur-xl" />

            {/* Terminal window */}
            <div className="relative rounded-xl border border-border-bright bg-[#070710] overflow-hidden shadow-2xl">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow/70" />
                <div className="w-3 h-3 rounded-full bg-green/70" />
                <span className="ml-3 text-xs text-slate-500 font-mono">agent-go · x402 flow</span>
              </div>
              {/* Content */}
              <div className="p-5 font-mono text-[13px] leading-7 min-h-[240px]">
                {TERMINAL_LINES.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + line.delay, duration: 0.3 }}
                    className={
                      line.type === "comment"
                        ? "text-slate-600"
                        : line.type === "cmd"
                        ? "text-cyan"
                        : line.type === "response-bad"
                        ? "text-red-400"
                        : "text-green"
                    }
                  >
                    {line.type === "cmd" && <span className="text-slate-500 mr-2">$</span>}
                    {line.text}
                  </motion.div>
                ))}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="inline-block w-2 h-4 bg-purple ml-1 align-middle"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-slate-600">scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-px h-8 bg-gradient-to-b from-slate-600 to-transparent"
        />
      </motion.div>
    </section>
  );
}
