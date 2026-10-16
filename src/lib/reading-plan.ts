export const SESSION_TARGETS = [5, 15, 30] as const;
export type SessionTarget = (typeof SESSION_TARGETS)[number];
export const DEFAULT_SESSION_TARGET: SessionTarget = 5;

export function parseSessionTarget(value: string | string[] | undefined): SessionTarget | null {
  if (typeof value !== 'string') return null;
  return SESSION_TARGETS.find((target) => String(target) === value) ?? null;
}
