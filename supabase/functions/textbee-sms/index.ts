// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const TEXTBEE_API_KEY = Deno.env.get('TEXTBEE_API_KEY');
const SEND_SMS_HOOK_SECRET = Deno.env.get('SEND_SMS_HOOK_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawSecret = SEND_SMS_HOOK_SECRET ?? "";
    const secret = rawSecret.replace(/^v\d+,whsec_/, "");

    const headers = Object.fromEntries(req.headers.entries());
    const body = await req.text(); // Read as raw text for signature validation

    const wh = new Webhook(secret);
    let payload;
    try {
      payload = wh.verify(body, headers);
    } catch (err) {
      console.error("Signature verification failed:", err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user, sms } = payload;

    if (!user?.phone || !sms?.otp) {
      console.error("Missing required fields: user.phone or sms.otp");
      return new Response(JSON.stringify({ error: 'Bad Request: Missing phone or otp' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!TEXTBEE_API_KEY) {
      console.error("Missing TEXTBEE_API_KEY in environment variables.");
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const phone = user.phone.startsWith('+') ? user.phone : `+${user.phone}`;
    const message = `Your Siroi Forex login code is ${sms.otp}\nFA+9qCX9VSu`;

    console.log(`Routing OTP for ${phone} via TextBee...`);

    const res = await fetch('https://api.textbee.dev/api/v1/gateway/send-sms', {
      method: 'POST',
      headers: {
        'x-api-key': TEXTBEE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipients: [phone],
        message: message
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("TextBee API Error:", errorText);
      return new Response(JSON.stringify({ error: 'Failed to route SMS via TextBee' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Successfully dispatched SMS via TextBee to ${phone}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Internal Edge Function Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
