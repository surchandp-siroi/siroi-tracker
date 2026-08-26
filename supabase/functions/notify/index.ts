// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_SENDER_NUMBER = Deno.env.get('TWILIO_SENDER_NUMBER');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { JWT } from 'npm:google-auth-library@9.6.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const generateEmailHtml = (name: string, message: string, highlightedBox: string = '', boxLabel: string = '') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Siroi Forex Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); max-width: 600px; margin: 0 auto;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #4f46e5; padding: 32px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">SIROI FOREX</h1>
                            <p style="margin: 5px 0 0 0; color: #ffffff; font-size: 11px; font-weight: 600; letter-spacing: 3px; opacity: 0.9;">VENDOR PORTAL</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 48px 40px;">
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #334155;">
                                ${name ? `Dear <strong>${name}</strong>,` : 'Hello,'}
                            </p>
                            <p style="margin: 0 0 32px; font-size: 16px; line-height: 24px; color: #334155;">
                                ${message}
                            </p>
                            ${highlightedBox ? `
                            <!-- Highlight Box -->
                            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px; border: 1px dashed #cbd5e1;">
                                <span style="display: block; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 12px;">${boxLabel}</span>
                                <span style="display: block; font-family: monospace; font-size: 42px; font-weight: 700; color: #4f46e5; letter-spacing: 8px;">${highlightedBox}</span>
                            </div>
                            ` : ''}
                            <p style="margin: 0 0 24px; font-size: 14px; line-height: 22px; color: #64748b;">
                                If you did not request this email, you can safely ignore it. Your account remains secure.
                            </p>
                            <!-- Signature -->
                            <p style="margin: 0; font-size: 16px; line-height: 24px; color: #334155;">
                                Regards,<br>
                                <strong>Siroi Forex IT Support Team</strong>
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                                © ${new Date().getFullYear()} Siroi Forex. All rights reserved.<br>
                                This is an automated message, please do not reply.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();

    if (action === 'onboarding_approved') {
      const { email, name } = payload;
      
      // Send Email via Resend
      if (RESEND_API_KEY) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'Siroi Vendor Onboard <ithelp@siroiforex.com>',
            to: [email],
            subject: 'Welcome to Siroi Forex - Onboarding Approved!',
            html: generateEmailHtml(name, 'Welcome to the Siroi Forex family! Your consultant onboarding request has been successfully approved and validated.'),
          })
        });
        
        if (!res.ok) {
           console.error("Resend Error", await res.text());
        }
      }
      return new Response(JSON.stringify({ success: true, message: 'Onboarding notification sent.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'payout_settled') {
      const { email, name, phone, amount } = payload;
      
      const tasks = [];

      // Send Email via Resend
      if (RESEND_API_KEY) {
        tasks.push(
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
              from: 'Siroi Settlement <ithelp@siroiforex.com>',
              to: [email],
              subject: 'Payout Settled',
              html: generateEmailHtml(name, 'Your recent payout has been successfully settled and disbursed to your account. Please see the details below.', `₹${amount}`, 'Settlement Amount'),
            })
          })
        );
      }

      // Send WhatsApp via Twilio
      if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_SENDER_NUMBER && phone) {
        // Format phone number to E.164 if not already (assuming India for now, e.g. +91)
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        
        const params = new URLSearchParams();
        params.append('To', `whatsapp:${formattedPhone}`);
        params.append('From', `whatsapp:${TWILIO_SENDER_NUMBER}`);
        params.append('Body', `Hello ${name}, your payout of ₹${amount} has been successfully settled.`);

        tasks.push(
          fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
            },
            body: params.toString()
          })
        );
      }

      await Promise.all(tasks);

      return new Response(JSON.stringify({ success: true, message: 'Payout notifications sent.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'projection_updated') {
      const { branchName, totalAmount, authorName } = payload;
      
      const FIREBASE_SERVICE_ACCOUNT_BASE64 = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_BASE64');
      
      if (!FIREBASE_SERVICE_ACCOUNT_BASE64) {
        console.log("No FIREBASE_SERVICE_ACCOUNT_BASE64 secret found, skipping push notification.");
        return new Response(JSON.stringify({ success: false, message: 'Firebase not configured.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Format currency
      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(totalAmount);

      // Get Admins' tokens
      const { data: tokensData, error } = await supabase
        .from('user_push_tokens')
        .select('token, email')
        .in('email', ['tomas@siroiforex.com', 'surchanddsingh@siroiforex.com', 'sharjuthoudam@siroiforex.com']);

      if (error || !tokensData || tokensData.length === 0) {
        console.log("No admin push tokens found.", error);
        return new Response(JSON.stringify({ success: true, message: 'No tokens found.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate Access Token
      const serviceAccountStr = atob(FIREBASE_SERVICE_ACCOUNT_BASE64);
      const serviceAccount = JSON.parse(serviceAccountStr);

      const client = new JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
      });

      const accessToken = await client.getAccessToken();
      const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

      // Send to each token
      const pushTasks = tokensData.map(t => {
        return fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken?.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: {
              token: t.token,
              notification: {
                title: `New Projection: ${branchName}`,
                body: `${authorName || 'An executive'} updated projections totaling ${formattedAmount}`
              },
              data: {
                action: "projection_update"
              }
            }
          })
        });
      });

      await Promise.all(pushTasks);

      return new Response(JSON.stringify({ success: true, message: 'Push notifications sent to admins.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'app_updated') {
      const FIREBASE_SERVICE_ACCOUNT_BASE64 = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_BASE64');
      
      if (!FIREBASE_SERVICE_ACCOUNT_BASE64) {
        console.log("No FIREBASE_SERVICE_ACCOUNT_BASE64 secret found, skipping push notification.");
        return new Response(JSON.stringify({ success: false, message: 'Firebase not configured.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get ALL tokens
      const { data: tokensData, error } = await supabase
        .from('user_push_tokens')
        .select('token');

      if (error || !tokensData || tokensData.length === 0) {
        console.log("No push tokens found.", error);
        return new Response(JSON.stringify({ success: true, message: 'No tokens found.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate Access Token
      const serviceAccountStr = atob(FIREBASE_SERVICE_ACCOUNT_BASE64);
      const serviceAccount = JSON.parse(serviceAccountStr);

      const client = new JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
      });

      const accessToken = await client.getAccessToken();
      const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

      // Send to each token
      const pushTasks = tokensData.map(t => {
        return fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken?.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: {
              token: t.token,
              notification: {
                title: `App Update Available! 🚀`,
                body: `A new version of Siroi Tracker is available. Please open the menu and tap Update App.`
              },
              data: {
                action: "app_update_available"
              }
            }
          })
        });
      });

      const responses = await Promise.all(pushTasks);
      for (const res of responses) {
        const body = await res.text();
        console.log(`FCM Response: ${res.status} ${res.statusText}`, body);
      }

      return new Response(JSON.stringify({ success: true, message: 'Push notifications sent to all users.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
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
