-- 7:00 PM IST is 01:30 PM UTC
-- The cron format is: min hour dom month dow
SELECT cron.schedule(
  'end-of-day-summary-cron',
  '30 13 * * *',
  $$
    SELECT net.http_post(
        url:='https://jybkjinujujlsvqsercv.supabase.co/functions/v1/cron-end-of-day-summary',
        headers:='{"Content-Type": "application/json"}'::jsonb,
        body:='{"source": "pg_cron"}'::jsonb
    ) as request_id;
  $$
);
