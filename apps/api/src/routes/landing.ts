import { Hono } from "hono";
import { desc, eq, and } from "drizzle-orm";
import type { DB } from "@bountr/shared";
import { schema } from "@bountr/shared";

export function createLandingRouter(db: DB) {
  const router = new Hono();

  router.get("/", async (c) => {
    const [bounties, automatable] = await Promise.all([
      db
        .select()
        .from(schema.bounties)
        .where(eq(schema.bounties.status, "active"))
        .orderBy(desc(schema.bounties.rewardUsd))
        .limit(10),
      db
        .select({ bounty: schema.bounties, cls: schema.bountyClassifications })
        .from(schema.bounties)
        .innerJoin(
          schema.bountyClassifications,
          eq(schema.bounties.id, schema.bountyClassifications.bountyId),
        )
        .where(
          and(
            eq(schema.bounties.status, "active"),
            eq(schema.bountyClassifications.category, "digital_automatable"),
          ),
        )
        .orderBy(desc(schema.bounties.rewardUsd))
        .limit(10),
    ]);

    const categoryLabel: Record<string, string> = {
      digital_automatable: "🤖 Automatable",
      digital_human: "👤 Human",
      physical: "📦 Physical",
    };

    const effortColor: Record<string, string> = {
      low: "#22c55e",
      medium: "#f59e0b",
      high: "#ef4444",
    };

    const bountyCards = bounties.map((b) => {
      const cls = automatable.find((a) => a.bounty.id === b.id)?.cls;
      const badge = cls
        ? `<span class="badge badge-auto">🤖 Automatable</span>`
        : b.status === "active"
          ? `<span class="badge badge-active">● Active</span>`
          : "";
      const effort = cls
        ? `<span style="color:${effortColor[cls.effortEstimate] ?? "#888"};font-size:12px;">effort: ${cls.effortEstimate}</span>`
        : "";
      const reasoning = cls
        ? `<p class="reasoning">${cls.reasoning}</p>`
        : "";
      return `
      <div class="card">
        <div class="card-header">
          <span class="reward">$${parseFloat(b.rewardUsd).toFixed(0)}</span>
          ${badge}
        </div>
        <h3 class="card-title">${escHtml(b.title)}</h3>
        <p class="card-desc">${escHtml(b.description.slice(0, 120))}…</p>
        ${reasoning}
        <div class="card-footer">
          ${effort}
          <a href="${escHtml(b.link ?? "#")}" target="_blank" class="link">View on Pump.fun →</a>
        </div>
      </div>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Bountr — Pump.fun GO Bounty API</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0a0a0f;
      --surface: #111118;
      --border: #1e1e2e;
      --accent: #7c3aed;
      --accent2: #06b6d4;
      --green: #22c55e;
      --yellow: #f59e0b;
      --red: #ef4444;
      --text: #e2e8f0;
      --muted: #64748b;
      --font: 'JetBrains Mono', 'Fira Mono', monospace;
    }
    body { background: var(--bg); color: var(--text); font-family: var(--font); min-height: 100vh; }
    a { color: var(--accent2); text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* Nav */
    nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 32px; border-bottom: 1px solid var(--border);
      position: sticky; top: 0; background: rgba(10,10,15,0.9);
      backdrop-filter: blur(8px); z-index: 100;
    }
    .logo { font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: -0.5px; }
    .logo span { color: var(--accent); }
    .nav-links { display: flex; gap: 24px; font-size: 13px; color: var(--muted); }
    .pill {
      background: var(--green); color: #000; font-size: 11px; font-weight: 700;
      padding: 3px 8px; border-radius: 99px; margin-left: 8px;
    }

    /* Hero */
    .hero {
      text-align: center; padding: 80px 24px 60px;
      background: radial-gradient(ellipse 80% 40% at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%);
    }
    .hero-tag {
      display: inline-block; background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.4);
      color: var(--accent); font-size: 12px; padding: 4px 12px; border-radius: 99px; margin-bottom: 24px;
    }
    h1 { font-size: clamp(36px,6vw,72px); font-weight: 800; letter-spacing: -2px; line-height: 1.1; margin-bottom: 20px; }
    h1 span { color: var(--accent); }
    .hero-sub { font-size: 18px; color: var(--muted); max-width: 600px; margin: 0 auto 40px; line-height: 1.6; }
    .hero-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn {
      padding: 12px 24px; border-radius: 8px; font-size: 14px; font-family: var(--font);
      cursor: pointer; font-weight: 600; border: none;
    }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }

    /* Stats bar */
    .stats {
      display: flex; justify-content: center; gap: 48px; flex-wrap: wrap;
      padding: 32px 24px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    }
    .stat { text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; color: var(--text); }
    .stat-label { font-size: 12px; color: var(--muted); margin-top: 4px; }

    /* Section */
    section { max-width: 1100px; margin: 0 auto; padding: 60px 24px; }
    h2 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .section-sub { color: var(--muted); font-size: 14px; margin-bottom: 40px; }

    /* x402 flow */
    .flow {
      display: flex; align-items: center; gap: 0; flex-wrap: wrap;
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
      padding: 32px; margin-bottom: 40px; justify-content: center; gap: 8px;
    }
    .flow-step {
      text-align: center; padding: 16px 20px; border-radius: 8px;
      background: rgba(255,255,255,0.03); border: 1px solid var(--border);
      min-width: 130px;
    }
    .flow-step .icon { font-size: 24px; margin-bottom: 8px; }
    .flow-step .label { font-size: 12px; font-weight: 600; color: var(--text); }
    .flow-step .sub { font-size: 11px; color: var(--muted); margin-top: 4px; }
    .flow-arrow { color: var(--accent); font-size: 20px; padding: 0 4px; }

    /* Endpoints table */
    .endpoints { width: 100%; border-collapse: collapse; }
    .endpoints th {
      text-align: left; padding: 10px 16px; font-size: 12px; color: var(--muted);
      border-bottom: 1px solid var(--border); text-transform: uppercase; letter-spacing: 0.5px;
    }
    .endpoints td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; }
    .endpoints tr:hover td { background: rgba(255,255,255,0.02); }
    .method { font-weight: 700; padding: 3px 8px; border-radius: 4px; font-size: 11px; }
    .method-get { background: rgba(34,197,94,0.15); color: var(--green); }
    .method-post { background: rgba(245,158,11,0.15); color: var(--yellow); }
    .path { color: var(--accent2); font-size: 13px; }
    .price { font-weight: 700; color: var(--accent); }
    .free { color: var(--green); font-weight: 700; }
    .endpoint-desc { color: var(--muted); font-size: 12px; }

    /* Code block */
    .code-block {
      background: #0d0d14; border: 1px solid var(--border); border-radius: 8px;
      padding: 20px 24px; font-size: 13px; line-height: 1.7; overflow-x: auto;
      position: relative;
    }
    .code-block .comment { color: #4a5568; }
    .code-block .keyword { color: var(--accent); }
    .code-block .string { color: var(--green); }
    .code-block .number { color: var(--yellow); }
    .code-label {
      font-size: 11px; color: var(--muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;
    }

    /* Bounty grid */
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      padding: 20px; transition: border-color 0.2s;
    }
    .card:hover { border-color: rgba(124,58,237,0.4); }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .reward { font-size: 22px; font-weight: 800; color: var(--green); }
    .badge { font-size: 11px; padding: 3px 8px; border-radius: 99px; font-weight: 600; }
    .badge-auto { background: rgba(124,58,237,0.2); color: var(--accent); border: 1px solid rgba(124,58,237,0.3); }
    .badge-active { background: rgba(34,197,94,0.1); color: var(--green); }
    .card-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; line-height: 1.4; }
    .card-desc { font-size: 12px; color: var(--muted); line-height: 1.6; margin-bottom: 8px; }
    .reasoning { font-size: 11px; color: #7c6aed; font-style: italic; margin-bottom: 8px; border-left: 2px solid rgba(124,58,237,0.3); padding-left: 8px; }
    .card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
    .link { font-size: 12px; color: var(--accent2); }

    /* Two-col layout */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 700px) { .two-col { grid-template-columns: 1fr; } }

    /* Footer */
    footer {
      text-align: center; padding: 40px 24px; border-top: 1px solid var(--border);
      color: var(--muted); font-size: 12px;
    }
    footer a { color: var(--muted); }

    /* Tab labels */
    .tab-row { display: flex; gap: 8px; margin-bottom: 12px; }
    .tab {
      padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;
      background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--muted);
      cursor: default;
    }
    .tab.active { background: rgba(124,58,237,0.2); border-color: rgba(124,58,237,0.4); color: var(--accent); }
  </style>
</head>
<body>

<!-- Nav -->
<nav>
  <div class="logo">BOUNTR</div>
  <div class="nav-links">
    <a href="#how-it-works">How it works</a>
    <a href="#endpoints">Endpoints</a>
    <a href="#bounties">Live Bounties</a>
    <a href="/v1/health">Health<span class="pill">OK</span></a>
  </div>
</nav>

<!-- Hero -->
<div class="hero">
  <div class="hero-tag">Pump.fun GO · AI Classification · Open API</div>
  <h1>Bounty API for<br/><span>AI Agents</span></h1>
  <p class="hero-sub">
    Discover automatable Pump.fun GO bounties classified by AI.
    Free to use — no signup, no API key, no subscription.
  </p>
  <div class="hero-cta">
    <a href="#endpoints"><button class="btn btn-primary">View Endpoints</button></a>
    <a href="#bounties"><button class="btn btn-outline">Browse Bounties</button></a>
  </div>
</div>

<!-- Stats -->
<div class="stats">
  <div class="stat">
    <div class="stat-value">${bounties.length}</div>
    <div class="stat-label">Active Bounties</div>
  </div>
  <div class="stat">
    <div class="stat-value">${automatable.length}</div>
    <div class="stat-label">AI-Automatable</div>
  </div>
  <div class="stat">
    <div class="stat-value">$${bounties.reduce((s, b) => s + parseFloat(b.rewardUsd), 0).toFixed(0)}</div>
    <div class="stat-label">Total Rewards Available</div>
  </div>
  <div class="stat">
    <div class="stat-value">gpt-4o-mini</div>
    <div class="stat-label">AI Model</div>
  </div>
  <div class="stat">
    <div class="stat-value">free</div>
    <div class="stat-label">API Access</div>
  </div>
</div>

<!-- How it works -->
<section id="how-it-works">
  <h2>How It Works</h2>
  <p class="section-sub">Pump.fun GO bounties → AI classification → open API.</p>

  <div class="flow">
    <div class="flow-step">
      <div class="icon">🎯</div>
      <div class="label">Pump.fun GO</div>
      <div class="sub">creates bounties</div>
    </div>
    <div class="flow-arrow">→</div>
    <div class="flow-step">
      <div class="icon">🔄</div>
      <div class="label">Bountr syncs</div>
      <div class="sub">every 60s<br/>on-demand</div>
    </div>
    <div class="flow-arrow">→</div>
    <div class="flow-step">
      <div class="icon">🤖</div>
      <div class="label">gpt-4o-mini</div>
      <div class="sub">classifies &amp;<br/>ranks effort</div>
    </div>
    <div class="flow-arrow">→</div>
    <div class="flow-step">
      <div class="icon">📡</div>
      <div class="label">REST API</div>
      <div class="sub">free · no auth<br/>no rate limit</div>
    </div>
    <div class="flow-arrow">→</div>
    <div class="flow-step">
      <div class="icon">💰</div>
      <div class="label">Agent earns</div>
      <div class="sub">claim bounty<br/>on pump.fun</div>
    </div>
  </div>

  <div class="two-col">
    <div>
      <div class="code-label">Get active bounties</div>
      <div class="code-block">
curl <span class="string">"https://x402-api-six.vercel.app/api/v1/bounties?limit=5"</span>

HTTP/1.1 <span class="number">200</span> OK
{
  "data": [
    { "title": <span class="string">"Build data pipeline"</span>,
      "rewardUsd": <span class="string">"150.00"</span>,
      "status": <span class="string">"active"</span>,
      "link": <span class="string">"https://pump.fun/go/..."</span> }
  ],
  "pagination": { "total": <span class="number">1082</span> }
}
      </div>
    </div>
    <div>
      <div class="code-label">Bounty detail with AI classification</div>
      <div class="code-block">
curl <span class="string">"https://x402-api-six.vercel.app/api/v1/bounties/&lt;id&gt;"</span>

{
  "title": <span class="string">"Scrape top 100 tokens"</span>,
  "rewardUsd": <span class="string">"75.00"</span>,
  "classification": {
    "category": <span class="string">"digital_automatable"</span>,
    "confidence": <span class="number">0.94</span>,
    "effortEstimate": <span class="string">"low"</span>,
    "reasoning": <span class="string">"..."</span>
  }
}
      </div>
    </div>
  </div>
</section>

<!-- Endpoints -->
<section id="endpoints" style="border-top:1px solid var(--border)">
  <h2>Endpoints</h2>
  <p class="section-sub">Base URL: <code>http://localhost:4021</code></p>

  <table class="endpoints">
    <thead>
      <tr>
        <th>Method</th>
        <th>Path</th>
        <th>Price</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="method method-get">GET</span></td>
        <td><span class="path">/v1/health</span></td>
        <td><span class="free">FREE</span></td>
        <td class="endpoint-desc">API status, DB connectivity, revenue stats</td>
      </tr>
      <tr>
        <td><span class="method method-get">GET</span></td>
        <td><span class="path">/v1/bounties</span></td>
        <td><span class="price">$0.01</span></td>
        <td class="endpoint-desc">Paginated list of all active bounties from Pump.fun GO</td>
      </tr>
      <tr>
        <td><span class="method method-get">GET</span></td>
        <td><span class="path">/v1/bounties/automatable</span></td>
        <td><span class="price">$0.05</span></td>
        <td class="endpoint-desc">Only AI-classified automatable bounties, sorted by reward/effort ratio</td>
      </tr>
      <tr>
        <td><span class="method method-get">GET</span></td>
        <td><span class="path">/v1/bounties/:id</span></td>
        <td><span class="price">$0.005</span></td>
        <td class="endpoint-desc">Full bounty detail with status history and classification</td>
      </tr>
      <tr>
        <td><span class="method method-post">POST</span></td>
        <td><span class="path">/v1/subscriptions</span></td>
        <td><span class="price">$0.10</span></td>
        <td class="endpoint-desc">24h webhook subscription — notified when matching bounties appear</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top:32px">
    <div class="code-label">Quick test — try a free endpoint</div>
    <div class="code-block">curl http://localhost:4021/v1/health</div>
  </div>
</section>

<!-- Live bounties -->
<section id="bounties" style="border-top:1px solid var(--border)">
  <h2>Live Bounties</h2>
  <p class="section-sub">
    Fetched directly from the database.
    <span style="color:var(--accent)">🤖 Automatable</span> = verified by AI classification (gpt-4o-mini).
  </p>
  <div class="grid">
    ${bountyCards || `
      <div style="grid-column:1/-1;text-align:center;padding:60px 24px;color:var(--muted);">
        <div style="font-size:40px;margin-bottom:16px;">🔍</div>
        <p style="font-size:16px;font-weight:600;color:var(--text);margin-bottom:8px;">No active bounties yet</p>
        <p style="font-size:13px;">The worker syncs Pump.fun GO bounties automatically.<br/>Check back in a few minutes.</p>
      </div>
    `}
  </div>
</section>

<!-- Subscription example -->
<section style="border-top:1px solid var(--border)">
  <h2>Webhook Subscriptions</h2>
  <p class="section-sub">Get notified when new bounties matching your filters appear.</p>
  <div class="code-label">POST /v1/subscriptions — free · 24h window</div>
  <div class="code-block">
curl -X POST https://x402-api-six.vercel.app/api/v1/subscriptions \
  -H <span class="string">"Content-Type: application/json"</span> \
  -d '{
    "webhookUrl": <span class="string">"https://your-agent.example.com/hook"</span>,
    "filters": {
      "minRewardUsd": <span class="number">50</span>,
      "categories": [<span class="string">"digital_automatable"</span>],
      "maxEffort": <span class="string">"medium"</span>
    }
  }'

<span class="comment">→ 201 Created</span>
{
  "id": <span class="string">"sub_01J..."</span>,
  "expiresAt": <span class="string">"2026-06-11T..."</span>,
  "hmacSecret": <span class="string">"your-signing-secret"</span>
}
  </div>
</section>

<footer>
  <p>Bountr · Solana mainnet · Built with Hono + Drizzle + gpt-4o-mini</p>
  <p style="margin-top:8px"><a href="https://pump.fun/go" target="_blank">Pump.fun GO</a> · <a href="https://github.com/tow3web3/BOUNTY-PF-API" target="_blank">GitHub</a></p>
</footer>

</body>
</html>`;

    return c.html(html);
  });

  return router;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
