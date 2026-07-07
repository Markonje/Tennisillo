-- Add inviteCode column and unique index if absent (handles db-push drift)
ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "inviteCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "League_inviteCode_key" ON "League"("inviteCode");

-- Backfill invite codes for leagues that have none.
-- Charset matches the TS helper: excludes 0/O, 1/I/l/L to reduce visual ambiguity.
DO $$
DECLARE
  charset TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code    TEXT;
  retries INT;
  r       RECORD;
BEGIN
  FOR r IN SELECT id FROM "League" WHERE "inviteCode" IS NULL LOOP
    retries := 0;
    LOOP
      code := '';
      FOR i IN 1..8 LOOP
        code := code || substr(charset, (floor(random() * 32) + 1)::int, 1);
      END LOOP;

      BEGIN
        UPDATE "League" SET "inviteCode" = code WHERE id = r.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        retries := retries + 1;
        IF retries >= 10 THEN
          RAISE EXCEPTION 'Cannot generate unique invite code for league %', r.id;
        END IF;
      END;
    END LOOP;
  END LOOP;
END $$;
