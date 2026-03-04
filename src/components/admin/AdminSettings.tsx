import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CountdownTimerPreview, COUNTDOWN_STYLES, COUNTDOWN_ANIMATIONS } from '@/components/CountdownTimer';
import { 
  MessageSquare, Calendar, Timer, Clock, Hash, 
  Smartphone, Shield, BellRing, Bell, 
  ChevronDown, ChevronUp,
  Zap
} from 'lucide-react';

interface AdminSettingsProps {
  isBoxOpen: boolean;
  showCountdown: boolean;
  countdownStyle: number;
  countdownAnimationType: number;
  showQuestionCount: boolean;
  showInstallPage: boolean;
  contentFilterEnabled: boolean;
  soundEnabled: boolean;
  nextSessionDate: string;
  countdownBgColor: string;
  countdownTextColor: string;
  countdownBorderColor: string;
  isLoading: boolean;
  savingCountdownStyle: boolean;
  savingCountdownColors: boolean;
  savedCountdownStyle: number;
  countdownTitle: string;
  onToggleBox: (v: boolean) => void;
  onToggleCountdown: (v: boolean) => void;
  onToggleQuestionCount: (v: boolean) => void;
  onToggleInstallPage: (v: boolean) => void;
  onToggleContentFilter: (v: boolean) => void;
  onSoundToggle: (v: boolean) => void;
  onSessionDateChange: (v: string) => void;
  onUpdateSession: () => void;
  onCountdownStyleChange: (v: number) => void;
  onCountdownAnimationTypeChange: (v: number) => void;
  onSaveCountdownStyle: (v: number) => void;
  onCountdownBgColorChange: (v: string) => void;
  onCountdownTextColorChange: (v: string) => void;
  onCountdownBorderColorChange: (v: string) => void;
  onSaveCountdownColors: () => void;
  onCountdownTitleChange: (v: string) => void;
  onSaveCountdownTitle: () => void;
}

