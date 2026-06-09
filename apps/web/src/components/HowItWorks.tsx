import { useRef, useState, useEffect } from "react";

const TRACE = [
  { ts: "00:00.000", dir: "→", from: "AGENT",       to: "SERVER",      status: null,  text: "GET /v1/bounties HTTP/1.1",                  note: "no auth header" },
  { ts: "00:00.012", dir: "←", from: "SERVER",       to: "AGENT",       status: 402,   text: "402 Payment Required",                       note: "2 bytes body" },
  { ts: null,        dir: null, from: null,            to: null,          status: null,  text: "payment-required: eyJ4NDAyVmVyc2lvbiI6Mi...", note: "base64 JSON header" },
  { ts: "00:00.013", dir: "·", from: "AGENT",        to: null,           status: null,  text: "decode header → { scheme: exact, amount: 10000, network: solana:EtWT... }", note: "" },
  { ts: "00:00.014", dir: "·", from: "AGENT",        to: null,           status: null,  text: "build Solana USDC transfer  10000 µUSDC → EPjFWdd...", note: "" },
  { ts: "00:00.015", dir: "·", from: "AGENT",        to: null,           status: null,  text: "sign with wallet keypair",                   note: "" },
  { ts: "00:00.190", dir: "→", from: "AGENT",        to: "SERVER",      status: null,  text: "GET /v1/bounties HTTP/1.1",                   note: "retry with payment" },
  { ts: null,        dir: null, from: null,            to: null,          status: null,  text: "X-PAYMENT: eyJzY2hlbWUiOiJleGFjdCIsInNpZ...", note: "base64 SignedPayment" },
  { ts: "00:00.191", dir: "·", from: "FACILITATOR",  to: null,           status: null,  text: "verify on-chain  ·  settle USDC  ·  return proof", note: "x402.org / devnet" },
  { ts: "00:00.380", dir: "←", from: "SERVER",       to: "AGENT",       status: 200,   text: "200 OK",                                     note: "$0.01 settled" },
  { ts: null,        dir: null, from: null,            to: null,          status: null,  text: "X-PAYMENT-RESPONSE: eyJzZXR0bGVkIjp0cnVlLC...", note: "" },
  { ts: null,        dir: null, from: null,            to: null,          status: null,  text: '{ "data": [...bounties], "pagination": { "total": 0 } }', note: "" },
];

function statusColor(s: number | null) {
  if (s === 200) return "#00ff88";
  if (s === 402) return "#ff5555";
  return null;
}

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
    const tick = () => {
      i++;
      setRevealed(i);
      if (i < TRACE.length) setTimeout(tick, 80);
    };
    setTimeout(tick, 200);
  }, [inView]);

  return (
    <section id="how-it-works" ref={ref} style={{ background: "#060606", borderTop: "1px solid #1a1a1a" }}>
      <div className="max-w-[1400px] mx-auto">

        {/* Section header row */}
        <div
          className="flex items-center justify-between px-8 py-4 border-b border-[#1a1a1a]"
        >
          <div className="flex items-center gap-4">
            <span className="text-[10px] tracking-widest" style={{ color: "#2e2e2e" }}>02</span>
            <span className="text-[11px] tracking-widest font-bold" style={{ color: "#e8e8e8" }}>
              x402 PROTOCOL FLOW
            </span>
          </div>
          <span className="text-[10px]" style={{ color: "#2e2e2e" }}>HTTP trace · devnet</span>
        </div>

        {/* Columns header */}
        <div
          className="flex items-center text-[10px] tracking-widest px-8 py-2 border-b border-[#111]"
          style={{ color: "#2e2e2e", background: "#040404" }}
        >
          <div className="w-24 shrink-0">TIMESTAMP</div>
          <div className="w-8 shrink-0 text-center">DIR</div>
          <div className="w-28 shrink-0">ACTOR</div>
          <div className="flex-1">MESSAGE</div>
          <div className="w-36 text-right">NOTE</div>
        </div>

        {/* Trace rows */}
        <div>
          {TRACE.slice(0, revealed).map((row, i) => {
            const sc = statusColor(row.status);
            const isSend = row.dir === "→";
            const isRecv = row.dir === "←";
            const isProc = row.dir === "·";
            const isCont = row.dir === null;

            return (
              <div
                key={i}
                className="flex items-start px-8 py-1.5 border-b border-[#0d0d0d] text-[11px]"
                style={{
                  background: isCont ? "#020202" : i % 2 === 0 ? "#060606" : "#080808",
                  opacity: 1,
                }}
              >
                {/* Timestamp */}
                <div className="w-24 shrink-0 pt-0.5" style={{ color: "#2a2a2a" }}>
                  {row.ts ?? ""}
                </div>

                {/* Direction */}
                <div
                  className="w-8 shrink-0 text-center font-bold pt-0.5"
                  style={{
                    color: isSend ? "#3c9eff" : isRecv ? (sc ?? "#ff5555") : isProc ? "#555" : "transparent",
                  }}
                >
                  {row.dir ?? ""}
                </div>

                {/* Actor */}
                <div
                  className="w-28 shrink-0 pt-0.5"
                  style={{
                    color: row.from === "AGENT" ? "#c8ff00"
                         : row.from === "FACILITATOR" ? "#fbbf24"
                         : row.from === "SERVER" ? "#3c9eff"
                         : "#1e1e1e",
                  }}
                >
                  {row.from ?? ""}
                </div>

                {/* Message */}
                <div
                  className="flex-1 pr-4 leading-5"
                  style={{
                    color: sc ?? (isCont ? "#333" : isProc ? "#444" : "#777"),
                    fontStyle: isProc ? "normal" : "normal",
                  }}
                >
                  {row.status && (
                    <span
                      className="mr-2 px-1 py-0.5 text-[10px] font-bold"
                      style={{
                        background: sc ? sc + "22" : "transparent",
                        color: sc ?? "#888",
                        border: `1px solid ${sc ?? "#333"}44`,
                      }}
                    >
                      {row.status}
                    </span>
                  )}
                  {row.text}
                </div>

                {/* Note */}
                <div className="w-36 text-right pt-0.5 text-[10px]" style={{ color: "#2a2a2a" }}>
                  {row.note}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary bar */}
        {revealed >= TRACE.length && (
          <div
            className="flex items-center justify-between px-8 py-3 border-t border-[#1a1a1a]"
            style={{ background: "#040404" }}
          >
            <div className="flex items-center gap-6 text-[11px]">
              <span style={{ color: "#2e2e2e" }}>total round-trip</span>
              <span style={{ color: "#555" }}>~380ms</span>
              <span style={{ color: "#2e2e2e" }}>settlement</span>
              <span style={{ color: "#c8ff00" }}>on-chain · immediate</span>
            </div>
            <div className="text-[11px]" style={{ color: "#2e2e2e" }}>
              cost: <span style={{ color: "#c8ff00" }}>$0.01</span>
              <span className="mx-3" style={{ color: "#1e1e1e" }}>|</span>
              no account
              <span className="mx-3" style={{ color: "#1e1e1e" }}>|</span>
              no API key
              <span className="mx-3" style={{ color: "#1e1e1e" }}>|</span>
              no rate limit
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
