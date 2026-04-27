"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getNotifications, getNotificationStats } from "@/lib/actions/notifikasi.actions";
import type { NotificationBroadcast, NotificationFilters, PaginatedResult } from "@/types";

export function useNotifikasi(filters: NotificationFilters, page: number, pageSize: number) {
  const [data, setData] = useState<PaginatedResult<NotificationBroadcast> | null>(null);
  const [stats, setStats] = useState<{ total: number; read: number; unread: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [rows, statResult] = await Promise.all([
      getNotifications(filters, page, pageSize),
      getNotificationStats()
    ]);

    if (rows.error) toast.error(rows.error);
    else setData(rows.data);

    if (statResult.error) toast.error(statResult.error);
    else setStats(statResult.data);

    setLoading(false);
  }, [filters, page, pageSize]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, stats, loading, refresh };
}
