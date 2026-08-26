-- Enable the pg_net extension to make HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 11:00 AM IST is 05:30 AM UTC
-- The cron format is: min hour dom month dow
SELECT cron.schedule(
  'missing-projections-cron',
  '30 5 * * *',
  $$
    SELECT net.http_post(
        url:='https://jybkjinujujlsvqsercv.supabase.co/functions/v1/cron-missing-projections',
        headers:='{"Content-Type": "application/json"}'::jsonb,
        body:='{"source": "pg_cron"}'::jsonb
    ) as request_id;
  $$
);
