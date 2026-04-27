"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getTracerStudies, getTracerSummary } from "@/lib/actions/tracer-study.actions";
import type { PaginatedResult, TracerStudy, TracerStudyFilters } from "@/types";

type Summary = {
  avg_ipk: number;
  avg_kesesuaian: number;
  avg_waktu_tunggu: string;
  modal_gaji: string;
};

export function useTracerStudy(filters: TracerStudyFilters, page: number, pageSize: number) {
  const [data, setData] = useState<PaginatedResult<TracerStudy> | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [rows, summaryResult] = await Promise.all([
      getTracerStudies(filters, page, pageSize),
      getTracerSummary(filters)
    ]);

    if (rows.error) toast.error(rows.error);
    else setData(rows.data);

    if (summaryResult.error) toast.error(summaryResult.error);
    else setSummary(summaryResult.data);

    setLoading(false);
  }, [filters, page, pageSize]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, summary, loading, refresh };
}
