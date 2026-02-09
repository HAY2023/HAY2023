import { useState } from 'react';
import { AlertCircle, Send, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ReportType = 'bug' | 'suggestion' | 'other';

const reportTypeLabels: Record<ReportType, { label: string; icon: React.ReactNode; color: string }> = {
  bug: { label: 'مشكلة تقنية', icon: <Bug className="h-4 w-4" />, color: 'text-red-500' },
  suggestion: { label: 'اقتراح', icon: <Lightbulb className="h-4 w-4" />, color: 'text-yellow-500' },
  other: { label: 'أخرى', icon: <HelpCircle className="h-4 w-4" />, color: 'text-blue-500' },
};

const ReportProblem = () => {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('bug');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDeviceInfo = () => {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      online: navigator.onLine,
      url: window.location.href,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('يرجى كتابة وصف للمشكلة');
      return;
    }

    if (message.trim().length < 10) {
      toast.error('يرجى كتابة وصف أكثر تفصيلاً');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('user_reports')
        .insert({
          report_type: reportType,
          message: message.trim(),
          email: email.trim() || null,
          device_info: getDeviceInfo(),
        });

      if (error) throw error;

      toast.success('تم إرسال البلاغ بنجاح، شكراً لك!');
      setMessage('');
      setEmail('');
      setReportType('bug');
      setOpen(false);
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('حدث خطأ أثناء إرسال البلاغ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <AlertCircle className="h-4 w-4" />
          <span>الإبلاغ عن مشكلة</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">الإبلاغ عن مشكلة</DialogTitle>
          <DialogDescription className="text-center">
            ساعدنا في تحسين التطبيق بإرسال ملاحظاتك
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Report Type */}
          <div className="space-y-3">
            <Label>نوع البلاغ</Label>
            <RadioGroup
              value={reportType}
              onValueChange={(value) => setReportType(value as ReportType)}
              className="grid grid-cols-3 gap-2"
            >
              {(Object.entries(reportTypeLabels) as [ReportType, typeof reportTypeLabels['bug']][]).map(
                ([type, { label, icon, color }]) => (
                  <div key={type}>
                    <RadioGroupItem
                      value={type}
                      id={type}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={type}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                        peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                        hover:bg-muted/50 ${color}`}
                    >
                      {icon}
                      <span className="text-xs text-foreground">{label}</span>
                    </Label>
                  </div>
                )
              )}
            </RadioGroup>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">وصف المشكلة أو الاقتراح *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب وصفاً تفصيلياً للمشكلة أو الاقتراح..."
              className="min-h-[120px] resize-none"
              dir="rtl"
            />
            <p className="text-xs text-muted-foreground text-left">
              {message.length}/500
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="للتواصل معك حول البلاغ"
              dir="ltr"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full gap-2"
            disabled={isSubmitting || !message.trim()}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>جاري الإرسال...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>إرسال البلاغ</span>
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportProblem;
