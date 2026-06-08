import { describe, it, expect } from "vitest";
import { normalizeBounty, hashDescription } from "../normalizer";

describe("normalizeBounty", () => {
  it("normalizes a well-formed REST response", () => {
    const raw = {
      id: "abc123",
      title: "  Scrape Twitter data  ",
      description: "Collect top 100 tweets about Solana",
      reward_usd: 25,
      deadline: "2026-12-31T00:00:00Z",
      url: "https://go.pump.fun/bounty/abc123",
      status: "active",
    };

    const result = normalizeBounty(raw);
    expect(result).not.toBeNull();
    expect(result!.externalId).toBe("abc123");
    expect(result!.title).toBe("Scrape Twitter data");
    expect(result!.rewardUsd).toBe(25);
    expect(result!.status).toBe("active");
    expect(result!.deadline).toBeInstanceOf(Date);
  });

  it("accepts numeric id", () => {
    const raw = { id: 99, title: "Test", description: "desc", reward_usd: 10, url: "https://go.pump.fun/bounty/99", status: "open" };
    const result = normalizeBounty(raw);
    expect(result).not.toBeNull();
    expect(result!.externalId).toBe("99");
    expect(result!.status).toBe("active"); // "open" → "active"
  });

  it("normalises alternative field names (amount / link / slug)", () => {
    const raw = {
      id: "x1",
      title: "T",
      description: "D",
      amount: "15.5",
      slug: "my-bounty",
      status: "live",
    };
    const result = normalizeBounty(raw);
    expect(result).not.toBeNull();
    expect(result!.rewardUsd).toBe(15.5);
    expect(result!.link).toContain("my-bounty");
    expect(result!.status).toBe("active"); // "live" → "active"
  });

  it("returns null for missing link", () => {
    const raw = { id: "no-link", title: "T", description: "D", reward_usd: 10, status: "active" };
    expect(normalizeBounty(raw)).toBeNull();
  });

  it("returns null for zero reward", () => {
    const raw = { id: "zero", title: "T", description: "D", reward_usd: 0, url: "https://x.com", status: "active" };
    expect(normalizeBounty(raw)).toBeNull();
  });

  it("maps status aliases correctly", () => {
    const statusMap: Record<string, string> = {
      done: "completed",
      paid: "completed",
      expired: "expired",
      closed: "expired",
      cancelled: "cancelled",
      canceled: "cancelled",
    };

    for (const [input, expected] of Object.entries(statusMap)) {
      const raw = { id: input, title: "T", description: "D", reward_usd: 5, url: "https://x.com", status: input };
      const result = normalizeBounty(raw);
      expect(result?.status).toBe(expected);
    }
  });

  it("handles unix timestamp deadlines", () => {
    const ts = 1893456000; // 2030-01-01
    const raw = { id: "ts", title: "T", description: "D", reward_usd: 5, url: "https://x.com", status: "active", deadline: ts };
    const result = normalizeBounty(raw);
    expect(result?.deadline).toBeInstanceOf(Date);
    expect(result!.deadline!.getFullYear()).toBe(2030);
  });
});

describe("hashDescription", () => {
  it("produces a 16-char hex string", () => {
    const h = hashDescription("hello world");
    expect(h).toHaveLength(16);
    expect(/^[0-9a-f]+$/.test(h)).toBe(true);
  });

  it("is deterministic", () => {
    expect(hashDescription("foo")).toBe(hashDescription("foo"));
  });

  it("changes on different input", () => {
    expect(hashDescription("foo")).not.toBe(hashDescription("bar"));
  });
});
