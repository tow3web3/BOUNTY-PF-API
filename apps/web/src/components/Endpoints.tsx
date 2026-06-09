import { useState } from "react";

const ROWS = [
  {
    method: "GET",
    path: "/v1/health",
    desc: "Liveness probe. Returns API status, DB connectivity, timestamp.",
    curl: `curl http://localhost:4021/v1/health`,
    response: `{ "status": "ok", "version": "1.0.0", "db": "connected", "timestamp": "..." }`,
    accent: false,
  },
  {
    method: "GET",
    path: "/v1/bounties",
    desc: "Paginated list of all active Pump.fun GO bounties. Query: page, limit (max 100), status.",
    curl: `curl "http://localhost:4021/v1/bounties?limit=20&page=1"`,
    response: `{ "data": [Bounty], "pagination": { "page": 1, "total": 0, "hasNext": false } }`,
    accent: false,
  },
  {
    method: "GET",
    path: "/v1/bounties/automatable",
    desc: "Only AI-verified digital_automatable bounties. Sorted by rewardToEffortRatio DESC. Includes full classification with reasoning.",
    curl: `curl "http://localhost:4021/v1/bounties/automatable?limit=20"`,
    response: `{
  "data": [{
    "id": "...",
    "title": "...",
    "rewardUsd": "150.00",
    "classification": {
      "category": "digital_automatable",
      "confidence": 0.94,
      "effortEstimate": "low",
      "rewardToEffortRatio": 150.0,
      "reasoning": "..."
    }
  }]
}`,
    accent: true,
  },
  {
    method: "GET",
    path: "/v1/bounties/:id",
    desc: "Full bounty detail. Includes statusHistory[] and classification reasoning. Triggers background re-classification if description changed.",
    curl: `curl "http://localhost:4021/v1/bounties/abc-123"`,
    response: `{ ...Bounty, "statusHistory": [...], "classification": { "reasoning": "..." } }`,
    accent: false,
  },
  {
    method: "POST",
    path: "/v1/subscriptions",
    desc: "Create a 24-hour webhook subscription. Returns HMAC secret. Filters: minRewardUsd, categories, maxEffort.",
    curl: `curl -X POST http://localhost:4021/v1/subscriptions \\
  -H "Content-Type: application/json" \\
  -d '{
    "webhookUrl": "https://my-agent.example/hook",
    "filters": { "minRewardUsd": 50 }
  }'`,
    response: `{ "id": "sub_01J...", "expiresAt": "2026-06-10T00:00:00Z", "hmacSecret": "..." }`,
    accent: false,
  },
];

export default function Endpoints() {
  const [expanded, setExpanded] = useState<number | null>(2);

  return (
    <section id="endpoints" style={{ background: "#060606", borderTop: "1px solid #1a1a1a" }}>
      <div className="max-w-[1400px] mx-auto">

        {/* Section header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-4">
            <span className="text-[10px] tracking-widest" style={{ color: "#2e2e2e" }}>03</span>
            <span className="text-[11px] tracking-widest font-bold" style={{ color: "#e8e8e8" }}>
              API ENDPOINTS
            </span>
          </div>
          <span className="text-[10px]" style={{ color: "#2e2e2e" }}>
            base url: http://localhost:4021 · 5 routes · all free
          </span>
        </div>

        {/* Column headers */}
        <div
          className="hidden md:flex items-center px-8 py-2 border-b border-[#111] text-[10px] tracking-widest"
          style={{ color: "#2a2a2a", background: "#040404" }}
        >
          <div className="w-16 shrink-0">METHOD</div>
          <div className="flex-1">PATH</div>
          <div className="w-8 shrink-0 text-right">↕</div>
        </div>

        {/* Rows */}
        {ROWS.map((row, i) => (
          <div key={i} style={{ borderBottom: "1px solid #0f0f0f" }}>
            <button
              className="w-full flex items-center px-8 py-3.5 text-left transition-colors duration-100"
              style={{
                background: expanded === i
                  ? "#0b0b0b"
                  : row.accent ? "rgba(200,255,0,0.015)" : "transparent",
              }}
              onMouseEnter={e => { if (expanded !== i) e.currentTarget.style.background = "#090909"; }}
              onMouseLeave={e => {
                e.currentTarget.style.background = expanded === i
                  ? "#0b0b0b"
                  : row.accent ? "rgba(200,255,0,0.015)" : "transparent";
              }}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              {/* Method */}
              <div className="w-16 shrink-0">
                <span
                  className="text-[10px] font-bold px-2 py-0.5"
                  style={{
                    color: row.method === "POST" ? "#fbbf24" : "#3c9eff",
                    border: `1px solid ${row.method === "POST" ? "#fbbf2430" : "#3c9eff30"}`,
                    background: row.method === "POST" ? "#fbbf2406" : "#3c9eff06",
                  }}
                >
                  {row.method}
                </span>
              </div>

              {/* Path + description */}
              <div className="flex-1 min-w-0 flex items-center gap-4">
                <code
                  className="text-[12px] shrink-0"
                  style={{ color: row.accent ? "#c8ff00" : "#c8c8c8" }}
                >
                  {row.path}
                </code>
                {row.accent && (
                  <span
                    className="text-[9px] tracking-widest px-1.5 py-0.5 shrink-0"
                    style={{ color: "#c8ff00", border: "1px solid #c8ff0030" }}
                  >
                    AI-RANKED
                  </span>
                )}
                <span
                  className="text-[11px] truncate hidden md:block"
                  style={{ color: "#333" }}
                >
                  {row.desc}
                </span>
              </div>

              {/* Toggle */}
              <div
                className="text-[10px] shrink-0 transition-transform duration-150"
                style={{
                  color: "#2e2e2e",
                  transform: expanded === i ? "rotate(90deg)" : "none",
                }}
              >
                ▶
              </div>
            </button>

            {/* Expanded detail */}
            {expanded === i && (
              <div className="px-8 pb-6 pt-1 border-t border-[#111]" style={{ background: "#0a0a0a" }}>
                <p className="text-[12px] leading-6 py-4" style={{ color: "#555" }}>
                  {row.desc}
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] tracking-widest mb-2" style={{ color: "#2e2e2e" }}>REQUEST</div>
                    <pre
                      className="p-4 text-[11px] leading-5 overflow-x-auto border border-[#111]"
                      style={{ background: "#020202", color: "#777" }}
                    >
                      {row.curl}
                    </pre>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-widest mb-2" style={{ color: "#2e2e2e" }}>RESPONSE</div>
                    <pre
                      className="p-4 text-[11px] leading-5 overflow-x-auto border border-[#111]"
                      style={{ background: "#020202", color: "#c8ff00" }}
                    >
                      {row.response}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        <div
          className="px-8 py-3 flex items-center justify-between border-t border-[#1a1a1a]"
          style={{ background: "#040404" }}
        >
          <span className="text-[10px]" style={{ color: "#2a2a2a" }}>
            no auth required · no rate limit · no API key
          </span>
          <span className="text-[10px]" style={{ color: "#2a2a2a" }}>
            x402 protocol demo — pump.fun GO data
          </span>
        </div>
      </div>
    </section>
  );
}
