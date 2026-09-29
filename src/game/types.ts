export type DayLog = {
  sec: number;
  pages: number;
  xp: number;
  sessions: number;
  longest: number;
  newBooks: number;
  chapters: number;
  early?: boolean;
  late?: boolean;
  goalMet?: boolean;
  frozen?: boolean;
  quests: string[];
};

export type CelebrationKind = 'level' | 'achievement' | 'goal' | 'finish' | 'quest' | 'freeze' | 'streak';

export type Celebration = {
  id: string;
  kind: CelebrationKind;
  title: string;
  subtitle: string;
  big?: string;
  xp?: number;
};

export const emptyDay = (): DayLog => ({
  sec: 0,
  pages: 0,
  xp: 0,
  sessions: 0,
  longest: 0,
  newBooks: 0,
  chapters: 0,
  quests: [],
});
