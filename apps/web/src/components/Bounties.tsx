import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

interface Bounty {
  id: string;
  title: string;
  description: string;
  rewardUsd: string;
  link: string | null;
  status: string;
}

interface AutomatableBounty extends Bounty {
  classification: {
    category: string;
    confidence: number;
    effortEstimate: string;
    reasoning: string;
    rewardToEffortRatio: number;
  };
}

const EFFORT_COLOR: Record<string, string> = {
  low: "text-green border-green/30 bg-green/10",
  medium: "text-yellow border-yellow/30 bg-yellow/10",
  high: "text-red-400 border-red-400/30 bg-red-400/10",
};

function BountyCard({ bounty, index, auto }: { bounty: Bounty; index: number; auto?: AutomatableBounty }) {
  const reward = parseFloat(bounty.rewardUsd);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative rounded-xl border p-5 transition-all duration-200 cursor-default ${
        auto
          ? "border-purple/30 bg-gradient-to-b from-purple/5 to-transparent hover:border-purple/50"
          : "border-border-bright bg-surface-2 hover:border-border-bright/80"
      }`}
    >
      {auto && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple/5 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {auto && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple/15 text-purple border border-purple/30">
              🤖 Automatable
            </span>
          )}
          {auto && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono ${EFFORT_COLOR[auto.classification.effortEstimate] ?? "text-slate-400"}`}>
              {auto.classification.effortEstimate} effort
            </span>
          )}
          {!auto && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-border">
              👤 Human / Physical
            </span>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span className="text-2xl font-black text-green">${Math.round(reward)}</span>
          {auto && (
            <div className="text-[10px] text-slate-600 font-mono">
              ratio {auto.classification.rewardToEffortRatio.toFixed(1)}
            </div>
          )}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-white mb-2 leading-snug line-clamp-2">
        {bounty.title}
      </h3>

      <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
        {bounty.description}
      </p>

      {auto?.classification.reasoning && (
        <p className="text-[11px] text-purple/70 italic border-l-2 border-purple/30 pl-2 mb-3 line-clamp-2">
          {auto.classification.reasoning}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        {auto && (
          <span className="text-[11px] text-slate-600 font-mono">
            {Math.round(auto.classification.confidence * 100)}% confidence
          </span>
        )}
        {bounty.link && (
          <a
            href={bounty.link}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-cyan hover:text-cyan/80 transition-colors ml-auto"
            onClick={(e) => e.stopPropagation()}
          >
            pump.fun →
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function Bounties() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [automatable, setAutomatable] = useState<AutomatableBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "auto">("auto");

  useEffect(() => {
    fetch("/api/v1/health")
      .then((r) => r.json())
      .then((data) => {
        const allBounties = (data as { bounties?: Bounty[] }).bounties ?? [];
        setBounties(allBounties);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const displayed = tab === "auto" ? automatable : bounties;
  const isEmpty = !loading && displayed.length === 0;

  return (
    <section id="bounties" className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple/3 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-dim border border-green/20 text-green text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              Live data — refreshes every 30s
            </div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight">
              <span className="text-gradient">Bounties</span>
            </h2>
            <p className="text-slate-400 mt-2">
              Fetched directly from the database.{" "}
              <span className="text-purple">🤖 Automatable</span> = AI-verified.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-surface border border-border">
            {(["auto", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === t ? "text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab === t && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 bg-purple/20 border border-purple/30 rounded-lg"
                  />
                )}
                <span className="relative">
                  {t === "auto" ? "🤖 Automatable" : "All bounties"}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface-2 p-5 h-48 animate-pulse" />
              ))}
            </motion.div>
          ) : isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="text-5xl mb-5"
              >
                🔍
              </motion.div>
              <p className="text-lg font-semibold text-slate-300 mb-2">No active bounties yet</p>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                The worker syncs Pump.fun GO bounties automatically.
                <br />Check back in a few minutes.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse" />
                Worker syncing every 60s
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {tab === "auto"
                ? automatable.map((b, i) => (
                    <BountyCard key={b.id} bounty={b} index={i} auto={b} />
                  ))
                : bounties.map((b, i) => {
                    const a = automatable.find((x) => x.id === b.id);
                    return <BountyCard key={b.id} bounty={b} index={i} auto={a} />;
                  })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
