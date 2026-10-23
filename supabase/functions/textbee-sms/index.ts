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

    const phone = user.phone.startsWith('+') ? user.phone : `+${user.phone}`;
    const rawNumber = phone.replace(/\D/g, '');

    // 1. Check user channel preference from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jybkjinujujlsvqsercv.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    
    let selectedChannel = 'whatsapp'; // Default to WhatsApp
    if (payload.channel === 'sms' || payload.sms?.channel === 'sms') {
      selectedChannel = 'sms';
    } else {
      try {
        const prefRes = await fetch(`${supabaseUrl}/rest/v1/otp_preferences?phone=eq.${encodeURIComponent(phone)}&select=channel&order=updated_at.desc&limit=1`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        if (prefRes.ok) {
          const prefData = await prefRes.json();
          if (prefData && prefData.length > 0 && prefData[0].channel) {
            selectedChannel = prefData[0].channel;
          }
        }
      } catch (e) {
        console.error("Error fetching channel preference:", e);
      }
    }

    console.log(`User ${phone} selected channel: ${selectedChannel}`);

    // If WhatsApp is chosen
    if (selectedChannel === 'whatsapp') {
      console.log(`Routing OTP for ${phone} via WhatsApp Cloud API (Meta)...`);
      const metaToken = Deno.env.get('WHATSAPP_CLOUD_API_TOKEN') || 'EAAPs7xmoCBUBS6HCoNdNQ56zjSeeAGWgFNZBkwk2sAnzv7b8pOCfPfQoT4PEzyk9EYHHns7Os6ZAZARrosgq9ZA6WeCTIPnqZALYyN05DOp2h5CRC53EQcLB4lKuZAiCZBtb6A3pM7uuNeyrrF22QkA7yUj7UAULrDLmAoJZCVVVYHfrYoXBKXxrDZApJrSqpNQZDZD';
      const metaPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '1334176636447319';

      const metaRes = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: rawNumber,
          type: 'template',
          template: {
            name: 'siroi_auth_otp',
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: sms.otp }
                ]
              },
              {
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [
                  { type: 'text', text: sms.otp }
                ]
              }
            ]
          }
        })
      });

      if (metaRes.ok) {
        console.log(`Successfully dispatched WhatsApp OTP via Meta Cloud API to ${phone}`);
        return new Response(JSON.stringify({ success: true, channel: 'whatsapp' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        const errText = await metaRes.text();
        console.error("Meta WhatsApp Cloud API failed, falling back to SMS:", errText);
      }
    }

    // Default or Fallback: Android SMS Gateway (+918822337819)
    console.log(`Routing OTP for ${phone} via Android SMS Gateway (+918822337819)...`);
    const username = Deno.env.get('SMS_GATEWAY_USERNAME') || 'SKX1FL';
    const password = Deno.env.get('SMS_GATEWAY_PASSWORD') || 'ldqteztgfwtdtf';
    const basicAuth = btoa(`${username}:${password}`);
    const message = `Hey, ${sms.otp} is your Siroi passkey.\n\nFA+9qCX9VSu`;

    const res = await fetch('https://api.sms-gate.app/3rdparty/v1/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      },
      body: JSON.stringify({
        message: message,
        phoneNumbers: [phone]
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("SMS Gateway API Error:", errorText);
      return new Response(JSON.stringify({ error: 'Failed to route SMS via Android Gateway' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Successfully dispatched SMS via Android Gateway to ${phone}`);

    return new Response(JSON.stringify({ success: true, channel: 'sms' }), {
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
