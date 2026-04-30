'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { SeasonStatus } from '@tennisillo/shared-types';

export interface SeasonContextValue {
  id: string;
  leagueId: string;
  name: string;
  status: SeasonStatus;
  startsAt: string | null;
  endsAt: string | null;
  maxPlayers: number | null;
  plannedDurationWeeks: number | null;
  playerCount: number;
  createdAt: string;
  updatedAt: string;
}

const SeasonContext = createContext<SeasonContextValue | null>(null);

export function SeasonProvider({
  children,
  season,
}: {
  children: ReactNode;
  season: SeasonContextValue;
}) {
  return <SeasonContext.Provider value={season}>{children}</SeasonContext.Provider>;
}

export function useSeason(): SeasonContextValue | null {
  return useContext(SeasonContext);
}
