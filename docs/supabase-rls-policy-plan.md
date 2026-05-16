# Supabase RLS Policy Plan

## Purpose

This document defines the review-ready Row Level Security (RLS) design for MetroPick user-owned Supabase data. It is a planning document only. Do not apply the SQL draft to production without schema review, test data review, and rollback approval.

## Current Auth Flow

- React uses Supabase Auth with the public publishable key only.
- The Supabase SDK owns browser session storage; MetroPick does not manually store access tokens.
- FastAPI accepts optional `Authorization: Bearer <supabase_access_token>` headers.
- When a valid token is present, FastAPI verifies it with Supabase and derives the authenticated user id.
- Backend create/list endpoints prefer the authenticated user id over any client-supplied `user_id`.
- If no token exists, the current demo/localStorage fallback and nullable `user_id` behavior remain available for MVP usage.

## Current Limitation

The backend now prefers verified identities, but strict database-level enforcement is not enabled yet. Without RLS, service role backend code can still read/write any row, and any future direct browser-to-Supabase access would need table policies before it is safe.

## Target RLS Model

- Enable RLS on user-owned tables.
- Authenticated users can read, insert, update, and delete only rows they own.
- Ownership is represented by `user_id = auth.uid()` for user-owned tables.
- Existing rows with `user_id is null` are not exposed to regular authenticated users by the strict policies.
- Backend/server operations using the Supabase service role remain possible because the service role bypasses RLS for trusted administrative operations.
- Unauthenticated users cannot access protected rows directly after strict RLS is enabled.
- Demo/localStorage fallback remains a frontend/backend behavior, not a direct database access rule.

## Tables Covered

- `profiles`
- `saved_reports`
- `saved_locations`
- `prediction_results`
- `notification_settings`
- `onboarding_settings`

## Policy Behavior Per Table

### saved_reports

- Select: user can read only rows where `user_id = auth.uid()`.
- Insert: user can insert only rows where `user_id = auth.uid()`.
- Update: user can update only rows where the existing row and new row both keep `user_id = auth.uid()`.
- Delete: user can delete only rows where `user_id = auth.uid()`.

### saved_locations

Same ownership model as `saved_reports`.

### prediction_results

Same ownership model as `saved_reports`.

### notification_settings

Same ownership model as `saved_reports`. Consider a later uniqueness rule such as one row per user if the product should allow only one active notification settings record.

### onboarding_settings

Same ownership model as `saved_reports`. Consider a later uniqueness rule such as one row per user if onboarding should keep only the latest settings row.

### profiles

Profiles need one extra schema decision before strict production RLS:

- Preferred strategy: make `profiles.id` match `auth.users.id`, then use `id = auth.uid()`.
- Current compatibility concern: the existing profile API upserts by `email`; if `profiles.id` is currently a random UUID, enabling an `id = auth.uid()` policy without migration can hide or block existing profiles.
- Temporary strategy if email-based profiles must be kept: use an email policy based on the authenticated JWT email claim after confirming email uniqueness and normalization.

Do not apply a profile RLS policy until the actual `profiles.id` ownership strategy is confirmed.

## Migration Order

1. Back up the Supabase project or create a restore point.
2. Confirm column types:
   - `user_id` should be `uuid` for user-owned tables, or all SQL must consistently cast `auth.uid()` to the stored type.
   - `profiles.id` ownership strategy must be confirmed before enabling profile RLS.
3. Audit nullable rows:
   - Count rows where `user_id is null`.
   - Decide whether to backfill, archive, leave for service-role-only access, or delete test data.
4. Confirm FastAPI sends verified user ids when bearer tokens are present.
5. Apply RLS draft in a staging Supabase project first.
6. Run authenticated user A/user B isolation tests.
7. Verify service role backend operations still work.
8. Apply to production only after review approval.

## Rollback Plan

Use rollback only if staging or production access is unexpectedly blocked:

```sql
alter table public.saved_reports disable row level security;
alter table public.saved_locations disable row level security;
alter table public.prediction_results disable row level security;
alter table public.notification_settings disable row level security;
alter table public.onboarding_settings disable row level security;
-- Disable profiles RLS only if it was enabled during a reviewed migration.
-- alter table public.profiles disable row level security;
```

If specific policies need to be removed, use `drop policy if exists ... on public.<table>;` with the policy names in `docs/supabase-rls-policies.sql`.

## Testing Checklist

- User A signs in and creates a saved report.
- User A can read, update, and delete that saved report.
- User B signs in and cannot read User A's saved report.
- User B cannot update or delete User A's saved report.
- User A creates saved location, prediction result, notification settings, and onboarding settings rows.
- User B cannot read User A's rows from those tables.
- Unauthenticated direct Supabase requests cannot access protected rows after strict RLS is enabled.
- FastAPI requests with a valid bearer token still scope data to the authenticated user.
- FastAPI requests without a token continue to use the current MVP fallback path where applicable.
- Backend service role operations still work for admin/server tasks.
- Existing nullable `user_id` rows are not accidentally exposed to authenticated users.

Example manual checks:

```bash
# User A token should see only User A rows.
curl "$SUPABASE_REST_URL/saved_reports?select=*" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer $USER_A_ACCESS_TOKEN"

# User B token should not see User A rows.
curl "$SUPABASE_REST_URL/saved_reports?select=*" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer $USER_B_ACCESS_TOKEN"

# No token should not return protected rows after strict RLS.
curl "$SUPABASE_REST_URL/saved_reports?select=*" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY"
```

## Risks And Cautions

- Applying RLS before backfilling ownership can hide existing nullable rows from users.
- A `user_id` type mismatch between `uuid` and `text` can break policies. Confirm the actual column type before executing SQL.
- Profile ownership is not fully settled until `profiles.id` is aligned with Supabase Auth ids or a reviewed email policy is accepted.
- Service role keys must stay backend-only and must never be added to Vite or React environment variables.
- RLS should be tested in staging before production because policy mistakes can block legitimate user data.
- SQL in `docs/supabase-rls-policies.sql` is a draft. It must be reviewed, adapted to the actual schema, and executed manually.
