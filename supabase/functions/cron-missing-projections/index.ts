// @ts-nocheck
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

    // Standard fixed-date Indian National Holidays (MM-DD)
    const indianHolidays = ['01-26', '08-15', '10-02', '12-25', '01-01', '05-01'];
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const isHoliday = indianHolidays.includes(`${month}-${day}`);

    // Check if it's Sunday (0 = Sunday in JS) or a Holiday
    if (d.getDay() === 0 || isHoliday) {
        return new Response(JSON.stringify({ success: true, message: 'It is a Sunday or Holiday. No missing projection notifications sent.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Allow testing for yesterday by passing a date via payload, otherwise default to today
    const reqBody = await req.json().catch(() => ({}));
    const dateStr = reqBody.testDate ? reqBody.testDate : d.toISOString().split('T')[0];

    // 1. Hardcoded branches (since they are static in the frontend)
    const branches = [
        { id: 'b1', name: 'Guwahati', manager_email: 'mis.ghy@siroiforex.com' },
        { id: 'b2', name: 'Manipur', manager_email: 'mis.manipur@siroiforex.com' },
        { id: 'b3', name: 'Itanagar', manager_email: 'mis.itanagar@siroiforex.com' },
        { id: 'b4', name: 'Nagaland & Mizoram', manager_email: 'mis.mizonaga@siroiforex.com' }
    ];

    // 2. Get today's projections to see who has filled them
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('branchId')
      .eq('entryDate', dateStr)
      .eq('recordType', 'projection');

    if (entriesError) throw entriesError;

    const branchesWithEntries = new Set(entries.map(e => e.branchId));
    const missingBranches = branches.filter(b => !branchesWithEntries.has(b.id));

    if (missingBranches.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'All branches have lodged their projections today.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. For each missing branch, collect the target emails
    const branchManagerEmails = missingBranches.map(b => b.manager_email).filter(Boolean);
    const adminEmails = ['tomas@siroiforex.com', 'surchanddsingh@siroiforex.com', 'sharjuthoudam@siroiforex.com'];
    const allEmails = [...new Set([...branchManagerEmails, ...adminEmails])];

    // 4. Find user_ids for these emails
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .in('email', allEmails);
      
    if (usersError) throw usersError;
    const targetUserIds = users.map(u => u.id);

    // 5. Get push tokens for these users
    const { data: tokensData, error: tokensError } = await supabase
      .from('user_push_tokens')
      .select('token, user_id, email')
      .in('user_id', targetUserIds);

    if (tokensError) throw tokensError;

    if (!tokensData || tokensData.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No push tokens found.' }), {
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

    const pushTasks: Promise<Response>[] = [];

    // 7. Send notification to Admins
    const adminTokens = tokensData.filter(t => adminEmails.includes(t.email));
    const adminSummary = `Missing Projections Alert: ${missingBranches.length} branches haven't lodged projections today (${missingBranches.map(b => b.name).join(', ')}).`;

    adminTokens.forEach(t => {
        pushTasks.push(fetch(fcmUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken?.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: {
                    token: t.token,
                    notification: { title: `Missing Projections ⚠️`, body: adminSummary },
                    data: { action: "missing_projection_admin" }
                }
            })
        }));
    });

    // 8. Send custom push to Branch Managers
    branches.forEach(branch => {
        const isMissing = missingBranches.some(mb => mb.id === branch.id);
        if (!isMissing || !branch.manager_email) return;

        const user = users.find(u => u.email === branch.manager_email);
        if (!user) return;

        const managerTokens = tokensData.filter(t => t.user_id === user.id);
        if (managerTokens.length === 0) return;

        const randomMsg = quirkyMessages[Math.floor(Math.random() * quirkyMessages.length)]
          .replace('{branchName}', branch.name);

        managerTokens.forEach(t => {
            pushTasks.push(fetch(fcmUrl, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${accessToken?.token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: {
                  token: t.token,
                  notification: { title: `Missing Projection! 📋`, body: randomMsg },
                  data: { action: "missing_projection_branch", branchId: branch.id }
                }
              })
            }));
        });
    });

    await Promise.all(pushTasks);

    return new Response(JSON.stringify({ success: true, message: `Sent notifications to ${pushTasks.length} devices.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
