import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../hooks/useApi";

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}

const LIMIT = 25;

const EFFORT: Record<string, { color: string; label: string }> = {
  low:    { color: "#00ff88", label: "LOW" },
  medium: { color: "#fbbf24", label: "MED" },
  high:   { color: "#ff5555", label: "HIGH" },
};

export default function BountiesPage({ onBack }: { onBack?: () => void }) {
  const [tab, setTab]               = useState<"all" | "auto">("all");
  const [page, setPage]             = useState(1);
  const [bounties, setBounties]     = useState<Bounty[]>([]);
  const [automatable, setAuto]      = useState<AutomatableBounty[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [totalAll, setTotalAll]     = useState<number | null>(null);
  const [totalAuto, setTotalAuto]   = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExpanded(null);
    try {
      const url = tab === "all"
        ? `${API_BASE}/v1/bounties?limit=${LIMIT}&page=${page}`
        : `${API_BASE}/v1/bounties/automatable?limit=${LIMIT}&page=${page}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { data: Bounty[]; pagination: Pagination };
      if (tab === "all") {
        setBounties(data.data);
        setTotalAll(data.pagination.total);
      } else {
        setAuto(data.data as AutomatableBounty[]);
        setTotalAuto(data.pagination.total);
      }
      setPagination(data.pagination);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  // Fetch totals for both tabs on mount
  useEffect(() => {
    fetch(`${API_BASE}/v1/bounties?limit=1`).then(r => r.json()).then((d: { pagination: Pagination }) => setTotalAll(d.pagination.total)).catch(() => null);
    fetch(`${API_BASE}/v1/bounties/automatable?limit=1`).then(r => r.json()).then((d: { pagination: Pagination }) => setTotalAuto(d.pagination.total)).catch(() => null);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Reset page when switching tabs
  const switchTab = (t: "all" | "auto") => {
    setTab(t);
    setPage(1);
  };

  const displayed = tab === "all" ? bounties : automatable;
  const totalPages = pagination ? Math.ceil(pagination.total / LIMIT) : 1;

  return (
    <div className="min-h-screen pt-10" style={{ background: "#060606" }}>
      <div className="rule-accent" />

      <div className="max-w-[1400px] mx-auto">

        {/* ── Page header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-5">
            <button
              onClick={onBack}
              className="text-[10px] tracking-widest transition-colors duration-100 pr-5 border-r border-[#1a1a1a]"
              style={{ color: "#2e2e2e" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#c8ff00")}
              onMouseLeave={e => (e.currentTarget.style.color = "#2e2e2e")}
            >
              ← HOME
            </button>
            <h1 className="text-[11px] font-bold tracking-widest" style={{ color: "#e8e8e8" }}>
              PUMP.FUN GO — BOUNTIES
            </h1>
            {totalAll !== null && (
              <span className="text-[10px]" style={{ color: "#2e2e2e" }}>
                {totalAll} active
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border border-[#1a1a1a]">
            {([
              { key: "all",  label: "ALL",          count: totalAll },
              { key: "auto", label: "AUTOMATABLE",  count: totalAuto },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className="flex items-center gap-2 px-4 py-1.5 text-[10px] tracking-widest transition-colors duration-100"
                style={{
                  background: tab === t.key ? "#c8ff00" : "transparent",
                  color: tab === t.key ? "#060606" : "#333",
                  borderRight: t.key === "all" ? "1px solid #1a1a1a" : "none",
                  fontWeight: tab === t.key ? "bold" : "normal",
                }}
              >
                {t.label}
                {t.count !== null && (
                  <span
                    className="text-[9px] px-1"
                    style={{
                      background: tab === t.key ? "#060606" : "#111",
                      color: tab === t.key ? "#c8ff00" : "#444",
                    }}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Column headers ────────────────────────────────────────── */}
        <div
          className="flex items-center px-8 py-2 border-b border-[#111] text-[10px] tracking-widest"
          style={{ color: "#2a2a2a", background: "#040404" }}
        >
          <div className="w-10 shrink-0">#</div>
          <div className="flex-1 min-w-0">TITLE</div>
          <div className="w-28 shrink-0 text-right">REWARD</div>
          {tab === "auto" && <div className="w-16 shrink-0 text-right">EFFORT</div>}
          {tab === "auto" && <div className="w-20 shrink-0 text-right">CONF.</div>}
          <div className="w-16 shrink-0 text-right">LINK</div>
        </div>

        {/* ── Content ──────────────────────────────────────────────── */}
        {loading && (
          <div className="px-8 py-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-11 mb-px border border-[#0d0d0d]" style={{ background: "#0a0a0a", opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="px-8 py-10 text-[12px]" style={{ color: "#ff5555" }}>
            ✗ {error}
            <div className="mt-2 text-[10px]" style={{ color: "#2e2e2e" }}>
              make sure the API server is running on :4021
            </div>
          </div>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div className="px-8 py-16 text-center">
            <div className="text-[11px] leading-7" style={{ color: "#2e2e2e" }}>
              {tab === "auto"
                ? "> AI classification not yet run — all bounties unclassified"
                : "> no bounties found"}
            </div>
          </div>
        )}

        {!loading && !error && displayed.length > 0 && (
          <div>
            {displayed.map((bounty, i) => {
              const auto = tab === "auto" ? (bounty as AutomatableBounty) : null;
              const reward = parseFloat(bounty.rewardUsd);
              const isOpen = expanded === bounty.id;
              const rowNum = (page - 1) * LIMIT + i + 1;

              return (
                <div key={bounty.id} style={{ borderBottom: "1px solid #0d0d0d" }}>
                  <button
                    className="w-full flex items-center px-8 py-3 text-left transition-colors duration-100"
                    style={{ background: isOpen ? "#0c0c0c" : i % 2 === 0 ? "#060606" : "#080808" }}
                    onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "#0a0a0a"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isOpen ? "#0c0c0c" : i % 2 === 0 ? "#060606" : "#080808"; }}
                    onClick={() => setExpanded(isOpen ? null : bounty.id)}
                  >
                    <div className="w-10 shrink-0 text-[10px]" style={{ color: "#2a2a2a" }}>
                      {String(rowNum).padStart(3, "0")}
                    </div>
                    <div className="flex-1 min-w-0 pr-6 text-[12px] truncate" style={{ color: isOpen ? "#e8e8e8" : "#c8c8c8" }}>
                      {bounty.title}
                    </div>
                    <div className="w-28 shrink-0 text-right font-bold text-[13px]" style={{ color: "#c8ff00" }}>
                      ${isNaN(reward) ? "?" : reward < 1 ? reward.toFixed(2) : Math.round(reward).toLocaleString()}
                    </div>
                    {tab === "auto" && auto && (
                      <div className="w-16 shrink-0 text-right">
                        <span
                          className="text-[10px] px-1.5 py-0.5 font-bold"
                          style={{
                            color: EFFORT[auto.classification.effortEstimate]?.color ?? "#555",
                            border: `1px solid ${EFFORT[auto.classification.effortEstimate]?.color ?? "#555"}30`,
                          }}
                        >
                          {EFFORT[auto.classification.effortEstimate]?.label ?? "?"}
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
                        <p className="text-[12px] leading-6 mb-3 max-w-3xl" style={{ color: "#666" }}>
                          {bounty.description}
                        </p>
                      ) : (
                        <p className="text-[11px]" style={{ color: "#222" }}>— no description —</p>
                      )}
                      {auto?.classification.reasoning && (
                        <div className="mt-3 pl-3 text-[11px] leading-5 border-l-2 max-w-2xl" style={{ color: "#555", borderColor: "#c8ff0030" }}>
                          <span className="text-[10px] tracking-widest" style={{ color: "#2e2e2e" }}>AI: </span>
                          {auto.classification.reasoning}
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-6 text-[10px]" style={{ color: "#222" }}>
                        <span>status: <span style={{ color: "#444" }}>{bounty.status}</span></span>
                        {bounty.link && (
                          <a href={bounty.link} target="_blank" rel="noreferrer"
                            style={{ color: "#2e2e2e" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#c8ff00")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#2e2e2e")}
                          >
                            view on pump.fun →
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────── */}
        {!loading && pagination && totalPages > 1 && (
          <div
            className="flex items-center justify-between px-8 py-4 border-t border-[#1a1a1a]"
            style={{ background: "#040404" }}
          >
            <span className="text-[10px]" style={{ color: "#2e2e2e" }}>
              {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, pagination.total)} of {pagination.total.toLocaleString()}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2 py-1 text-[10px] border border-[#1a1a1a] transition-colors duration-100 disabled:opacity-20"
                style={{ color: "#444" }}
                onMouseEnter={e => { if (page !== 1) e.currentTarget.style.color = "#c8ff00"; }}
                onMouseLeave={e => (e.currentTarget.style.color = "#444")}
              >
                «
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-[10px] border border-[#1a1a1a] transition-colors duration-100 disabled:opacity-20"
                style={{ color: "#444" }}
                onMouseEnter={e => { if (page !== 1) e.currentTarget.style.color = "#c8ff00"; }}
                onMouseLeave={e => (e.currentTarget.style.color = "#444")}
              >
                ← prev
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 7) {
                  p = i + 1;
                } else if (page <= 4) {
                  p = i + 1;
                } else if (page >= totalPages - 3) {
                  p = totalPages - 6 + i;
                } else {
                  p = page - 3 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-8 py-1 text-[10px] border border-[#1a1a1a] transition-colors duration-100"
                    style={{
                      background: p === page ? "#c8ff00" : "transparent",
                      color: p === page ? "#060606" : "#333",
                      fontWeight: p === page ? "bold" : "normal",
                    }}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-[10px] border border-[#1a1a1a] transition-colors duration-100 disabled:opacity-20"
                style={{ color: "#444" }}
                onMouseEnter={e => { if (page !== totalPages) e.currentTarget.style.color = "#c8ff00"; }}
                onMouseLeave={e => (e.currentTarget.style.color = "#444")}
              >
                next →
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-2 py-1 text-[10px] border border-[#1a1a1a] transition-colors duration-100 disabled:opacity-20"
                style={{ color: "#444" }}
                onMouseEnter={e => { if (page !== totalPages) e.currentTarget.style.color = "#c8ff00"; }}
                onMouseLeave={e => (e.currentTarget.style.color = "#444")}
              >
                »
              </button>
            </div>

            <span className="text-[10px]" style={{ color: "#2e2e2e" }}>
              page {page} / {totalPages}
            </span>
          </div>
        )}

        {/* Footer note */}
        <div
          className="px-8 py-3 flex items-center justify-between border-t border-[#1a1a1a]"
          style={{ background: "#020202" }}
        >
          <span className="text-[10px]" style={{ color: "#1e1e1e" }}>
            source: livestream-api.pump.fun · synced via worker every 60s
          </span>
          <span className="text-[10px]" style={{ color: "#1e1e1e" }}>
            AI: gpt-4o-mini · digital_automatable classification
          </span>
        </div>
      </div>
    </div>
  );
}
