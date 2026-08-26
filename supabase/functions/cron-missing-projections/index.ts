import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { JWT } from "https://esm.sh/google-auth-library@9.14.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const quirkyMessages = [
  "Hey {branchName}, the tumbleweeds are blowing through your projections. Care to fill them in? 🌵",
  "Did {branchName} forget the way to the projection board? We're waiting! ⏳",
  "Knock knock, {branchName}. It's 11 AM and your projections are still asleep 😴",
  "Is {branchName} playing hide and seek with today's numbers? 🫣",
  "Breaking news: {branchName}’s projections are missing in action! 🚨",
  "Hola {branchName}! Your projections are feeling a little left out today. 🥺",
  "A wild missing projection appeared at {branchName}! Gotta catch 'em all! 🕵️"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const FIREBASE_SERVICE_ACCOUNT_BASE64 = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_BASE64');

    if (!supabaseUrl || !supabaseServiceKey || !FIREBASE_SERVICE_ACCOUNT_BASE64) {
      throw new Error("Missing Supabase or Firebase environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date string in local timezone (IST) for matching
    const d = new Date();
    d.setUTCHours(d.getUTCHours() + 5);
    d.setUTCMinutes(d.getUTCMinutes() + 30);
    const dateStr = d.toISOString().split('T')[0];

    // 1. Get all branches
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, name, manager_email');

    if (branchError) throw branchError;

    // 2. Get today's daily_entries to see who has filled projections
    const { data: entries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('branch_id')
      .eq('date', dateStr);

    if (entriesError) throw entriesError;

    const branchesWithEntries = new Set(entries.map(e => e.branch_id));
    const missingBranches = branches.filter(b => 
      !branchesWithEntries.has(b.id) && 
      b.name !== 'HO' && 
      b.name !== 'Test Branch'
    );

    if (missingBranches.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'All branches have lodged their projections today.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. For each missing branch, collect the target emails
    const targetEmails = missingBranches.map(b => b.manager_email).filter(Boolean);

    // 4. Find user_ids for these emails
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .in('email', targetEmails);
      
    if (usersError) throw usersError;
    const targetUserIds = users.map(u => u.id);

    // 5. Get push tokens for these users
    const { data: tokensData, error: tokensError } = await supabase
      .from('user_push_tokens')
      .select('token, user_id')
      .in('user_id', targetUserIds);

    if (tokensError) throw tokensError;

    if (!tokensData || tokensData.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No push tokens found for missing branches.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Init Firebase Admin
    const serviceAccountStr = atob(FIREBASE_SERVICE_ACCOUNT_BASE64);
    const serviceAccount = JSON.parse(serviceAccountStr);

    const client = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    const accessToken = await client.getAccessToken();
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

    // 7. Send custom push to each token based on their branch
    const pushTasks = tokensData.map(tokenRow => {
      const user = users.find(u => u.id === tokenRow.user_id);
      if (!user) return Promise.resolve();

      const branch = missingBranches.find(b => b.manager_email === user.email);
      if (!branch) return Promise.resolve();

      const randomMsg = quirkyMessages[Math.floor(Math.random() * quirkyMessages.length)]
        .replace('{branchName}', branch.name);

      return fetch(fcmUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            token: tokenRow.token,
            notification: {
              title: `Missing Projection! 📋`,
              body: randomMsg
            },
            data: {
              action: "missing_projection",
              branchId: branch.id
            }
          }
        })
      });
    });

    await Promise.all(pushTasks);

    return new Response(JSON.stringify({ success: true, message: `Sent notifications to ${pushTasks.length} devices.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
