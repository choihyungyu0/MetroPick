-- MetroPick Supabase RLS policy draft.
-- Review before execution. Do not run directly in production without approval.
-- Assumption for user-owned tables: user_id is uuid and stores auth.users.id.
-- If user_id is text, replace auth.uid() with auth.uid()::text consistently.
-- Supabase service_role bypasses RLS and remains available to trusted backend code.

begin;

-- saved_reports
alter table public.saved_reports enable row level security;

drop policy if exists "Users can read own saved reports" on public.saved_reports;
create policy "Users can read own saved reports"
on public.saved_reports
for select
using (user_id = auth.uid());

drop policy if exists "Users can insert own saved reports" on public.saved_reports;
create policy "Users can insert own saved reports"
on public.saved_reports
for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update own saved reports" on public.saved_reports;
create policy "Users can update own saved reports"
on public.saved_reports
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own saved reports" on public.saved_reports;
create policy "Users can delete own saved reports"
on public.saved_reports
for delete
using (user_id = auth.uid());

-- saved_locations
alter table public.saved_locations enable row level security;

drop policy if exists "Users can read own saved locations" on public.saved_locations;
create policy "Users can read own saved locations"
on public.saved_locations
for select
using (user_id = auth.uid());

drop policy if exists "Users can insert own saved locations" on public.saved_locations;
create policy "Users can insert own saved locations"
on public.saved_locations
for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update own saved locations" on public.saved_locations;
create policy "Users can update own saved locations"
on public.saved_locations
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own saved locations" on public.saved_locations;
create policy "Users can delete own saved locations"
on public.saved_locations
for delete
using (user_id = auth.uid());

-- prediction_results
alter table public.prediction_results enable row level security;

drop policy if exists "Users can read own prediction results" on public.prediction_results;
create policy "Users can read own prediction results"
on public.prediction_results
for select
using (user_id = auth.uid());

drop policy if exists "Users can insert own prediction results" on public.prediction_results;
create policy "Users can insert own prediction results"
on public.prediction_results
for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update own prediction results" on public.prediction_results;
create policy "Users can update own prediction results"
on public.prediction_results
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own prediction results" on public.prediction_results;
create policy "Users can delete own prediction results"
on public.prediction_results
for delete
using (user_id = auth.uid());

-- notification_settings
alter table public.notification_settings enable row level security;

drop policy if exists "Users can read own notification settings" on public.notification_settings;
create policy "Users can read own notification settings"
on public.notification_settings
for select
using (user_id = auth.uid());

drop policy if exists "Users can insert own notification settings" on public.notification_settings;
create policy "Users can insert own notification settings"
on public.notification_settings
for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update own notification settings" on public.notification_settings;
create policy "Users can update own notification settings"
on public.notification_settings
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own notification settings" on public.notification_settings;
create policy "Users can delete own notification settings"
on public.notification_settings
for delete
using (user_id = auth.uid());

-- onboarding_settings
alter table public.onboarding_settings enable row level security;

drop policy if exists "Users can read own onboarding settings" on public.onboarding_settings;
create policy "Users can read own onboarding settings"
on public.onboarding_settings
for select
using (user_id = auth.uid());

drop policy if exists "Users can insert own onboarding settings" on public.onboarding_settings;
create policy "Users can insert own onboarding settings"
on public.onboarding_settings
for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update own onboarding settings" on public.onboarding_settings;
create policy "Users can update own onboarding settings"
on public.onboarding_settings
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own onboarding settings" on public.onboarding_settings;
create policy "Users can delete own onboarding settings"
on public.onboarding_settings
for delete
using (user_id = auth.uid());

-- profiles
-- Preferred strategy: profiles.id matches auth.users.id.
-- Execute this block only after confirming profiles.id stores Supabase Auth user ids.
/*
alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
on public.profiles
for delete
using (id = auth.uid());
*/

-- Temporary email strategy for profiles if profiles.id is not auth.users.id.
-- Use only after confirming email is unique, normalized, and trusted.
/*
alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile by email" on public.profiles;
create policy "Users can read own profile by email"
on public.profiles
for select
using (email = (auth.jwt() ->> 'email'));

drop policy if exists "Users can insert own profile by email" on public.profiles;
create policy "Users can insert own profile by email"
on public.profiles
for insert
with check (email = (auth.jwt() ->> 'email'));

drop policy if exists "Users can update own profile by email" on public.profiles;
create policy "Users can update own profile by email"
on public.profiles
for update
using (email = (auth.jwt() ->> 'email'))
with check (email = (auth.jwt() ->> 'email'));
*/

commit;
