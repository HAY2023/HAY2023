// فلتر المحتوى للأسئلة غير اللائقة
// قائمة الكلمات والأنماط المحظورة

// كلمات غير لائقة (مخفية للأمان)
const BLOCKED_PATTERNS = [
  // أسئلة قصيرة جداً بدون معنى
  /^(هل|ليش|كيف|ما|من|أين|متى|لماذا|ايش|شو|وش)\s*.{0,5}$/i,
  // تكرار الأحرف بشكل مزعج
  /(.)\1{5,}/,
  // أرقام فقط
  /^\d+$/,
  // رموز وحروف عشوائية
  /^[^\u0600-\u06FFa-zA-Z\s]{5,}$/,
];

// كلمات تحذيرية (ستظهر تحذير لكن تسمح بالإرسال)
const WARNING_PATTERNS = [
  // أسئلة قصيرة جداً
  /^.{1,15}$/,
];

// كلمات سخيفة أو غير جدية
const SILLY_INDICATORS = [
  'هههه',
  'ههه',
  'لول',
  'lol',
  'هاها',
  'xd',
  '😂',
  '🤣',
  'ههههه',
  'haha',
  '???',
  '!!!',
];

export interface ContentCheckResult {
  isClean: boolean;
  isWarning: boolean;
  reason?: string;
  reasonAr?: string;
  reasonFr?: string;
  reasonEn?: string;
}

export function checkQuestionContent(text: string): ContentCheckResult {
  const trimmedText = text.trim().toLowerCase();
  
  // فحص الأنماط المحظورة
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmedText)) {
      return {
        isClean: false,
        isWarning: false,
        reasonAr: 'يرجى كتابة سؤال واضح ومفهوم',
        reasonFr: 'Veuillez écrire une question claire et compréhensible',
        reasonEn: 'Please write a clear and understandable question',
      };
    }
  }

  // فحص الكلمات السخيفة
  const hasSillyContent = SILLY_INDICATORS.some(indicator => 
    trimmedText.includes(indicator.toLowerCase())
  );

  if (hasSillyContent) {
    return {
      isClean: false,
      isWarning: true,
      reasonAr: 'يرجى صياغة سؤالك بشكل جدي ومحترم',
      reasonFr: 'Veuillez formuler votre question de manière sérieuse et respectueuse',
      reasonEn: 'Please formulate your question seriously and respectfully',
    };
  }

  // فحص الأسئلة القصيرة جداً
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(trimmedText)) {
      return {
        isClean: true,
        isWarning: true,
        reasonAr: 'سؤالك قصير جداً، يُفضل إضافة تفاصيل أكثر',
        reasonFr: 'Votre question est très courte, veuillez ajouter plus de détails',
        reasonEn: 'Your question is very short, please add more details',
      };
    }
  }

  return {
    isClean: true,
    isWarning: false,
  };
}

// دالة للحصول على رسالة الخطأ حسب اللغة
export function getContentFilterMessage(
  result: ContentCheckResult, 
  language: string
): string {
  if (language === 'fr') {
    return result.reasonFr || '';
  } else if (language === 'en') {
    return result.reasonEn || '';
  }
  return result.reasonAr || '';
}
