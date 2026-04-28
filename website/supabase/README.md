# Supabase Remote Setup

Project ref: `efutimhekjhqrwmrzmew`

Remote setup is managed by Supabase CLI from this `website` directory.

## Login/link flow

1. Create a Supabase access token from the dashboard.
2. Set `SUPABASE_ACCESS_TOKEN` in your shell.
3. Run:

```bash
npm run supabase:link
npm run supabase:push:dry
npm run supabase:push
```

## Direct database URL flow

If CLI login is not available, copy the Session Pooler connection string from Supabase Dashboard > Connect.

Use this shape:

```bash
npx supabase db push --include-all --db-url "$SUPABASE_DB_URL"
```

Prefer the Session Pooler URL for IPv4 networks:

```text
postgres://postgres.[project-ref]:[db-password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

The direct database host can be IPv6-only, so it may fail on networks without IPv6.

## Migration

The initial migration is:

```text
supabase/migrations/20260428103415_init_schema.sql
```

It mirrors `supabase/schema.sql` and includes the admin web, Android questionnaire, notification, storage, trigger, and RLS setup.
