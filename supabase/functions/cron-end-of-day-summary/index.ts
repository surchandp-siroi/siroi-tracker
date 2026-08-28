// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
import { JWT } from "https://esm.sh/google-auth-library@9.14.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

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
        return new Response(JSON.stringify({ success: true, message: 'It is a Sunday or Holiday. No end-of-day summary sent.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Allow testing for yesterday by passing a date via payload, otherwise default to today
    const reqBody = await req.json().catch(() => ({}));
    const dateStr = reqBody.testDate ? reqBody.testDate : d.toISOString().split('T')[0];

    // 1. Hardcoded branches
    const branches = [
        { id: 'b1', name: 'Guwahati', manager_email: 'mis.ghy@siroiforex.com' },
        { id: 'b2', name: 'Manipur', manager_email: 'mis.manipur@siroiforex.com' },
        { id: 'b3', name: 'Itanagar', manager_email: 'mis.itanagar@siroiforex.com' },
        { id: 'b4', name: 'Nagaland & Mizoram', manager_email: 'mis.mizonaga@siroiforex.com' }
    ];

    // 2. Get today's achievements
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('branchId, totalAmount, items')
      .eq('entryDate', dateStr)
      .eq('recordType', 'achievement');

    if (entriesError) throw entriesError;

    const branchAchievements = new Map<string, number>();
    const branchHasItems = new Set<string>();

    entries.forEach(e => {
        const amt = e.totalAmount || 0;
        const currentAmt = branchAchievements.get(e.branchId) || 0;
        branchAchievements.set(e.branchId, currentAmt + amt);
        
        if (e.items && Array.isArray(e.items) && e.items.length > 0) {
            branchHasItems.add(e.branchId);
        }
    });

    const missingBranches = branches.filter(b => !branchHasItems.has(b.id));
    const activeBranches = branches.filter(b => branchHasItems.has(b.id));

    // 3. Collect target emails for branch managers
    const branchManagerEmails = branches.map(b => b.manager_email).filter(Boolean);
    const adminEmails = ['tomas@siroiforex.com', 'surchanddsingh@siroiforex.com', 'sharjuthoudam@siroiforex.com'];
    const allEmails = [...new Set([...branchManagerEmails, ...adminEmails])];

    // 4. Find user_ids for these emails
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .in('email', allEmails);
      
    if (usersError) throw usersError;
    const targetUserIds = users.map(u => u.id);

    // 5. Get push tokens
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
    
    let adminSummary = `Day End Report: ${missingBranches.length} missing. `;
    if (activeBranches.length > 0) {
        const topBranch = activeBranches.reduce((a, b) => (branchAchievements.get(a.id) || 0) > (branchAchievements.get(b.id) || 0) ? a : b);
        adminSummary += `${topBranch.name} led with ${formatCurrency(branchAchievements.get(topBranch.id) || 0)}.`;
    }

    adminTokens.forEach(t => {
        pushTasks.push(fetch(fcmUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken?.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: {
                    token: t.token,
                    notification: { title: `End of Day Summary 📊`, body: adminSummary },
                    data: { action: "end_of_day_summary" }
                }
            })
        }));
    });

    // 8. Send notifications to Branch Managers
    branches.forEach(branch => {
        if (!branch.manager_email) return;
        
        const user = users.find(u => u.email === branch.manager_email);
        if (!user) return;

        const managerTokens = tokensData.filter(t => t.user_id === user.id);
        if (managerTokens.length === 0) return;

        let title = '';
        let body = '';

        if (!branchHasItems.has(branch.id)) {
            title = 'Missing Daily Entries! 🚨';
            body = `Hey ${branch.name}, you haven't logged your daily entries today! Please update them now.`;
        } else {
            const amt = branchAchievements.get(branch.id) || 0;
            title = 'Daily Target Update 🎯';
            body = `Great job ${branch.name}! Today's achievement is ${formatCurrency(amt)}.`;
        }

        managerTokens.forEach(t => {
            pushTasks.push(fetch(fcmUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken?.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: {
                        token: t.token,
                        notification: { title, body },
                        data: { action: "end_of_day_branch", branchId: branch.id }
                    }
                })
            }));
        });
    });

    await Promise.all(pushTasks);

    return new Response(JSON.stringify({ 
        success: true, 
        message: `Sent notifications to ${pushTasks.length} devices.`,
        missing: missingBranches.map(b => b.name),
        achievements: activeBranches.map(b => ({ name: b.name, amount: branchAchievements.get(b.id) }))
    }), {
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
