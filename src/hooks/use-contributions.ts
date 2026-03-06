"use client";

import { useState, useEffect, useCallback } from "react";
import type { Contribution, AnalyticsData } from "@/lib/types";

export function useContributions(params?: {
  limit?: number;
  offset?: number;
  type?: string;
  repo?: string;
  search?: string;
}) {
  const [data, setData] = useState<Contribution[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.type && params.type !== "all") query.set("type", params.type);
    if (params?.repo) query.set("repo", params.repo);
    if (params?.search) query.set("search", params.search);

    const res = await fetch(`/api/contributions?${query}`);
    const json = await res.json();
    setData(json.data);
    setTotal(json.total);
    setLoading(false);
  }, [params?.limit, params?.offset, params?.type, params?.repo, params?.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener("contributions-updated", handler);
    return () => window.removeEventListener("contributions-updated", handler);
  }, [fetchData]);

  return { data, total, loading, refetch: fetchData };
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/analytics");
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener("contributions-updated", handler);
    return () => window.removeEventListener("contributions-updated", handler);
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}
