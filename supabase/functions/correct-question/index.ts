import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    
    if (!question || question.trim().length < 5) {
      return new Response(JSON.stringify({ 
        corrected: question,
        hasCorrections: false 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `أنت مصحح لغوي عربي متخصص في النصوص الشرعية والدينية. مهامك:

1. تصحيح الأخطاء الإملائية الشائعة:
   - التاء المربوطة والهاء (صلاه ← صلاة)
   - الألف المقصورة والممدودة (علي ← على)
   - الهمزات (مسأله ← مسألة، سؤال ← سؤال)
   - التنوين (شكرآ ← شكراً)

2. تصحيح الأخطاء النحوية:
   - إعراب الكلمات الأساسية
   - أدوات الربط والعطف

3. تحسين الصياغة الشرعية:
   - استخدام المصطلحات الفقهية الصحيحة
   - صياغة السؤال بشكل واضح ومحترم

4. إضافة علامات الترقيم:
   - علامات الاستفهام والتعجب
   - الفواصل والنقاط

أمثلة:
- "هل يجوز الصلاه بدون وضو" ← "هل يجوز الصلاة بدون وضوء؟"
- "ما حكم الزكاه علي الذهب المستعمل" ← "ما حكم الزكاة على الذهب المستعمل؟"
- "كيف اصلي صلات الجنازه" ← "كيف أصلي صلاة الجنازة؟"
- "هل صيام يوم عرفه واجب" ← "هل صيام يوم عرفة واجب؟"

قواعد مهمة:
- أعد النص المصحح فقط بدون أي شرح
- حافظ على المعنى الأصلي تماماً
- إذا كان النص صحيحاً، أعده كما هو
- لا تضف معلومات جديدة`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          corrected: question,
          hasCorrections: false 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const correctedText = data.choices?.[0]?.message?.content?.trim() || question;
    
    // تنظيف النص المصحح من أي علامات markdown
    const cleanedText = correctedText
      .replace(/^["']|["']$/g, '') // إزالة علامات الاقتباس
      .replace(/^\*+|\*+$/g, '')   // إزالة النجوم
      .trim();
    
    // التحقق من وجود تصحيحات حقيقية
    const normalizeText = (text: string) => 
      text.replace(/[\s\u200B-\u200D\uFEFF]/g, '').toLowerCase();
    
    const hasCorrections = normalizeText(cleanedText) !== normalizeText(question) && 
                          cleanedText.length > 0;

    return new Response(JSON.stringify({ 
      corrected: cleanedText,
      original: question,
      hasCorrections 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in correct-question function:', errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      corrected: null,
      hasCorrections: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
