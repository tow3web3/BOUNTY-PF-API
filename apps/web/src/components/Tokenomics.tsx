import { useState } from "react";

const BAR_FULL  = "█";
const BAR_EMPTY = "░";
const BAR_LEN   = 24;

function Bar({ pct, color }: { pct: number; color: string }) {
  const filled = Math.round((pct / 100) * BAR_LEN);
  return (
    <span style={{ color, fontFamily: "inherit", letterSpacing: "1px" }}>
      {BAR_FULL.repeat(filled)}{BAR_EMPTY.repeat(BAR_LEN - filled)}
    </span>
  );
}

function CopyBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="border border-[#1a1a1a]" style={{ background: "#020202" }}>
      {label && (
        <div
          className="flex items-center justify-between px-3 py-1.5 border-b border-[#111] text-[10px] tracking-widest"
          style={{ color: "#2e2e2e", background: "#080808" }}
        >
          <span>{label}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(code.trim()); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            style={{ color: copied ? "#c8ff00" : "#2e2e2e" }}
            className="transition-colors duration-150"
          >
            {copied ? "copied ✓" : "copy"}
          </button>
        </div>
      )}
      <pre className="px-4 py-3 text-[11px] leading-5 overflow-x-auto" style={{ color: "#777" }}>
        {code.trim()}
      </pre>
    </div>
  );
}

