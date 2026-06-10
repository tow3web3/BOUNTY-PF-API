export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #1a1a1a", background: "#040404" }}>
      {/* Stack bar */}
      <div
        className="max-w-[1400px] mx-auto px-8 py-3 flex items-center justify-between border-b border-[#111]"
      >
        <div className="flex items-center gap-4 text-[10px] tracking-widest" style={{ color: "#2a2a2a" }}>
          <span>BUILT WITH</span>
          {["Hono", "Drizzle ORM", "Vite + React", "OpenAI"].map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 border border-[#1a1a1a] text-[10px]"
              style={{ color: "#333" }}
            >
              {t}
            </span>
          ))}
        </div>
        <span className="text-[10px]" style={{ color: "#1e1e1e" }}>
          thx alex for shipping fast & fixing the last shit
        </span>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1400px] mx-auto px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6 text-[10px]" style={{ color: "#2a2a2a" }}>
          <span>BOUNTR</span>
          <span style={{ color: "#1a1a1a" }}>·</span>
          <span>solana mainnet</span>
          <span style={{ color: "#1a1a1a" }}>·</span>
          <span>2026</span>
        </div>
        <div className="flex items-center gap-5 text-[10px]">
          {[
            { label: "pump.fun/go",              href: "https://pump.fun/go" },
            { label: "github.com/tow3web3/BOUNTY-PF-API", href: "https://github.com/tow3web3/BOUNTY-PF-API" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="transition-colors duration-100"
              style={{ color: "#2a2a2a" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#c8ff00")}
              onMouseLeave={e => (e.currentTarget.style.color = "#2a2a2a")}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
