import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Path format: /api/v1/{resource}
    const resource = pathParts[pathParts.length - 1] || '';
    
    // Get API key from header for admin endpoints
    const apiKey = req.headers.get('x-api-key');
    const adminPassword = Deno.env.get('ADMIN_API_KEY');
    const isAdmin = apiKey && adminPassword && apiKey === adminPassword;

    console.log(`API Request: ${req.method} /${resource}`);

    // Public endpoints (no auth required)
    if (req.method === 'GET') {
      switch (resource) {
        case 'settings': {
          const { data, error } = await supabase
            .from('settings')
            .select('*')
            .limit(1)
            .single();
          
          if (error) throw error;
          return jsonResponse({ success: true, data });
        }

        case 'videos': {
          const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
          
          if (error) throw error;
          return jsonResponse({ success: true, data });
        }

        case 'announcements': {
          const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          return jsonResponse({ success: true, data });
        }

        case 'flash-messages': {
          const now = new Date().toISOString();
          const { data, error } = await supabase
            .from('flash_messages')
            .select('*')
            .eq('is_active', true)
            .or(`start_date.is.null,start_date.lte.${now}`)
            .or(`end_date.is.null,end_date.gte.${now}`)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          return jsonResponse({ success: true, data });
        }

        case 'questions-count': {
          const { data, error } = await supabase.rpc('get_public_questions_count');
          if (error) throw error;
          return jsonResponse({ success: true, count: data });
        }

        case 'status': {
          return jsonResponse({ 
            success: true, 
            status: 'online',
            version: '1.0.0',
            endpoints: {
              public: [
                'GET /settings',
                'GET /videos',
                'GET /announcements',
                'GET /flash-messages',
                'GET /questions-count',
                'POST /questions',
              ],
              admin: [
                'GET /questions (requires x-api-key)',
                'GET /access-logs (requires x-api-key)',
              ]
            }
          });
        }

        // Admin-only endpoints
        case 'questions': {
          if (!isAdmin) {
            return jsonResponse({ success: false, error: 'Unauthorized - API key required' }, 401);
          }
          
          const { data, error } = await supabase
            .from('questions')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          return jsonResponse({ success: true, data });
        }

        case 'access-logs': {
          if (!isAdmin) {
            return jsonResponse({ success: false, error: 'Unauthorized - API key required' }, 401);
          }
          
          const { data, error } = await supabase
            .from('admin_access_logs')
            .select('*')
            .order('accessed_at', { ascending: false })
            .limit(100);
          
          if (error) throw error;
          return jsonResponse({ success: true, data });
        }

        default:
          return jsonResponse({ success: false, error: 'Unknown endpoint' }, 404);
      }
    }

    // POST endpoints
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));

      switch (resource) {
        case 'questions': {
          const { category, question_text } = body;
          
          if (!category || !question_text) {
            return jsonResponse({ 
              success: false, 
              error: 'Missing required fields: category, question_text' 
            }, 400);
          }

          const { data, error } = await supabase
            .from('questions')
            .insert({ category, question_text })
            .select()
            .single();
          
          if (error) throw error;
          return jsonResponse({ success: true, data });
        }

        case 'reports': {
          const { report_type, message, email, device_info } = body;
          
          if (!report_type || !message) {
            return jsonResponse({ 
              success: false, 
              error: 'Missing required fields: report_type, message' 
            }, 400);
          }

          const { data, error } = await supabase
            .from('user_reports')
            .insert({ report_type, message, email, device_info })
            .select()
            .single();
          
          if (error) throw error;
          return jsonResponse({ success: true, data });
        }

        default:
          return jsonResponse({ success: false, error: 'Unknown endpoint' }, 404);
      }
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API Error:', message);
    return jsonResponse({ success: false, error: message }, 500);
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
