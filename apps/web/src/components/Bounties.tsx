import { useState, useEffect, useRef } from "react";

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

const EFFORT_BADGE: Record<string, { color: string; label: string }> = {
  low:    { color: "#00ff88", label: "LOW" },
  medium: { color: "#fbbf24", label: "MED" },
  high:   { color: "#ff5555", label: "HIGH" },
};

export default function Bounties() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [automatable, setAutomatable] = useState<AutomatableBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"auto" | "all">("auto");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = () => {
    setCountdown(30);
    Promise.all([
      fetch("/api/v1/bounties?limit=50").then(r => r.json()),
      fetch("/api/v1/bounties/automatable?limit=50").then(r => r.json()),
    ])
      .then(([allData, autoData]) => {
        setBounties((allData as { data?: Bounty[] }).data ?? []);
        setAutomatable((autoData as { data?: AutomatableBounty[] }).data ?? []);
        setLoading(false);
        setError(null);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Countdown ticker
  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => (c <= 1 ? 30 : c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const displayed = tab === "auto" ? automatable : bounties;

  return (
    <section id="bounties" style={{ background: "#060606", borderTop: "1px solid #1a1a1a" }}>
      <div className="max-w-[1400px] mx-auto">

        {/* Section header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-4">
            <span className="text-[10px] tracking-widest" style={{ color: "#2e2e2e" }}>04</span>
            <span className="text-[11px] tracking-widest font-bold" style={{ color: "#e8e8e8" }}>
              LIVE BOUNTIES
            </span>
            {!loading && (
              <span className="text-[10px]" style={{ color: "#2e2e2e" }}>
                {displayed.length} {tab === "auto" ? "automatable" : "total"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px]" style={{ color: "#222" }}>
              refresh in {countdown}s
            </span>
            {/* Tabs */}
            <div className="flex border border-[#1a1a1a]">
              {(["auto", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-1.5 text-[10px] tracking-widest transition-colors duration-100"
                  style={{
                    background: tab === t ? "#c8ff00" : "transparent",
                    color: tab === t ? "#060606" : "#333",
                    borderRight: t === "auto" ? "1px solid #1a1a1a" : "none",
                    fontWeight: tab === t ? "bold" : "normal",
                  }}
                >
                  {t === "auto" ? "AUTOMATABLE" : "ALL"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column headers — only shown when there's data */}
        {!loading && displayed.length > 0 && (
          <div
            className="hidden md:flex items-center px-8 py-2 border-b border-[#111] text-[10px] tracking-widest"
            style={{ color: "#2a2a2a", background: "#040404" }}
          >
            <div className="w-8 shrink-0">#</div>
            <div className="flex-1 min-w-0">TITLE</div>
            <div className="w-28 shrink-0 text-right">REWARD</div>
            {tab === "auto" && <div className="w-16 shrink-0 text-right">EFFORT</div>}
            {tab === "auto" && <div className="w-20 shrink-0 text-right">CONF.</div>}
            <div className="w-16 shrink-0 text-right">LINK</div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="px-8 py-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-10 mb-1 border border-[#0f0f0f]"
                style={{
                  background: "#0a0a0a",
                  opacity: 1 - i * 0.2,
                }}
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="px-8 py-8 text-[11px]" style={{ color: "#ff5555" }}>
            <span style={{ color: "#333" }}>error: </span>{error}
            <div className="mt-2 text-[10px]" style={{ color: "#2e2e2e" }}>
              — make sure the API server is running on :4021
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && displayed.length === 0 && (
          <div className="px-8 py-12" style={{ background: "#040404" }}>
            <div className="text-[11px] leading-7" style={{ color: "#2e2e2e" }}>
              <div>&gt; fetching from livestream-api.pump.fun...</div>
              <div>&gt; database: {bounties.length} total · {automatable.length} automatable</div>
              <div style={{ color: "#1e1e1e" }}>
                &gt; worker syncs every 60s — refresh in {countdown}s
              </div>
            </div>
            <span
              className="cursor-blink inline-block w-[7px] h-[13px] align-middle mt-1"
              style={{ background: "#2e2e2e" }}
            />
          </div>
        )}

        {/* Data rows */}
        {!loading && !error && displayed.length > 0 && (
          <div>
            {displayed.map((bounty, i) => {
              const auto = tab === "auto" ? (bounty as AutomatableBounty) : null;
              const reward = parseFloat(bounty.rewardUsd);
              const isOpen = expanded === bounty.id;

              return (
                <div key={bounty.id} style={{ borderBottom: "1px solid #0d0d0d" }}>
                  <button
                    className="w-full flex items-center px-8 py-3 text-left transition-colors duration-100"
                    style={{ background: isOpen ? "#0c0c0c" : i % 2 === 0 ? "#060606" : "#080808" }}
                    onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "#0a0a0a"; }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = isOpen ? "#0c0c0c" : i % 2 === 0 ? "#060606" : "#080808";
                    }}
                    onClick={() => setExpanded(isOpen ? null : bounty.id)}
                  >
                    <div className="w-8 shrink-0 text-[10px]" style={{ color: "#2a2a2a" }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0 pr-4 text-[12px] truncate" style={{ color: isOpen ? "#e8e8e8" : "#c8c8c8" }}>
                      {bounty.title}
                    </div>
                    <div className="w-28 shrink-0 text-right text-[12px] font-bold" style={{ color: "#c8ff00" }}>
                      ${isNaN(reward) ? "?" : Math.round(reward)}
                    </div>
                    {tab === "auto" && auto && (
                      <div className="w-16 shrink-0 text-right">
                        <span
                          className="text-[10px] px-1.5 py-0.5 font-bold"
                          style={{
                            color: EFFORT_BADGE[auto.classification.effortEstimate]?.color ?? "#555",
                            border: `1px solid ${EFFORT_BADGE[auto.classification.effortEstimate]?.color ?? "#555"}30`,
                          }}
                        >
                          {EFFORT_BADGE[auto.classification.effortEstimate]?.label ?? "?"}
                        </span>
                      </div>
                    )}
                    {tab === "auto" && auto && (
                      <div className="w-20 shrink-0 text-right text-[11px]" style={{ color: "#444" }}>
                        {Math.round(auto.classification.confidence * 100)}%
                      </div>
                    )}
                    <div className="w-16 shrink-0 text-right">
                      {bounty.link ? (
                        <a
                          href={bounty.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] tracking-widest transition-colors duration-100"
                          style={{ color: "#2e2e2e" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#c8ff00")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#2e2e2e")}
                          onClick={e => e.stopPropagation()}
                        >
                          → GO
                        </a>
                      ) : (
                        <span style={{ color: "#1a1a1a" }}>—</span>
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-8 py-4 border-t border-[#111]" style={{ background: "#0a0a0a" }}>
                      {bounty.description ? (
                        <p className="text-[11px] leading-6 mb-3" style={{ color: "#555" }}>
                          {bounty.description}
                        </p>
                      ) : (
                        <p className="text-[11px]" style={{ color: "#2e2e2e" }}>— no description —</p>
                      )}
                      {auto?.classification.reasoning && (
                        <div
                          className="mt-2 pl-3 text-[11px] leading-5 border-l-2"
                          style={{ color: "#555", borderColor: "#c8ff0030" }}
                        >
                          <span className="text-[10px] tracking-widest" style={{ color: "#2e2e2e" }}>
                            AI:{" "}
                          </span>
                          {auto.classification.reasoning}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div
          className="px-8 py-3 flex items-center justify-between border-t border-[#1a1a1a]"
          style={{ background: "#040404" }}
        >
          <span className="text-[10px]" style={{ color: "#2a2a2a" }}>
            source: livestream-api.pump.fun · worker sync every 60s
          </span>
          <span className="text-[10px]" style={{ color: "#2a2a2a" }}>
            AI classification: claude-sonnet-4-6 · digital_automatable
          </span>
        </div>
      </div>
    </section>
  );
}
