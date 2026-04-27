"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getAlumni } from "@/lib/actions/alumni.actions";
import type { Alumni, AlumniFilters, PaginatedResult } from "@/types";

export function useAlumni(filters: AlumniFilters, page: number, pageSize: number) {
  const [data, setData] = useState<PaginatedResult<Alumni> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await getAlumni(filters, page, pageSize);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      setData(result.data);
      setError(null);
    }
    setLoading(false);
  }, [filters, page, pageSize]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
