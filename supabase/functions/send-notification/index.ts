import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * إرسال إشعار FCM لقائمة من التوكنات
 */
async function sendFCMNotifications(
  tokens: Array<{ token: string; device_type?: string | null }>,
  notification: NotificationPayload,
  fcmServerKey: string
): Promise<{ successCount: number; failureCount: number }> {
  let successCount = 0;
  let failureCount = 0;

  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  const results = await Promise.all(tokens.map(async (t) => {
    try {
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${fcmServerKey}`
        },
        body: JSON.stringify({
          to: t.token,
          notification: {
            title: notification.title,
            body: notification.body,
            sound: 'default'
          },
          data: notification.data || {}
        })
      });

      if (res.ok) return true;
      else {
        const text = await res.text();
        console.error(`FCM Error for token ${t.token.slice(0, 10)}...:`, text);
        return false;
      }
    } catch (e) {
      console.error(`Fetch Error for token ${t.token.slice(0, 10)}...:`, e);
      return false;
    }
  }));

  successCount = results.filter(r => r).length;
  failureCount = results.filter(r => !r).length;

  return { successCount, failureCount };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, token, device_type, notification, admin_password, question } = await req.json();

    // ====== Action: register token (public) ======
    if (action === 'register') {
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          { token, device_type: device_type || 'unknown', updated_at: new Date().toISOString() },
          { onConflict: 'token' }
        );

      if (error) {
        console.error('Error registering token:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to register token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Token registered' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ====== Action: notify-admin (public - triggered when new question is submitted) ======
    if (action === 'notify-admin') {
      const questionData = question as { category?: string; question_text?: string } | undefined;

      const notifTitle = '📩 سؤال جديد!';
      const notifBody = questionData
        ? `فئة: ${questionData.category || 'عام'}\n${questionData.question_text?.slice(0, 80) || ''}...`
        : 'تم استلام سؤال جديد';

      // Get admin tokens
      const { data: adminTokens, error: tokensError } = await supabase
        .from('push_tokens')
        .select('token, device_type')
        .eq('is_admin', true);

      if (tokensError) {
        console.error('Error fetching admin tokens:', tokensError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch admin tokens' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
      let result = { successCount: 0, failureCount: 0 };

      if (fcmServerKey && adminTokens && adminTokens.length > 0) {
        result = await sendFCMNotifications(
          adminTokens,
          { title: notifTitle, body: notifBody, data: { route: '/admin' } },
          fcmServerKey
        );
      }

      console.log(`Admin notification: sent to ${result.successCount}/${adminTokens?.length || 0} admin devices`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Notified ${result.successCount} admin devices`,
          admin_tokens_count: adminTokens?.length || 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ====== Action: send notification to ALL users (admin only) ======
    if (action === 'send') {
      // Verify admin password
      if (!admin_password) {
        return new Response(
          JSON.stringify({ error: 'Admin password required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: isValid, error: verifyError } = await supabase.rpc('verify_admin_password', {
        input_password: admin_password
      });

      if (verifyError || !isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid admin password' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const notificationPayload = notification as NotificationPayload;

      if (!notificationPayload?.title || !notificationPayload?.body) {
        return new Response(
          JSON.stringify({ error: 'Notification title and body are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get ALL tokens (send to all users, not just admins)
      const { data: tokens, error: tokensError } = await supabase
        .from('push_tokens')
        .select('token, device_type');

      if (tokensError) {
        console.error('Error fetching tokens:', tokensError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch tokens' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Sending notification to ${tokens?.length || 0} devices:`, notificationPayload);

      const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
      let result = { successCount: 0, failureCount: 0 };

      if (fcmServerKey && tokens && tokens.length > 0) {
        result = await sendFCMNotifications(tokens, notificationPayload, fcmServerKey);
      } else {
        console.warn('FCM_SERVER_KEY not set or no tokens found. Skipping actual FCM send.');
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: fcmServerKey
            ? `Sent to ${result.successCount} devices, failed ${result.failureCount}`
            : `Notification queued for ${tokens?.length || 0} devices. Set FCM_SERVER_KEY to send.`,
          tokens_count: tokens?.length || 0,
          sent_count: result.successCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ====== Action: set admin status (requires admin password) ======
    if (action === 'set-admin') {
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!admin_password) {
        return new Response(
          JSON.stringify({ error: 'Admin password required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: isValid, error: verifyError } = await supabase.rpc('verify_admin_password', {
        input_password: admin_password
      });

      if (verifyError || !isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid admin password' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('push_tokens')
        .update({ is_admin: true, updated_at: new Date().toISOString() })
        .eq('token', token);

      if (error) {
        console.error('Error setting admin:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to set admin status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Admin status set' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
