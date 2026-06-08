import { useState, useEffect } from "react";

const BASE = "/api";

export interface Bounty {
  id: string;
  externalId: string;
  title: string;
  description: string;
  rewardUsd: string;
  link: string | null;
  status: string;
  createdAt: string;
}

export interface Classification {
  category: string;
  confidence: number;
  effortEstimate: string;
  reasoning: string;
  rewardToEffortRatio?: number;
}

export interface AutomatableBounty extends Bounty {
  classification: Classification;
}

export interface Health {
  status: string;
  version: string;
  db: string;
  revenue: Record<string, unknown>;
}

function useFetch<T>(url: string, interval = 30000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetch(url)
        .then((r) => r.json())
        .then((d) => { if (active) { setData(d); setLoading(false); } })
        .catch((e) => { if (active) { setError(String(e)); setLoading(false); } });
    };
    load();
    const t = setInterval(load, interval);
    return () => { active = false; clearInterval(t); };
  }, [url, interval]);

  return { data, loading, error };
}

export function useHealth() {
  return useFetch<Health>(`${BASE}/v1/health`);
}

export function useBountiesCount() {
  const { data } = useFetch<{ pagination: { total: number } }>(`${BASE}/v1/health`, 30000);
  return data;
}
