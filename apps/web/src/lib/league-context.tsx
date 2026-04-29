'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface LeagueMember {
  id: string;
  role: string;
  isActive: boolean;
  user: {
    id: string;
    displayName: string;
    globalLevel: string;
  };
}

interface LeagueSettings {
  sparringEnabled: boolean;
  masterLessonsEnabled: boolean;
}

export interface LeagueContextValue {
  id: string;
  name: string;
  sport: string;
  type: string;
  description: string | null;
  inviteCode: string | null;
  ownerId: string;
  members: LeagueMember[];
  settings: LeagueSettings | null;
}

const LeagueContext = createContext<LeagueContextValue | null>(null);

export function LeagueProvider({
  children,
  league,
}: {
  children: ReactNode;
  league: LeagueContextValue;
}) {
  return <LeagueContext.Provider value={league}>{children}</LeagueContext.Provider>;
}

export function useLeague(): LeagueContextValue | null {
  return useContext(LeagueContext);
}
