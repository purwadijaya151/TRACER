"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getTracerStudies, getTracerSummary } from "@/lib/actions/tracer-study.actions";
import type { PaginatedResult, TracerStudy, TracerStudyFilters } from "@/types";
import type { TracerSummary } from "@/lib/tracer-summary";

export function useTracerStudy(filters: TracerStudyFilters, page: number, pageSize: number) {
  const [data, setData] = useState<PaginatedResult<TracerStudy> | null>(null);
  const [summary, setSummary] = useState<TracerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshRows = useCallback(async () => {
    setLoading(true);
    const rows = await getTracerStudies(filters, page, pageSize);

    if (rows.error) toast.error(rows.error);
    else setData(rows.data);
    setLoading(false);
  }, [filters, page, pageSize]);

  const refreshSummary = useCallback(async () => {
    const summaryResult = await getTracerSummary(filters);
    if (summaryResult.error) toast.error(summaryResult.error);
    else setSummary(summaryResult.data);
  }, [filters]);

  const refresh = useCallback(async () => {
    await Promise.all([refreshRows(), refreshSummary()]);
  }, [refreshRows, refreshSummary]);

  useEffect(() => {
    void refreshRows();
  }, [refreshRows]);

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  return { data, summary, loading, refresh };
}
