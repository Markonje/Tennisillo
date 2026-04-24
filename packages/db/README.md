# @tennisillo/db

Prisma schema, migrations, and database client singleton for Tennisillo.

**Invariant:** this package is the single source of truth for the database schema.
No raw SQL is executed from application code except via Prisma client or explicitly
documented raw queries in `prisma/rls/`.

## Usage

```ts
import { prisma } from '@tennisillo/db';

const user = await prisma.user.findUnique({ where: { supabaseId } });
```

## Scripts

| Command | Description |
|---|---|
| `pnpm --filter db db:validate` | Validate schema without migrating |
| `pnpm --filter db db:generate` | Regenerate Prisma client |
| `pnpm --filter db db:migrate:dev` | Create and apply dev migration (requires DATABASE_URL) |
| `pnpm --filter db db:migrate:deploy` | Apply pending migrations (production) |
| `pnpm --filter db db:seed` | Seed demo data (dev only) |
| `pnpm --filter db db:studio` | Open Prisma Studio |

## RLS

Row Level Security policies live in `prisma/rls/`. They are **not** applied
automatically — apply them manually via Supabase SQL editor after migrations.
