-- Enable pg_cron extension (Supabase paid plans)
create extension if not exists pg_cron with schema extensions;

-- Optional: dedicated schema for admin functions
create schema if not exists admin;

-- Function: admin.aggregate_daily_stats()
-- Aggregates previous day's usage into admin_daily_stats.
create or replace function admin.aggregate_daily_stats()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stat_date date := (now() at time zone 'UTC')::date - 1;
  v_total_users integer;
  v_new_users integer;
  v_total_workflows integer;
  v_new_workflows integer;
  v_total_analyses integer := 0;  -- TODO: replace when analysis logs are available
  v_new_analyses integer := 0;    -- TODO: replace when analysis logs are available
begin
  -- Total/new users
  select count(*) into v_total_users from profiles;
  select count(*) into v_new_users from profiles where created_at::date = v_stat_date;

  -- Total/new workflows (table name per project schema)
  select count(*) into v_total_workflows from work_workflows;
  select count(*) into v_new_workflows from work_workflows where created_at::date = v_stat_date;

  -- Upsert into admin_daily_stats
  insert into admin_daily_stats (
    stat_date,
    total_users, new_users,
    total_workflows, new_workflows,
    total_analyses, new_analyses
  ) values (
    v_stat_date,
    coalesce(v_total_users, 0), coalesce(v_new_users, 0),
    coalesce(v_total_workflows, 0), coalesce(v_new_workflows, 0),
    coalesce(v_total_analyses, 0), coalesce(v_new_analyses, 0)
  )
  on conflict (stat_date) do update set
    total_users = excluded.total_users,
    new_users = excluded.new_users,
    total_workflows = excluded.total_workflows,
    new_workflows = excluded.new_workflows,
    total_analyses = excluded.total_analyses,
    new_analyses = excluded.new_analyses,
    updated_at = now();
end;
$$;

-- Schedule: daily at 01:05 UTC
-- Note: pg_cron runs in UTC. Adjust schedule as needed.
select cron.schedule(
  'admin_daily_stats_daily',         -- job name
  '5 1 * * *',                       -- CRON (UTC)
  $$ select admin.aggregate_daily_stats(); $$
);

-- Verify scheduled jobs (manual):
-- select * from cron.job order by jobid desc;
