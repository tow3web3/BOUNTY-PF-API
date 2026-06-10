import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../hooks/useApi";

interface Bounty {
  id: string;
  title: string;
  description: string;
  rewardUsd: string;
  link: string | null;
  status: string;
}

export default function Bounties() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = () => {
    setCountdown(30);
    fetch(`${API_BASE}/v1/bounties?limit=50`)
      .then(r => r.json())
      .then((data: { data?: Bounty[] }) => {
        setBounties(data.data ?? []);
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

  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => (c <= 1 ? 30 : c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

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
                {bounties.length} active
              </span>
            )}
          </div>
          <span className="text-[10px]" style={{ color: "#222" }}>
            refresh in {countdown}s
          </span>
        </div>

        {/* Column headers */}
        {!loading && bounties.length > 0 && (
          <div
            className="hidden md:flex items-center px-8 py-2 border-b border-[#111] text-[10px] tracking-widest"
            style={{ color: "#2a2a2a", background: "#040404" }}
          >
            <div className="w-8 shrink-0">#</div>
            <div className="flex-1 min-w-0">TITLE</div>
            <div className="w-28 shrink-0 text-right">REWARD</div>
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
                style={{ background: "#0a0a0a", opacity: 1 - i * 0.2 }}
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
        {!loading && !error && bounties.length === 0 && (
          <div className="px-8 py-12" style={{ background: "#040404" }}>
            <div className="text-[11px] leading-7" style={{ color: "#2e2e2e" }}>
              <div>&gt; fetching from livestream-api.pump.fun...</div>
              <div>&gt; worker syncs every 60s — refresh in {countdown}s</div>
            </div>
            <span className="cursor-blink inline-block w-[7px] h-[13px] align-middle mt-1" style={{ background: "#2e2e2e" }} />
          </div>
        )}

        {/* Data rows */}
        {!loading && !error && bounties.length > 0 && (
          <div>
            {bounties.map((bounty, i) => {
              const reward = parseFloat(bounty.rewardUsd);
              const isOpen = expanded === bounty.id;
              return (
                <div key={bounty.id} style={{ borderBottom: "1px solid #0d0d0d" }}>
                  <button
                    className="w-full flex items-center px-8 py-3 text-left transition-colors duration-100"
                    style={{ background: isOpen ? "#0c0c0c" : i % 2 === 0 ? "#060606" : "#080808" }}
                    onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "#0a0a0a"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isOpen ? "#0c0c0c" : i % 2 === 0 ? "#060606" : "#080808"; }}
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
                        <p className="text-[11px] leading-6" style={{ color: "#555" }}>
                          {bounty.description}
                        </p>
                      ) : (
                        <p className="text-[11px]" style={{ color: "#2e2e2e" }}>— no description —</p>
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
            source: livestream-api.pump.fun · sync on request
          </span>
          <span className="text-[10px]" style={{ color: "#2a2a2a" }}>
            pump.fun GO bounties
          </span>
        </div>
      </div>
    </section>
  );
}
