import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import type { TodayCounts, HabitType } from "../lib/types";

export function useLogs() {
  const [todayCounts, setTodayCounts] = useState<TodayCounts>({});
  const [loading, setLoading] = useState(true);

  const fetchToday = useCallback(async () => {
    try {
      const counts = await api.getTodayCounts();
      setTodayCounts(counts);
    } catch (err) {
      console.error("Failed to fetch today counts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const logUsage = useCallback(
    async (habitType: HabitType) => {
      try {
        const result = await api.logUsage(habitType);
        setTodayCounts((prev) => ({
          ...prev,
          [habitType]: result.today_count,
        }));
        return result.today_count;
      } catch (err) {
        console.error("Failed to log usage:", err);
        throw err;
      }
    },
    []
  );

  const undoLog = useCallback(
    async (habitType: HabitType) => {
      try {
        await api.undoLog(habitType);
        await fetchToday();
      } catch (err) {
        console.error("Failed to undo log:", err);
        throw err;
      }
    },
    [fetchToday]
  );

  return { todayCounts, loading, logUsage, undoLog, fetchToday };
}
