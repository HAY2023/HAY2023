import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

async function verifyAdminPassword(supabase: any, adminPassword?: string) {
  if (!adminPassword) {
    return { ok: false, status: 401, error: "Admin password required" };
  }

  const { data: isValid, error: verifyError } = await supabase.rpc("verify_admin_password", {
    input_password: adminPassword,
  });

  if (verifyError || !isValid) {
    return { ok: false, status: 403, error: "Invalid admin password" };
  }

  return { ok: true, status: 200 };
}

async function sendToAdminTokens(supabase: any, payload: NotificationPayload) {
  const { data: tokens, error: tokensError } = await supabase
    .from("push_tokens")
    .select("token, device_type")
    .eq("is_admin", true);

  if (tokensError) {
    return { ok: false, status: 500, body: { error: "Failed to fetch tokens" } };
  }

  const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");
  let successCount = 0;
  let failureCount = 0;

  if (fcmServerKey && tokens && tokens.length > 0) {
    const results = await Promise.all(
      tokens.map(async (t: { token: string }) => {
        try {
          const res = await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `key=${fcmServerKey}`,
            },
            body: JSON.stringify({
              to: t.token,
              notification: {
                title: payload.title,
                body: payload.body,
                sound: "default",
              },
              data: payload.data || {},
            }),
          });

          if (res.ok) return true;
          const text = await res.text();
          console.error(`FCM Error for token ${t.token.slice(0, 10)}...:`, text);
          return false;
        } catch (e) {
          console.error(`Fetch Error for token ${t.token.slice(0, 10)}...:`, e);
          return false;
        }
      })
    );

    successCount = results.filter(Boolean).length;
    failureCount = results.length - successCount;
  } else {
    console.warn("FCM_SERVER_KEY not set or no tokens found. Skipping actual FCM send.");
  }

  return {
    ok: true,
    status: 200,
    body: {
      success: true,
      message: fcmServerKey
        ? `Sent to ${successCount} devices, failed ${failureCount}`
        : `Notification queued (Hypothetically) for ${tokens?.length || 0} devices. Set FCM_SERVER_KEY to really send.`,
      tokens_count: tokens?.length || 0,
      sent_count: successCount,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, token, device_type, notification, admin_password, question_id } = await req.json();

    if (action === "register") {
      if (!token) {
        return new Response(JSON.stringify({ error: "Token is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("push_tokens")
        .upsert({ token, device_type: device_type || "unknown", updated_at: new Date().toISOString() }, { onConflict: "token" });

      if (error) {
        return new Response(JSON.stringify({ error: "Failed to register token" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Token registered" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send") {
      const verification = await verifyAdminPassword(supabase, admin_password);
      if (!verification.ok) {
        return new Response(JSON.stringify({ error: verification.error }), {
          status: verification.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payload = notification as NotificationPayload;
      if (!payload?.title || !payload?.body) {
        return new Response(JSON.stringify({ error: "Notification title and body are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const sendResult = await sendToAdminTokens(supabase, payload);
      return new Response(JSON.stringify(sendResult.body), {
        status: sendResult.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "notify-new-question") {
      if (!question_id) {
        return new Response(JSON.stringify({ error: "question_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: questionRow, error: questionError } = await supabase
        .from("questions")
        .select("id, category, question_text, created_at")
        .eq("id", question_id)
        .single();

      if (questionError || !questionRow) {
        return new Response(JSON.stringify({ error: "Question not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const createdAtMs = new Date(questionRow.created_at).getTime();
      if (Number.isNaN(createdAtMs) || Date.now() - createdAtMs > 10 * 60 * 1000) {
        return new Response(JSON.stringify({ error: "Question is too old for notification" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const snippet = questionRow.question_text.length > 80
        ? `${questionRow.question_text.slice(0, 80)}...`
        : questionRow.question_text;

      const payload: NotificationPayload = {
        title: "سؤال جديد",
        body: `فئة: ${questionRow.category}\n${snippet}`,
        data: { question_id: questionRow.id },
      };

      const sendResult = await sendToAdminTokens(supabase, payload);
      return new Response(JSON.stringify(sendResult.body), {
        status: sendResult.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list-tokens") {
      const verification = await verifyAdminPassword(supabase, admin_password);
      if (!verification.ok) {
        return new Response(JSON.stringify({ error: verification.error }), {
          status: verification.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("push_tokens")
        .select("id, token, device_type, is_admin, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: "Failed to load tokens" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, tokens: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set-admin") {
      if (!token) {
        return new Response(JSON.stringify({ error: "Token is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const verification = await verifyAdminPassword(supabase, admin_password);
      if (!verification.ok) {
        return new Response(JSON.stringify({ error: verification.error }), {
          status: verification.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("push_tokens")
        .update({ is_admin: true, updated_at: new Date().toISOString() })
        .eq("token", token);

      if (error) {
        return new Response(JSON.stringify({ error: "Failed to set admin status" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Admin status set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});