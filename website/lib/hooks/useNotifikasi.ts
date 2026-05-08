"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getNotifications, getNotificationStats } from "@/lib/actions/notifikasi.actions";
import type { NotificationBroadcast, NotificationFilters, PaginatedResult } from "@/types";

export function useNotifikasi(filters: NotificationFilters, page: number, pageSize: number) {
  const [data, setData] = useState<PaginatedResult<NotificationBroadcast> | null>(null);
  const [stats, setStats] = useState<{ total: number; read: number; unread: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshRows = useCallback(async () => {
    setLoading(true);
    const rows = await getNotifications(filters, page, pageSize);

    if (rows.error) toast.error(rows.error);
    else setData(rows.data);
    setLoading(false);
  }, [filters, page, pageSize]);

  const refreshStats = useCallback(async () => {
    const statResult = await getNotificationStats();
    if (statResult.error) toast.error(statResult.error);
    else setStats(statResult.data);
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([refreshRows(), refreshStats()]);
  }, [refreshRows, refreshStats]);

  useEffect(() => {
    void refreshRows();
  }, [refreshRows]);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  return { data, stats, loading, refresh };
}
