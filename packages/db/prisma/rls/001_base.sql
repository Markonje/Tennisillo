-- packages/db/prisma/rls/001_base.sql
-- Row Level Security — base policies (DRAFT, not yet applied)
-- Apply these after running migrations and enabling RLS on each table.
-- To apply: run in Supabase SQL editor or via psql DIRECT_URL.
--
-- Convention: "auth.uid()" returns the Supabase user UUID (supabaseId in our schema).
-- We map it to app user via: SELECT id FROM "User" WHERE "supabaseId" = auth.uid()

-- ─────────────────────────────────────────
-- Enable RLS (run once per table after CREATE TABLE)
-- ─────────────────────────────────────────

-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "League" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "LeagueMember" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Match" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "ScoreDelta" ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- User
-- ─────────────────────────────────────────

-- Users can read their own profile; admins can read all.
-- CREATE POLICY "user_select_own" ON "User"
--   FOR SELECT USING (
--     "supabaseId" = auth.uid()
--     OR EXISTS (
--       SELECT 1 FROM "User" u WHERE u."supabaseId" = auth.uid() AND u.role = 'SUPER_ADMIN'
--     )
--   );

-- Users can update only their own profile.
-- CREATE POLICY "user_update_own" ON "User"
--   FOR UPDATE USING ("supabaseId" = auth.uid());

-- ─────────────────────────────────────────
-- League
-- ─────────────────────────────────────────

-- PUBLIC leagues are readable by all authenticated users.
-- PRIVATE leagues are readable only by members.
-- CREATE POLICY "league_select" ON "League"
--   FOR SELECT USING (
--     type = 'PUBLIC'
--     OR EXISTS (
--       SELECT 1 FROM "LeagueMember" lm
--       JOIN "User" u ON u.id = lm."userId"
--       WHERE lm."leagueId" = "League".id
--         AND u."supabaseId" = auth.uid()
--         AND lm."isActive" = true
--     )
--   );

-- ─────────────────────────────────────────
-- LeagueMember
-- ─────────────────────────────────────────

-- Members of a league can see all other members of the same league.
-- CREATE POLICY "leaguemember_select" ON "LeagueMember"
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM "LeagueMember" lm
--       JOIN "User" u ON u.id = lm."userId"
--       WHERE lm."leagueId" = "LeagueMember"."leagueId"
--         AND u."supabaseId" = auth.uid()
--         AND lm."isActive" = true
--     )
--   );

-- ─────────────────────────────────────────
-- Match
-- ─────────────────────────────────────────

-- Members of the season's league can see all matches.
-- CREATE POLICY "match_select" ON "Match"
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM "Season" s
--       JOIN "LeagueMember" lm ON lm."leagueId" = s."leagueId"
--       JOIN "User" u ON u.id = lm."userId"
--       WHERE s.id = "Match"."seasonId"
--         AND u."supabaseId" = auth.uid()
--         AND lm."isActive" = true
--     )
--   );

-- Only players involved in the match can insert a result.
-- CREATE POLICY "match_insert_result" ON "MatchResult"
--   FOR INSERT WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM "Match" m
--       JOIN "SeasonPlayer" sp ON sp.id IN (m."player1Id", m."player2Id")
--       JOIN "LeagueMember" lm ON lm.id = sp."memberId"
--       JOIN "User" u ON u.id = lm."userId"
--       WHERE m.id = "MatchResult"."matchId"
--         AND u."supabaseId" = auth.uid()
--     )
--   );

-- ─────────────────────────────────────────
-- ScoreDelta
-- ─────────────────────────────────────────

-- ScoreDeltas are readable by members of the league (for transparency).
-- Never writable directly by users — always written by the scoring worker.
-- CREATE POLICY "scoredelta_select" ON "ScoreDelta"
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM "Match" m
--       JOIN "Season" s ON s.id = m."seasonId"
--       JOIN "LeagueMember" lm ON lm."leagueId" = s."leagueId"
--       JOIN "User" u ON u.id = lm."userId"
--       WHERE m.id = "ScoreDelta"."matchId"
--         AND u."supabaseId" = auth.uid()
--         AND lm."isActive" = true
--     )
--   );
