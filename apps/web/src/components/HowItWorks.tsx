import { useRef, useState, useEffect } from "react";

const TRACE = [
  { ts: "00:00.000", dir: "→", from: "WORKER",     text: "GET livestream-api.pump.fun/bounties/v2/tasks?phase=OPEN",   note: "every 60s on request" },
  { ts: "00:00.180", dir: "←", from: "PUMP.FUN",   text: "200 OK  { items: [ { taskId, title, rewardTotalUsd, ... } ] }", note: "live bounties" },
  { ts: "00:00.181", dir: "·", from: "WORKER",     text: "normalize → filter $0 · map status · hash description",       note: "" },
  { ts: "00:00.200", dir: "·", from: "WORKER",     text: "upsert to Neon DB  ·  +3 new  ·  2 updated  ·  0 expired",    note: "" },
  { ts: "00:00.210", dir: "·", from: "GPT-4o-mini", text: 'classify: "Build data pipeline"  →  digital_automatable  0.94', note: "effort: low" },
  { ts: "00:00.890", dir: "·", from: "GPT-4o-mini", text: 'classify: "Record podcast intro"  →  digital_human  0.91',     note: "effort: high" },
  { ts: "00:01.200", dir: "→", from: "AGENT",      text: "GET /v1/bounties?limit=20  (via Bountr API)",                  note: "no auth, no key" },
  { ts: "00:01.220", dir: "←", from: "SERVER",     text: '200 OK  { "data": [ Bounty × 20 ], "pagination": { "total": 1082 } }', note: "from Neon DB" },
  { ts: "00:01.221", dir: "·", from: "SERVER",     text: "background sync triggered if data > 60s old",                  note: "fire & forget" },
  { ts: "00:01.225", dir: "·", from: "AGENT",      text: 'filter by rewardUsd > 100  ·  status === "active"',            note: "client-side" },
  { ts: "00:01.226", dir: "·", from: "AGENT",      text: 'claim bounty on pump.fun/go  →  earn reward',                  note: "direct on-chain" },
];

const FROM_COLOR: Record<string, string> = {
  "WORKER":      "#3c9eff",
  "PUMP.FUN":    "#fbbf24",
  "GPT-4o-mini": "#c8ff00",
  "AGENT":       "#00ff88",
  "SERVER":      "#888",
};

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.1 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const tick = () => { i++; setRevealed(i); if (i < TRACE.length) setTimeout(tick, 90); };
    setTimeout(tick, 200);
  }, [inView]);

  return (
    <section id="how-it-works" ref={ref} style={{ background: "#060606", borderTop: "1px solid #1a1a1a" }}>
      <div className="max-w-[1400px] mx-auto">

        <div className="flex items-center justify-between px-8 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-4">
            <span className="text-[10px] tracking-widest" style={{ color: "#2e2e2e" }}>02</span>
            <span className="text-[11px] tracking-widest font-bold" style={{ color: "#e8e8e8" }}>
              PROTOCOL FLOW
            </span>
          </div>
          <span className="text-[10px]" style={{ color: "#2e2e2e" }}>pump.fun → AI → API → agent</span>
        </div>

        <div
          className="flex items-center text-[10px] tracking-widest px-8 py-2 border-b border-[#111]"
          style={{ color: "#2e2e2e", background: "#040404" }}
        >
          <div className="w-24 shrink-0">TIMESTAMP</div>
          <div className="w-8 shrink-0 text-center">DIR</div>
          <div className="w-28 shrink-0">ACTOR</div>
          <div className="flex-1">EVENT</div>
          <div className="w-36 text-right">NOTE</div>
        </div>

        <div>
          {TRACE.slice(0, revealed).map((row, i) => (
            <div
              key={i}
              className="flex items-start px-8 py-1.5 border-b border-[#0d0d0d] text-[11px]"
              style={{ background: i % 2 === 0 ? "#060606" : "#080808" }}
            >
              <div className="w-24 shrink-0 pt-0.5" style={{ color: "#2a2a2a" }}>{row.ts}</div>
              <div
                className="w-8 shrink-0 text-center font-bold pt-0.5"
                style={{ color: row.dir === "→" ? "#3c9eff" : row.dir === "←" ? "#00ff88" : "#444" }}
              >
                {row.dir}
              </div>
              <div className="w-28 shrink-0 pt-0.5 text-[10px] font-bold" style={{ color: FROM_COLOR[row.from] ?? "#555" }}>
                {row.from}
              </div>
              <div className="flex-1 pr-4 leading-5" style={{ color: "#666" }}>{row.text}</div>
              <div className="w-36 text-right pt-0.5 text-[10px]" style={{ color: "#2a2a2a" }}>{row.note}</div>
            </div>
          ))}
        </div>

        {revealed >= TRACE.length && (
          <div
            className="flex items-center justify-between px-8 py-3 border-t border-[#1a1a1a]"
            style={{ background: "#040404" }}
          >
            <div className="flex items-center gap-6 text-[11px]">
              <span style={{ color: "#2e2e2e" }}>sync interval</span>
              <span style={{ color: "#555" }}>on-demand · max 1/60s</span>
              <span style={{ color: "#2e2e2e" }}>classification</span>
              <span style={{ color: "#c8ff00" }}>gpt-4o-mini · async</span>
            </div>
            <div className="text-[11px]" style={{ color: "#2e2e2e" }}>
              no auth
              <span className="mx-3" style={{ color: "#1e1e1e" }}>|</span>
              no API key
              <span className="mx-3" style={{ color: "#1e1e1e" }}>|</span>
              open source
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
