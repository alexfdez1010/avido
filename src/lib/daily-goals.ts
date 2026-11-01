/** Sunday first, matching Date.getDay(); the editor presents Monday first. */
export type WeekGoals = [number, number, number, number, number, number, number];

export type DailyGoals = {
  dailyGoalMin: number;
  weeklyGoalsEnabled?: boolean;
  weeklyGoalMin?: WeekGoals | null;
};

export function isWeekGoals(value: unknown): value is WeekGoals {
  return Array.isArray(value) && value.length === 7 && value.every((v) =>
    typeof v === 'number' && Number.isInteger(v) && v >= 5 && v <= 180);
}

export function uniformWeekGoal(minutes: number): WeekGoals {
  return [minutes, minutes, minutes, minutes, minutes, minutes, minutes];
}

export function dailyGoalForDate(settings: DailyGoals, date = new Date()): number {
  return settings.weeklyGoalsEnabled && isWeekGoals(settings.weeklyGoalMin)
    ? settings.weeklyGoalMin[date.getDay()]
    : settings.dailyGoalMin;
}