export default function Tokenomics() {
  const [wallet, setWallet] = useState("");

  const curlQuery  = wallet
    ? `curl "http://localhost:4021/v1/bounties?wallet=${wallet}"`
    : `curl "http://localhost:4021/v1/bounties?wallet=<YOUR_SOLANA_WALLET>"`;

  const curlHeader = wallet
    ? `curl http://localhost:4021/v1/bounties \\\n  -H "X-WALLET: ${wallet}"`
    : `curl http://localhost:4021/v1/bounties \\\n  -H "X-WALLET: <YOUR_SOLANA_WALLET>"`;

  return (
    <section id="earn" style={{ background: "#060606", borderTop: "1px solid #1a1a1a" }}>
      <div className="max-w-[1400px] mx-auto">

        {/* Section header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-4">
            <span className="text-[10px] tracking-widest" style={{ color: "#2e2e2e" }}>05</span>
            <span className="text-[11px] tracking-widest font-bold" style={{ color: "#e8e8e8" }}>EARN FEES</span>
            <span
              className="text-[9px] tracking-widest px-2 py-0.5"
              style={{ color: "#c8ff00", border: "1px solid #c8ff0030" }}
            >
              TOKEN LAUNCHING
            </span>
          </div>
          <span className="text-[10px]" style={{ color: "#2e2e2e" }}>
            pump.fun GO · Solana · USDC distribution
          </span>
        </div>

        <div className="flex flex-col lg:flex-row">

          {/* ── LEFT — economics ──────────────────────────────────── */}
          <div className="flex-1 px-8 py-8 border-b lg:border-b-0 lg:border-r border-[#1a1a1a]">

            {/* Allocation bars */}
            <div className="mb-8">
              <div className="text-[10px] tracking-widest mb-5" style={{ color: "#2e2e2e" }}>
                FEE ALLOCATION
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold" style={{ color: "#c8ff00" }}>API USERS</span>
                    <span className="text-[12px] font-black" style={{ color: "#c8ff00" }}>50%</span>
                  </div>
                  <Bar pct={50} color="#c8ff00" />
                  <p className="text-[11px] mt-2 leading-5" style={{ color: "#444" }}>
                    Distributed weekly, pro-rata by call volume.
                    Any wallet that made API calls in the period receives a share.
                  </p>
                </div>

                <div className="border-t border-[#111] pt-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold" style={{ color: "#555" }}>BUYBACK & LOCK</span>
                    <span className="text-[12px] font-black" style={{ color: "#555" }}>50%</span>
                  </div>
                  <Bar pct={50} color="#2e2e2e" />
                  <p className="text-[11px] mt-2 leading-5" style={{ color: "#444" }}>
                    Token bought on the open market and permanently locked.
                    Reduces circulating supply every distribution cycle.
                  </p>
                </div>
              </div>
            </div>

            {/* Mechanics table */}
            <div>
              <div className="text-[10px] tracking-widest mb-3" style={{ color: "#2e2e2e" }}>MECHANICS</div>
              <div className="border border-[#1a1a1a]">
                {[
                  ["formula",    "your_calls / total_calls × 50% of fees"],
                  ["frequency",  "weekly snapshot + distribution"],
                  ["minimum",    "none — every call counts"],
                  ["lock-up",    "none — USDC sent directly to wallet"],
                  ["eligibility","any wallet passed in API requests"],
                  ["token",      "launching on pump.fun GO"],
                  ["status",     "register your wallet now — tracking live"],
                ].map(([k, v], i) => (
                  <div
                    key={k}
                    className="flex border-b border-[#0f0f0f] last:border-0"
                    style={{ background: i % 2 === 0 ? "transparent" : "#040404" }}
                  >
                    <div className="w-28 shrink-0 px-3 py-2 text-[11px] border-r border-[#0f0f0f]" style={{ color: "#2e2e2e" }}>
                      {k}
                    </div>
                    <div
                      className="flex-1 px-3 py-2 text-[11px]"
                      style={{ color: k === "status" ? "#c8ff00" : "#666" }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT — wallet + code ─────────────────────────────── */}
          <div className="flex-1 px-8 py-8 flex flex-col gap-6" style={{ background: "#040404" }}>

            <div>
              <div className="text-[10px] tracking-widest mb-3" style={{ color: "#2e2e2e" }}>
                STEP 1 — ENTER YOUR SOLANA WALLET
              </div>
              <div className="flex border border-[#1a1a1a]" style={{ background: "#020202" }}>
                <input
                  type="text"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder="e.g. EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
                  className="flex-1 px-4 py-3 text-[11px] outline-none bg-transparent placeholder:opacity-30"
                  style={{ color: "#c8ff00", fontFamily: "inherit" }}
                  spellCheck={false}
                />
                {wallet && (
                  <button
                    onClick={() => setWallet("")}
                    className="px-3 text-[10px] border-l border-[#1a1a1a] transition-colors duration-100"
                    style={{ color: "#333" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#ff5555")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#333")}
                  >
                    ✕
                  </button>
                )}
              </div>
              {wallet && (
                <div className="mt-1.5 text-[10px]" style={{ color: "#2e2e2e" }}>
                  {wallet.length >= 32 && wallet.length <= 44
                    ? "✓ looks like a valid Solana address"
                    : "⚠ Solana addresses are 32–44 chars"}
                </div>
              )}
            </div>

            <div>
              <div className="text-[10px] tracking-widest mb-3" style={{ color: "#2e2e2e" }}>
                STEP 2 — INCLUDE WALLET IN API CALLS
              </div>
              <div className="space-y-3">
                <CopyBlock label="query param" code={curlQuery} />
                <CopyBlock label="header" code={curlHeader} />
              </div>
            </div>

            <div>
              <div className="text-[10px] tracking-widest mb-3" style={{ color: "#2e2e2e" }}>
                STEP 3 — COLLECT FEES WEEKLY
              </div>
              <div className="border border-[#1a1a1a] px-4 py-3 text-[11px] leading-6" style={{ background: "#020202", color: "#444" }}>
                <div>
                  <span style={{ color: "#2e2e2e" }}>your_weekly_fees =</span>
                </div>
                <div className="pl-4">
                  <span style={{ color: "#c8ff00" }}>your_call_count</span>
                  <span style={{ color: "#2e2e2e" }}> / </span>
                  <span style={{ color: "#555" }}>total_calls_all_wallets</span>
                </div>
                <div className="pl-4">
                  <span style={{ color: "#2e2e2e" }}>× </span>
                  <span style={{ color: "#00ff88" }}>50% of token fees</span>
                </div>
                <div className="pl-4">
                  <span style={{ color: "#2e2e2e" }}>→ sent as </span>
                  <span style={{ color: "#555" }}>USDC to your wallet</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div
              className="border border-[#c8ff0020] p-4 mt-auto"
              style={{ background: "rgba(200,255,0,0.02)" }}
            >
              <div className="text-[10px] tracking-widest mb-2" style={{ color: "#c8ff00" }}>
                TOKEN NOT LAUNCHED YET
              </div>
              <p className="text-[11px] leading-5" style={{ color: "#555" }}>
                Register your wallet now by making API calls with{" "}
                <code style={{ color: "#888" }}>?wallet=</code> — call history is recorded
                from day one. When the token launches on pump.fun GO,
                retroactive fees apply from the first tracked call.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
