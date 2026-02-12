import { useState, useEffect } from 'react';
import { Sparkles, Clock, Timer } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
  style?: number; // 1: LED أخضر, 2: كلاسيكي, 3: بسيط, 4: دائري
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
}

interface StyleProps {
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
}

// حساب الوقت المتبقي
function calculateTimeLeft(targetDate: string) {
  const difference = new Date(targetDate).getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return null;
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

// نمط LED الأخضر الرقمي
function LEDStyle({ timeLeft, bgColor = '#000000', textColor = '#22c55e', borderColor = '#166534' }: StyleProps) {
  const timeUnits = [
    ...(timeLeft.days > 0 ? [{ value: timeLeft.days, label: 'DAYS' }] : []),
    { value: timeLeft.hours, label: 'HOURS' },
    { value: timeLeft.minutes, label: 'MINUTES' },
    { value: timeLeft.seconds, label: 'SECONDS' },
  ];

  return (
    <div 
      className="relative overflow-hidden rounded-2xl shadow-2xl"
      style={{ 
        backgroundColor: bgColor,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: borderColor + '80'
      }}
    >
      <div 
        className="absolute inset-0"
        style={{ background: `linear-gradient(to bottom, ${textColor}0D, transparent, ${textColor}0D)` }}
      />
      
      <div className="relative p-6 md:p-8">
        <div className="text-center mb-6">
          <h3 
            className="text-lg md:text-xl font-bold"
            style={{ color: textColor + 'CC' }}
          >
            الحلقة القادمة بعد
          </h3>
        </div>
        
        <div className="flex justify-center items-center gap-2 md:gap-4 flex-wrap" dir="ltr">
          {timeUnits.map((unit, index) => (
            <div key={index} className="flex items-center">
              <div className="relative text-center">
                <div 
                  className="font-mono text-5xl md:text-7xl font-bold tabular-nums tracking-wider"
                  style={{
                    color: textColor,
                    textShadow: `0 0 20px ${textColor}CC, 0 0 40px ${textColor}66, 0 0 60px ${textColor}33`,
                    fontFamily: '"Share Tech Mono", "Courier New", monospace',
                  }}
                >
                  {String(unit.value).padStart(2, '0')}
                </div>
                <div 
                  className="text-[10px] md:text-xs font-medium uppercase tracking-widest mt-1"
                  style={{ 
                    color: textColor + 'B3',
                    textShadow: `0 0 10px ${textColor}80`
                  }}
                >
                  {unit.label}
                </div>
              </div>
              
              {index < timeUnits.length - 1 && (
                <div 
                  className="text-4xl md:text-6xl font-bold mx-1 md:mx-3 animate-pulse"
                  style={{ 
                    color: textColor,
                    textShadow: `0 0 20px ${textColor}CC, 0 0 40px ${textColor}66`
                  }}
                >
                  :
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div 
          className="mt-6 h-0.5"
          style={{ background: `linear-gradient(to right, transparent, ${textColor}80, transparent)` }}
        />
      </div>
    </div>
  );
}

// النمط الكلاسيكي الأنيق
function ClassicStyle({ timeLeft, bgColor, textColor, borderColor }: StyleProps) {
  const timeUnits = [
    ...(timeLeft.days > 0 ? [{ value: timeLeft.days, label: 'يوم' }] : []),
    { value: timeLeft.hours, label: 'ساعة' },
    { value: timeLeft.minutes, label: 'دقيقة' },
    { value: timeLeft.seconds, label: 'ثانية' },
  ];

  const cardBg = bgColor || 'hsl(var(--card))';
  const text = textColor || 'hsl(var(--primary))';
  const border = borderColor || 'hsl(var(--primary))';

  return (
    <div 
      className="relative overflow-hidden rounded-2xl shadow-xl"
      style={{
        background: `linear-gradient(to bottom right, ${cardBg}1A, transparent, ${cardBg}0D)`,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: border + '33'
      }}
    >
      <div className="relative p-6 md:p-8">
        <div className="text-center mb-6 flex items-center justify-center gap-2">
          <Clock className="w-5 h-5" style={{ color: text }} />
          <h3 className="text-lg md:text-xl font-bold" style={{ color: text }}>
            الحلقة القادمة بعد
          </h3>
        </div>
        
        <div className="flex justify-center items-center gap-3 md:gap-6 flex-wrap" dir="rtl">
          {timeUnits.map((unit, index) => (
            <div key={index} className="text-center">
              <div 
                className="rounded-xl p-4 md:p-6 shadow-lg min-w-[70px] md:min-w-[90px]"
                style={{
                  backgroundColor: cardBg,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: border + '4D'
                }}
              >
                <div className="text-3xl md:text-5xl font-bold tabular-nums text-foreground">
                  {String(unit.value).padStart(2, '0')}
                </div>
              </div>
              <div className="text-sm md:text-base font-medium text-muted-foreground mt-2">
                {unit.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// النمط البسيط المينيمال
function MinimalStyle({ timeLeft, bgColor, textColor }: StyleProps) {
  const formatTime = () => {
    const parts = [];
    if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
    parts.push(`${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`);
    return parts.join(' ');
  };

  return (
    <div 
      className="rounded-xl p-6 shadow-md border border-border"
      style={{ backgroundColor: bgColor || 'hsl(var(--card))' }}
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Timer className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">الحلقة القادمة بعد</span>
        </div>
        <div 
          className="text-4xl md:text-6xl font-mono font-bold tabular-nums tracking-wider"
          dir="ltr"
          style={{ color: textColor || 'hsl(var(--foreground))' }}
        >
          {formatTime()}
        </div>
        {timeLeft.days > 0 && (
          <div className="text-sm text-muted-foreground mt-2">
            {timeLeft.days} يوم
          </div>
        )}
      </div>
    </div>
  );
}

// النمط الدائري
function CircularStyle({ timeLeft, textColor, borderColor }: StyleProps) {
  const timeUnits = [
    ...(timeLeft.days > 0 ? [{ value: timeLeft.days, max: 30, label: 'يوم', color: borderColor || '#3b82f6' }] : []),
    { value: timeLeft.hours, max: 24, label: 'ساعة', color: textColor || '#10b981' },
    { value: timeLeft.minutes, max: 60, label: 'دقيقة', color: borderColor || '#f59e0b' },
    { value: timeLeft.seconds, max: 60, label: 'ثانية', color: textColor || '#ef4444' },
  ];

  const CircleProgress = ({ value, max, color }: { value: number; max: number; color: string }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const progress = ((max - value) / max) * circumference;
    
    return (
      <svg className="w-24 h-24 md:w-28 md:h-28 -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          className="fill-none"
          stroke="hsl(var(--muted) / 0.3)"
          strokeWidth="6"
        />
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          className="fill-none transition-all duration-300"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
        />
      </svg>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl">
      <div className="relative p-6 md:p-8">
        <div className="text-center mb-6">
          <h3 className="text-lg md:text-xl font-bold text-white/90">
            الحلقة القادمة بعد
          </h3>
        </div>
        
        <div className="flex justify-center items-center gap-2 md:gap-4 flex-wrap" dir="rtl">
          {timeUnits.map((unit, index) => (
            <div key={index} className="relative flex flex-col items-center">
              <div className="relative">
                <CircleProgress value={unit.value} max={unit.max} color={unit.color} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl md:text-3xl font-bold text-white tabular-nums">
                    {String(unit.value).padStart(2, '0')}
                  </span>
                </div>
              </div>
              <span className="text-xs md:text-sm text-white/60 mt-2">{unit.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// النمط الزجاجي ثلاثي الأبعاد
function GlassStyle({ timeLeft, bgColor, textColor, borderColor }: StyleProps) {
  const timeUnits = [
    ...(timeLeft.days > 0 ? [{ value: timeLeft.days, label: 'يوم' }] : []),
    { value: timeLeft.hours, label: 'ساعة' },
    { value: timeLeft.minutes, label: 'دقيقة' },
    { value: timeLeft.seconds, label: 'ثانية' },
  ];

  const glassBg = bgColor || 'rgba(255, 255, 255, 0.1)';
  const text = textColor || '#ffffff';
  const border = borderColor || 'rgba(255, 255, 255, 0.3)';

  return (
    <div 
      className="relative overflow-hidden rounded-3xl shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(168, 85, 247, 0.8) 50%, rgba(236, 72, 153, 0.8) 100%)',
      }}
    >
      {/* تأثير الضبابية الزجاجية */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)',
        }}
      />
      
      {/* شريط الضوء العلوي */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent)' }}
      />
      
      <div className="relative p-6 md:p-8 backdrop-blur-sm">
        <div className="text-center mb-6">
          <h3 
            className="text-lg md:text-xl font-bold drop-shadow-lg"
            style={{ color: text }}
          >
            ✨ الحلقة القادمة بعد ✨
          </h3>
        </div>
        
        <div className="flex justify-center items-center gap-3 md:gap-5 flex-wrap" dir="rtl">
          {timeUnits.map((unit, index) => (
            <div key={index} className="text-center group">
              <div 
                className="relative rounded-2xl p-4 md:p-5 min-w-[70px] md:min-w-[90px] transition-all duration-300 hover:scale-105"
                style={{
                  background: glassBg,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${border}`,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* انعكاس الضوء الداخلي */}
                <div 
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, transparent 50%)',
                    pointerEvents: 'none',
                  }}
                />
                <div 
                  className="relative text-4xl md:text-5xl font-bold tabular-nums drop-shadow-lg"
                  style={{ 
                    color: text,
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  }}
                >
                  {String(unit.value).padStart(2, '0')}
                </div>
              </div>
              <div 
                className="text-sm md:text-base font-medium mt-2 drop-shadow-md"
                style={{ color: text }}
              >
                {unit.label}
              </div>
            </div>
          ))}
        </div>
        
        {/* خط تزييني سفلي */}
        <div 
          className="mt-6 h-0.5"
          style={{ 
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)' 
          }}
        />
      </div>
      
      {/* تأثير التوهج السفلي */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
        style={{ 
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent)',
          boxShadow: '0 0 20px rgba(255,255,255,0.3)',
        }}
      />
    </div>
  );
}

// المكون المنتهي
function ExpiredState() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 text-center shadow-2xl">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
      <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary-foreground animate-pulse" />
      <p className="text-2xl md:text-3xl text-primary-foreground font-bold">
        🎉 الحلقة الآن أو قريبًا جدًا! 🎉
      </p>
    </div>
  );
}

export function CountdownTimer({ targetDate, style = 1, bgColor, textColor, borderColor }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return <ExpiredState />;
  }

  const styleProps = { timeLeft, bgColor, textColor, borderColor };

  switch (style) {
    case 2:
      return <ClassicStyle {...styleProps} />;
    case 3:
      return <MinimalStyle {...styleProps} />;
    case 4:
      return <CircularStyle {...styleProps} />;
    case 5:
      return <GlassStyle {...styleProps} />;
    default:
      return <LEDStyle {...styleProps} />;
  }
}

// مكون المعاينة للإعدادات
interface CountdownTimerPreviewProps {
  style: number;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
}

export function CountdownTimerPreview({ style, bgColor, textColor, borderColor }: CountdownTimerPreviewProps) {
  // استخدام وقت ثابت للمعاينة (3 أيام و 5 ساعات و 23 دقيقة و 45 ثانية)
  const previewTimeLeft = { days: 3, hours: 5, minutes: 23, seconds: 45 };
  const styleProps = { timeLeft: previewTimeLeft, bgColor, textColor, borderColor };

  switch (style) {
    case 2:
      return <ClassicStyle {...styleProps} />;
    case 3:
      return <MinimalStyle {...styleProps} />;
    case 4:
      return <CircularStyle {...styleProps} />;
    case 5:
      return <GlassStyle {...styleProps} />;
    default:
      return <LEDStyle {...styleProps} />;
  }
}
