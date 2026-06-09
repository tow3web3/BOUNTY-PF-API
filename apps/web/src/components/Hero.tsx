import { useState, useEffect, useRef } from "react";
import { useHealth, API_BASE } from "../hooks/useApi";

type NavigateFn = (p: "home" | "docs" | "bounties") => void;

const LINES = [
  { t: 0,    kind: "cmd",     text: "$ curl /v1/bounties/automatable" },
  { t: 800,  kind: "ok",      text: "< HTTP/1.1 200 OK" },
  { t: 1100, kind: "data",    text: '< { "data": [' },
  { t: 1400, kind: "field",   text: '    { "title": "Build data pipeline",' },
  { t: 1700, kind: "field",   text: '      "rewardUsd": "150.00",' },
  { t: 2000, kind: "field",   text: '      "effortEstimate": "low",' },
  { t: 2300, kind: "accent",  text: '      "rewardToEffortRatio": 150.0 }' },
  { t: 2700, kind: "data",    text: '  ], "pagination": { "total": 907 } }' },
  { t: 3200, kind: "comment", text: "# no signup · no key · no billing" },
];

const KIND_COLOR: Record<string, string> = {
  cmd:     "#c8c8c8",
  ok:      "#00ff88",
  data:    "#777",
  field:   "#555",
  accent:  "#c8ff00",
  comment: "#2a2a2a",
};

export default function Hero({ onNavigate }: { onNavigate?: NavigateFn }) {
  const { data: health } = useHealth();
  const online = health?.db === "connected";
  const [visible, setVisible] = useState(0);
  const [totalBounties, setTotalBounties] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    LINES.forEach((l, i) => {
      const t = setTimeout(() => setVisible(i + 1), l.t + 300);
      timers.current.push(t);
    });
    return () => timers.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/v1/bounties?limit=1`)
      .then(r => r.json())
      .then((d: { pagination?: { total?: number } }) => {
        if (d.pagination?.total) setTotalBounties(d.pagination.total);
      })
      .catch(() => null);
  }, []);

  return (
    <section className="min-h-screen pt-10 flex flex-col" style={{ background: "#060606" }}>
      <div className="rule-accent" />

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1400px] w-full mx-auto">

        {/* ── LEFT ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-8 py-16 lg:py-0 border-r border-[#1a1a1a]">

          {/* Title */}
          <div className="mb-10">
            <div className="text-[10px] tracking-widest mb-4" style={{ color: "#2e2e2e" }}>
              BOUNTR / v1.0
            </div>
            <h1
              className="font-black leading-none tracking-tight mb-5"
              style={{ color: "#e8e8e8", fontSize: "clamp(40px, 5.5vw, 62px)", letterSpacing: "-2px" }}
            >
              BOUNTY API<br />
              <span style={{ color: "#c8ff00" }}>FOR AGENTS</span>
            </h1>
            <p className="text-[13px] leading-relaxed max-w-xs" style={{ color: "#555" }}>
              x402-native API over Pump.fun GO.
              AI agents discover automatable bounties
              and earn fees from the token.
            </p>
          </div>

          {/* Live stats */}
          <div className="mb-10 border border-[#1a1a1a]">
            <div
              className="px-4 py-2 border-b border-[#1a1a1a] text-[10px] tracking-widest"
              style={{ color: "#2e2e2e", background: "#040404" }}
            >
              LIVE STATS
            </div>
            <div className="grid grid-cols-3">
              {[
                {
                  label: "bounties",
                  value: totalBounties ? totalBounties.toLocaleString() : "—",
                  accent: true,
                },
                {
                  label: "API status",
                  value: online ? "ONLINE" : "OFFLINE",
                  ok: online,
                },
                {
                  label: "protocol",
                  value: "x402 v2",
                  accent: false,
                },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="px-4 py-3"
                  style={{ borderRight: i < 2 ? "1px solid #1a1a1a" : "none" }}
                >
                  <div
                    className="text-[13px] font-bold mb-0.5"
                    style={{ color: s.accent ? "#c8ff00" : s.ok !== undefined ? (s.ok ? "#00ff88" : "#ff5555") : "#888" }}
                  >
                    {s.value}
                  </div>
                  <div className="text-[10px]" style={{ color: "#2a2a2a" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate?.("bounties")}
              className="px-5 py-2.5 text-[11px] tracking-widest font-bold border transition-all duration-100 hover:bg-[#c8ff00] hover:text-[#060606]"
              style={{ borderColor: "#c8ff00", color: "#c8ff00" }}
            >
              → VIEW BOUNTIES
            </button>
            <a
              href="#earn"
              className="px-5 py-2.5 text-[11px] tracking-widest border transition-all duration-100 hover:border-[#c8ff0060] hover:text-[#888]"
              style={{ borderColor: "#1e1e1e", color: "#444" }}
            >
              → EARN FEES
            </a>
            <a
              href="#endpoints"
              className="px-5 py-2.5 text-[11px] tracking-widest border transition-all duration-100 hover:border-[#333] hover:text-[#888]"
              style={{ borderColor: "#1e1e1e", color: "#333" }}
            >
              → API DOCS
            </a>
          </div>
        </div>

        {/* ── RIGHT — terminal ──────────────────────────────────────── */}
        <div
          className="lg:w-[460px] shrink-0 flex flex-col justify-center px-8 py-16"
          style={{ background: "#040404" }}
        >
          <div className="border border-[#1a1a1a]" style={{ background: "#020202" }}>
            <div
              className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a]"
              style={{ background: "#080808" }}
            >
              <span className="text-[10px] tracking-widest" style={{ color: "#2e2e2e" }}>
                bountr / terminal
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: online ? "#00ff88" : "#333",
                    boxShadow: online ? "0 0 4px #00ff88" : "none",
                  }}
                />
                <span className="text-[9px]" style={{ color: online ? "#00ff88" : "#333" }}>
                  {online ? "LIVE" : "OFFLINE"}
                </span>
              </div>
            </div>

            <div className="p-4 min-h-[240px]">
              {LINES.slice(0, visible).map((line, i) => (
                <div key={i} className="text-[11px] leading-6" style={{ color: KIND_COLOR[line.kind] ?? "#555" }}>
                  {line.text || " "}
                </div>
              ))}
              {visible <= LINES.length && (
                <span className="cursor-blink inline-block w-[7px] h-[13px] align-middle ml-0.5" style={{ background: "#c8ff00" }} />
              )}
            </div>
          </div>

          <div
            className="mt-3 px-4 py-2.5 border border-[#1a1a1a] flex items-center justify-between"
            style={{ background: "#020202" }}
          >
            <span className="text-[10px]" style={{ color: "#2e2e2e" }}>5 endpoints · all free · open source</span>
            <a
              href="https://github.com/tow3web3/x402"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] transition-colors duration-100"
              style={{ color: "#2e2e2e" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#c8ff00")}
              onMouseLeave={e => (e.currentTarget.style.color = "#2e2e2e")}
            >
              github →
            </a>
          </div>
        </div>
      </div>

      <div className="rule-accent" />
    </section>
  );
}
