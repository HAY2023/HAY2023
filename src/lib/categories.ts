export const QUESTION_CATEGORIES = [
  { value: 'purification', label: 'الطهارة' },
  { value: 'prayer', label: 'الصلاة' },
  { value: 'zakat', label: 'الزكاة' },
  { value: 'fasting', label: 'الصيام' },
  { value: 'hajj', label: 'الحج والعمرة' },
  { value: 'transactions', label: 'المعاملات والبيوع' },
  { value: 'family', label: 'الأسرة والنكاح' },
  { value: 'divorce', label: 'الطلاق' },
  { value: 'inheritance', label: 'الميراث' },
  { value: 'creed', label: 'العقيدة' },
  { value: 'morals', label: 'الأخلاق والسلوك' },
  { value: 'oaths', label: 'الأيمان والنذور' },
  { value: 'food', label: 'الأطعمة والأشربة' },
  { value: 'clothing', label: 'اللباس والزينة' },
  { value: 'other', label: 'آخر' },
] as const;

export type QuestionCategory = typeof QUESTION_CATEGORIES[number]['value'];

export function getCategoryLabel(value: string): string {
  const category = QUESTION_CATEGORIES.find(c => c.value === value);
  return category?.label || value;
}
