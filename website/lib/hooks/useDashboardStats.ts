"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getDashboardStats } from "@/lib/actions/dashboard.actions";
import { INDONESIAN_ERRORS } from "@/lib/constants";
import type { DashboardStats } from "@/types";

export function useDashboardStats() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await getDashboardStats();
    if (result.error) {
      setError(result.error);
      toast.error(result.error || INDONESIAN_ERRORS.load);
    } else {
      setData(result.data);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
