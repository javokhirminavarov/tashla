import { useCallback } from "react";
import { api } from "../lib/api";
import type { HabitProfile, HabitType } from "../lib/types";

export function useProfiles(
  profiles: HabitProfile[],
  setProfiles: (profiles: HabitProfile[]) => void,
  refreshProfiles: () => Promise<void>
) {
  const createProfile = useCallback(
    async (data: {
      habit_type: HabitType;
      daily_baseline: number;
      daily_limit?: number;
      cost_per_unit?: number;
      target_quit_date?: string;
    }) => {
      const profile = await api.createProfile(data);
      const existing = profiles.findIndex(
        (p) => p.habit_type === data.habit_type
      );
      if (existing >= 0) {
        const updated = [...profiles];
        updated[existing] = profile;
        setProfiles(updated);
      } else {
        setProfiles([...profiles, profile]);
      }
      return profile;
    },
    [profiles, setProfiles]
  );

  const deleteProfile = useCallback(
    async (habitType: HabitType) => {
      await api.deleteProfile(habitType);
      setProfiles(profiles.filter((p) => p.habit_type !== habitType));
    },
    [profiles, setProfiles]
  );

  return { createProfile, deleteProfile, refreshProfiles };
}