export function AdminSettings(props: AdminSettingsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('general');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const SectionHeader = ({ id, icon, title, subtitle }: { id: string; icon: React.ReactNode; title: string; subtitle: string }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-lg p-2">{icon}</div>
        <div className="text-right">
          <h3 className="font-medium text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {expandedSection === id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* معاينة الموقع على الهاتف */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary" />
          معاينة الموقع على الهاتف
        </h3>
        <div className="flex justify-center">
          <div className="relative w-[200px] h-[400px] border-[3px] border-foreground/30 rounded-[24px] overflow-hidden shadow-lg bg-background">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-foreground/30 rounded-b-xl z-10" />
            <div className="w-full h-full overflow-hidden">
              <iframe
                src="/"
                className="border-0"
                style={{ 
                  width: '400px', 
                  height: '800px', 
                  transform: 'scale(0.5)', 
                  transformOrigin: 'top left',
                  pointerEvents: 'none'
                }}
                title="معاينة الموقع"
                key="mobile-preview"
              />
            </div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-foreground/30 rounded-full" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          المعاينة تعمل بشكل كامل على الموقع المنشور
        </p>
      </div>

      {/* القسم العام */}
      <SectionHeader id="general" icon={<MessageSquare className="w-4 h-4 text-primary" />} title="إعدادات عامة" subtitle="صندوق الأسئلة، العدادات، الصفحات" />
      {expandedSection === 'general' && (
        <div className="space-y-3 pr-2">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" /> صندوق الأسئلة</h4>
              <p className="text-xs text-muted-foreground mt-1">{props.isBoxOpen ? 'مفتوح - يمكن إرسال الأسئلة' : 'مغلق'}</p>
            </div>
            <Switch checked={props.isBoxOpen} onCheckedChange={props.onToggleBox} disabled={props.isLoading} />
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2"><Hash className="w-4 h-4" /> عداد الأسئلة</h4>
              <p className="text-xs text-muted-foreground mt-1">{props.showQuestionCount ? 'ظاهر للزوار' : 'مخفي'}</p>
            </div>
            <Switch checked={props.showQuestionCount} onCheckedChange={props.onToggleQuestionCount} disabled={props.isLoading} />
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2"><Smartphone className="w-4 h-4" /> صفحة التثبيت</h4>
              <p className="text-xs text-muted-foreground mt-1">{props.showInstallPage ? 'متاحة' : 'معطّلة'}</p>
            </div>
            <Switch checked={props.showInstallPage} onCheckedChange={props.onToggleInstallPage} disabled={props.isLoading} />
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> فلتر المحتوى</h4>
              <p className="text-xs text-muted-foreground mt-1">{props.contentFilterEnabled ? 'يمنع المحتوى غير اللائق' : 'معطّل'}</p>
            </div>
            <Switch checked={props.contentFilterEnabled} onCheckedChange={props.onToggleContentFilter} disabled={props.isLoading} />
          </div>
        </div>
      )}

      {/* العداد التنازلي */}
      <SectionHeader id="countdown" icon={<Timer className="w-4 h-4 text-primary" />} title="العداد التنازلي" subtitle="نمط العداد، الألوان، الموعد، التحريك" />
      {expandedSection === 'countdown' && (
        <div className="space-y-4 pr-2">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm flex items-center gap-2"><Timer className="w-4 h-4" /> إظهار العداد</h4>
              <p className="text-xs text-muted-foreground mt-1">{props.showCountdown ? 'ظاهر' : 'مخفي'}</p>
            </div>
            <Switch checked={props.showCountdown} onCheckedChange={props.onToggleCountdown} disabled={props.isLoading} />
          </div>

          {props.showCountdown && (
            <>
              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <h4 className="font-medium text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> نمط العداد</h4>
                <RadioGroup 
                  value={String(props.countdownStyle)} 
                  onValueChange={(val) => props.onCountdownStyleChange(Number(val))}
                  className="grid grid-cols-5 gap-2"
                >
                  {COUNTDOWN_STYLES.map(s => (
                    <div key={s.val}>
                      <RadioGroupItem value={String(s.val)} id={`s-${s.val}`} className="peer sr-only" />
                      <Label htmlFor={`s-${s.val}`} className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-2 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer text-center">
                        <span className="text-xs font-medium">{s.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {/* نوع التحريك */}
                <div className="pt-3 border-t border-border">
                  <h4 className="font-medium text-sm flex items-center gap-2 mb-3"><Zap className="w-4 h-4" /> تأثير تحريك الأرقام</h4>
                  <RadioGroup 
                    value={String(props.countdownAnimationType)} 
                    onValueChange={(val) => props.onCountdownAnimationTypeChange(Number(val))}
                    className="grid grid-cols-5 gap-2"
                  >
                    {COUNTDOWN_ANIMATIONS.map(a => (
                      <div key={a.val}>
                        <RadioGroupItem value={String(a.val)} id={`a-${a.val}`} className="peer sr-only" />
                        <Label htmlFor={`a-${a.val}`} className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-1.5 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer text-center gap-0.5">
                          <span className="text-base">{a.icon}</span>
                          <span className="text-[10px] font-medium leading-tight">{a.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* ألوان */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                  <div>
                    <label className="block text-xs mb-1">خلفية</label>
                    <div className="flex gap-1">
                      <Input type="color" value={props.countdownBgColor} onChange={(e) => props.onCountdownBgColorChange(e.target.value)} className="w-8 h-8 p-0.5 cursor-pointer" />
                      <Input type="text" value={props.countdownBgColor} onChange={(e) => props.onCountdownBgColorChange(e.target.value)} className="flex-1 text-xs h-8" dir="ltr" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs mb-1">نص</label>
                    <div className="flex gap-1">
                      <Input type="color" value={props.countdownTextColor} onChange={(e) => props.onCountdownTextColorChange(e.target.value)} className="w-8 h-8 p-0.5 cursor-pointer" />
                      <Input type="text" value={props.countdownTextColor} onChange={(e) => props.onCountdownTextColorChange(e.target.value)} className="flex-1 text-xs h-8" dir="ltr" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs mb-1">إطار</label>
                    <div className="flex gap-1">
                      <Input type="color" value={props.countdownBorderColor} onChange={(e) => props.onCountdownBorderColorChange(e.target.value)} className="w-8 h-8 p-0.5 cursor-pointer" />
                      <Input type="text" value={props.countdownBorderColor} onChange={(e) => props.onCountdownBorderColorChange(e.target.value)} className="flex-1 text-xs h-8" dir="ltr" />
                    </div>
                  </div>
                </div>
                <Button onClick={props.onSaveCountdownColors} disabled={props.savingCountdownColors} variant="outline" size="sm" className="w-full">
                  {props.savingCountdownColors ? 'جارٍ الحفظ...' : 'حفظ الألوان'}
                </Button>

                {/* معاينة */}
                <div className="pt-2 border-t border-border">
                  <h4 className="text-xs text-muted-foreground mb-2">معاينة:</h4>
                  <div className="max-w-md mx-auto">
                    <CountdownTimerPreview 
                      style={props.countdownStyle}
                      bgColor={props.countdownBgColor}
                      textColor={props.countdownTextColor}
                      borderColor={props.countdownBorderColor}
                      animationType={props.countdownAnimationType}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => props.onSaveCountdownStyle(props.countdownStyle)}
                  disabled={props.savingCountdownStyle}
                  className="w-full"
                  size="sm"
                >
                  {props.savingCountdownStyle ? 'جارٍ الحفظ...' : 'حفظ النمط والتحريك'}
                </Button>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">✏️ عنوان العداد التنازلي</h4>
                <Input value={props.countdownTitle} onChange={(e) => props.onCountdownTitleChange(e.target.value)} placeholder="حلقة الإفتاء ستكون بعد" dir="rtl" />
                <Button onClick={props.onSaveCountdownTitle} disabled={props.isLoading} size="sm" className="w-full">
                  {props.isLoading ? 'جارٍ الحفظ...' : 'حفظ العنوان'}
                </Button>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> موعد الحلقة القادمة</h4>
                <Input type="datetime-local" value={props.nextSessionDate} onChange={(e) => props.onSessionDateChange(e.target.value)} />
                <Button onClick={props.onUpdateSession} disabled={props.isLoading || !props.nextSessionDate} size="sm" className="w-full">
                  {props.isLoading ? 'جارٍ الحفظ...' : 'حفظ الموعد'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* الإشعارات */}
      <SectionHeader id="notifications" icon={<BellRing className="w-4 h-4 text-primary" />} title="الإشعارات" subtitle="إشعارات الصوت والمتصفح" />
      {expandedSection === 'notifications' && (
        <div className="space-y-3 pr-2">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">إشعارات الصوت</p>
              <p className="text-xs text-muted-foreground">تشغيل صوت عند وصول سؤال جديد</p>
            </div>
            <Switch checked={props.soundEnabled} onCheckedChange={props.onSoundToggle} />
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">إشعارات المتصفح</p>
              <p className="text-xs text-muted-foreground">عرض إشعار في المتصفح</p>
            </div>
            <Button 
              size="sm" variant="outline"
              onClick={() => {
                if ('Notification' in window) {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      new Notification('تم تفعيل الإشعارات!', { body: 'ستصلك إشعارات عند وصول أسئلة جديدة', icon: '/favicon.jpg' });
                    }
                  });
                }
              }}
            >
              <Bell className="w-4 h-4 ml-2" /> تفعيل
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
