// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SEND_EMAIL_HOOK_SECRET = Deno.env.get('SEND_EMAIL_HOOK_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateEmailHtml(otp: string) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Siroi Forex Portal OTP</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030816; margin: 0; padding: 40px 20px; color: #f8fafc;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background: linear-gradient(145deg, #0d1527, #131c38); border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden;">
      <tr>
        <td style="padding: 40px 32px 24px 32px; text-align: center;">
          <div style="display: inline-block; padding: 12px 24px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 100px; margin-bottom: 24px;">
            <span style="color: #818cf8; font-weight: 700; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">Siroi Financial Consultancy</span>
          </div>
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.5px;">Your One-Time Passkey</h1>
          <p style="color: #94a3b8; font-size: 14px; line-height: 22px; margin: 0 0 32px 0;">Use the 6-digit verification code below to securely authenticate into your branch portal.</p>
          
          <div style="background: rgba(15, 23, 42, 0.6); border: 2px dashed rgba(99, 102, 241, 0.4); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
            <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; color: #ffffff; letter-spacing: 10px; display: inline-block; margin-left: 10px;">${otp}</span>
          </div>

          <p style="color: #64748b; font-size: 12px; line-height: 18px; margin: 0 0 8px 0;">This passkey is valid for 10 minutes. Do not share this code with anyone.</p>
          <p style="color: #64748b; font-size: 12px; line-height: 18px; margin: 0;">If you did not request this code, please contact IT support immediately.</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 32px 32px 32px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
          <p style="color: #475569; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Siroi Forex Pvt. Ltd. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawSecret = SEND_EMAIL_HOOK_SECRET ?? "";
    const secret = rawSecret.replace(/^v\d+,whsec_/, "");

    const headers = Object.fromEntries(req.headers.entries());
    const body = await req.text();

    let payload: any;
    if (secret) {
      const wh = new Webhook(secret);
      try {
        payload = wh.verify(body, headers);
      } catch (err) {
        console.error("Email Hook signature verification failed:", err);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      payload = JSON.parse(body);
    }

    const { user, email_data } = payload;
    const recipientEmail = user?.email;
    const otp = email_data?.token || email_data?.token_hash;

    if (!recipientEmail || !otp) {
      console.error("Missing recipient email or OTP in payload:", payload);
      return new Response(JSON.stringify({ error: 'Missing recipient email or token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY in environment variables.");
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Sending Email OTP to ${recipientEmail} via Resend...`);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Siroi Forex Portal <ithelp@siroiforex.com>',
        to: [recipientEmail],
        subject: `Your Siroi Portal Passkey: ${otp}`,
        html: generateEmailHtml(otp),
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend API Error:", errText);
      return new Response(JSON.stringify({ error: 'Failed to send email via Resend' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Successfully dispatched Email OTP to ${recipientEmail} via Resend`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Internal Email Hook Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
