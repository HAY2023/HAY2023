import { useState, useEffect, useRef } from 'react';
import { Sparkles, Clock, Timer, Zap, Flame, Star } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
  style?: number;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  title?: string;
  animationType?: number;
}

interface StyleProps {
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  title: string;
  animationType?: number;
}

const DEFAULT_TITLE = 'حلقة الإفتاء ستكون بعد';

function calculateTimeLeft(targetDate: string) {
  const difference = new Date(targetDate).getTime() - new Date().getTime();
  if (difference <= 0) return null;
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function getTimeUnits(timeLeft: StyleProps['timeLeft'], labelsAr = true) {
  const labels = labelsAr
    ? { d: 'يوم', h: 'ساعة', m: 'دقيقة', s: 'ثانية' }
    : { d: 'DAYS', h: 'HOURS', m: 'MIN', s: 'SEC' };
  return [
    ...(timeLeft.days > 0 ? [{ value: timeLeft.days, label: labels.d }] : []),
    { value: timeLeft.hours, label: labels.h },
    { value: timeLeft.minutes, label: labels.m },
    { value: timeLeft.seconds, label: labels.s },
  ];
}

// ===== Animation Types =====
// 1: Flip (بطاقة تنقلب)
// 2: Fade (تلاشي)
// 3: Slide Up (انزلاق للأعلى)
// 4: Slide Down (انزلاق للأسفل)
// 5: Scale Bounce (نبضة)
// 6: Rotate (دوران)
// 7: Blur (ضبابي)
// 8: Wave (موجة)
// 9: Typewriter (آلة كاتبة)
// 10: Glitch (تشويش)

function AnimatedNumber({ value, padStart = 2, color, className = '', animationType = 1 }: { 
  value: number; padStart?: number; color?: string; className?: string; animationType?: number 
}) {
  const str = String(value).padStart(padStart, '0');
  return (
    <span className={className}>
      {str.split('').map((digit, i) => (
        <AnimatedDigit key={i} value={digit} color={color} animationType={animationType} index={i} />
      ))}
    </span>
  );
}

function AnimatedDigit({ value, color, animationType = 1, index = 0 }: { 
  value: string; color?: string; animationType?: number; index?: number 
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 200);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const getAnimationStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { 
      color, 
      display: 'inline-block',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };

    if (!isAnimating) return base;

    switch (animationType) {
      case 1: // Flip
        return { ...base, transform: 'rotateX(90deg)', transformOrigin: 'center', transition: 'transform 0.2s ease-in' };
      case 2: // Fade
        return { ...base, opacity: 0, transition: 'opacity 0.2s ease-in' };
      case 3: // Slide Up
        return { ...base, transform: 'translateY(-100%)', opacity: 0, transition: 'all 0.2s ease-in' };
      case 4: // Slide Down
        return { ...base, transform: 'translateY(100%)', opacity: 0, transition: 'all 0.2s ease-in' };
      case 5: // Scale Bounce
        return { ...base, transform: 'scale(1.5)', opacity: 0.5, transition: 'all 0.25s cubic-bezier(0.68, -0.55, 0.27, 1.55)' };
      case 6: // Rotate
        return { ...base, transform: 'rotate(180deg) scale(0.5)', opacity: 0, transition: 'all 0.3s ease-in' };
      case 7: // Blur
        return { ...base, filter: 'blur(8px)', opacity: 0.3, transition: 'all 0.25s ease-in' };
      case 8: // Wave
        return { ...base, transform: `translateY(${index % 2 === 0 ? '-20px' : '20px'}) scale(0.8)`, opacity: 0.5, transition: 'all 0.3s ease-in' };
      case 9: // Typewriter
        return { ...base, transform: 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.15s ease-in' };
      case 10: // Glitch
        return { 
          ...base, 
          transform: `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`,
          textShadow: `2px 0 #ff0000, -2px 0 #00ffff`,
          transition: 'all 0.1s steps(2)' 
        };
      default:
        return { ...base, transform: 'rotateX(90deg)', transition: 'transform 0.2s ease-in' };
    }
  };

  return (
    <span
      className="inline-block"
      style={{
        ...getAnimationStyle(),
        perspective: '400px',
        ...(isAnimating ? {} : { 
          color, 
          display: 'inline-block',
          transform: 'none', 
          opacity: 1, 
          filter: 'none',
          textShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
        }),
      }}
    >
      {displayValue}
    </span>
  );
}

// ===== نمط 1: LED =====
function LEDStyle({ timeLeft, bgColor = '#000000', textColor = '#22c55e', borderColor = '#166534', title, animationType }: StyleProps) {
  const units = getTimeUnits(timeLeft, false);
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-2xl" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}80` }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${textColor}0D, transparent, ${textColor}0D)` }} />
      <div className="relative p-6 md:p-8">
        <h3 className="text-center text-lg md:text-xl font-bold mb-6" style={{ color: textColor + 'CC' }}>{title}</h3>
        <div className="flex justify-center items-center gap-3 md:gap-6" dir="ltr">
          {units.map((u, i) => (
            <div key={i} className="flex items-center gap-2 md:gap-4">
              <div className="text-center">
                <AnimatedNumber value={u.value} color={textColor} className="font-mono text-4xl md:text-6xl font-bold tabular-nums" animationType={animationType} />
                <div className="text-[10px] md:text-xs uppercase tracking-widest mt-1" style={{ color: textColor + 'B3' }}>{u.label}</div>
              </div>
              {i < units.length - 1 && (
                <div className="text-3xl md:text-5xl font-bold animate-pulse" style={{ color: textColor, textShadow: `0 0 20px ${textColor}CC` }}>:</div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 h-0.5" style={{ background: `linear-gradient(to right, transparent, ${textColor}80, transparent)` }} />
      </div>
    </div>
  );
}

// ===== نمط 2: كلاسيكي =====
function ClassicStyle({ timeLeft, bgColor, textColor, borderColor, title, animationType }: StyleProps) {
  const units = getTimeUnits(timeLeft);
  const cardBg = bgColor || 'hsl(var(--card))';
  const text = textColor || 'hsl(var(--primary))';
  const border = borderColor || 'hsl(var(--primary))';
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{ background: `linear-gradient(to bottom right, ${cardBg}1A, transparent)`, border: `1px solid ${border}33` }}>
      <div className="relative p-6 md:p-8">
        <div className="text-center mb-6 flex items-center justify-center gap-2">
          <Clock className="w-5 h-5" style={{ color: text }} />
          <h3 className="text-lg md:text-xl font-bold" style={{ color: text }}>{title}</h3>
        </div>
        <div className="flex justify-center items-center gap-3 md:gap-6" dir="rtl">
          {units.map((u, i) => (
            <div key={i} className="text-center">
              <div className="rounded-xl p-3 md:p-5 shadow-lg min-w-[60px] md:min-w-[80px]" style={{ backgroundColor: cardBg, border: `2px solid ${border}4D` }}>
                <AnimatedNumber value={u.value} className="text-3xl md:text-5xl font-bold tabular-nums text-foreground" animationType={animationType} />
              </div>
              <div className="text-sm font-medium text-muted-foreground mt-2">{u.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== نمط 3: بسيط =====
function MinimalStyle({ timeLeft, bgColor, textColor, title }: StyleProps) {
  const parts: string[] = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  parts.push(`${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`);
  return (
    <div className="rounded-xl p-6 shadow-md border border-border" style={{ backgroundColor: bgColor || 'hsl(var(--card))' }}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Timer className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <div className="text-4xl md:text-6xl font-mono font-bold tabular-nums tracking-wider" dir="ltr" style={{ color: textColor || 'hsl(var(--foreground))' }}>
          {parts.join(' ')}
        </div>
      </div>
    </div>
  );
}

// ===== نمط 4: دائري =====
function CircularStyle({ timeLeft, textColor, borderColor, title, animationType }: StyleProps) {
  const colors = [borderColor || '#3b82f6', textColor || '#10b981', borderColor || '#f59e0b', textColor || '#ef4444'];
  const units = getTimeUnits(timeLeft);
  const CircleProgress = ({ value, max, color }: { value: number; max: number; color: string }) => {
    const r = 36, c = 2 * Math.PI * r, p = ((max - value) / max) * c;
    return (
      <svg className="w-20 h-20 md:w-24 md:h-24 -rotate-90">
        <circle cx="50%" cy="50%" r={r} className="fill-none" stroke="hsl(var(--muted) / 0.3)" strokeWidth="5" />
        <circle cx="50%" cy="50%" r={r} className="fill-none transition-all duration-300" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={p} />
      </svg>
    );
  };
  const maxes = [30, 24, 60, 60];
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl">
      <div className="relative p-6 md:p-8">
        <h3 className="text-center text-lg md:text-xl font-bold text-white/90 mb-6">{title}</h3>
        <div className="flex justify-center items-center gap-3 md:gap-5" dir="rtl">
          {units.map((u, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="relative">
                <CircleProgress value={u.value} max={maxes[timeLeft.days > 0 ? i : i + 1] || 60} color={colors[i % colors.length]} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <AnimatedNumber value={u.value} className="text-xl md:text-2xl font-bold text-white tabular-nums" animationType={animationType} />
                </div>
              </div>
              <span className="text-xs text-white/60 mt-1">{u.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== نمط 5: زجاجي 3D =====
function GlassStyle({ timeLeft, bgColor, textColor, borderColor, title, animationType }: StyleProps) {
  const units = getTimeUnits(timeLeft);
  const glassBg = bgColor || 'rgba(255,255,255,0.1)';
  const text = textColor || '#ffffff';
  const border = borderColor || 'rgba(255,255,255,0.3)';
  return (
    <div className="relative overflow-hidden rounded-3xl shadow-2xl" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.8), rgba(168,85,247,0.8), rgba(236,72,153,0.8))' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)' }} />
      <div className="relative p-6 md:p-8 backdrop-blur-sm">
        <h3 className="text-center text-lg md:text-xl font-bold drop-shadow-lg mb-6" style={{ color: text }}>✨ {title} ✨</h3>
        <div className="flex justify-center items-center gap-3 md:gap-5" dir="rtl">
          {units.map((u, i) => (
            <div key={i} className="text-center">
              <div className="rounded-2xl p-3 md:p-5 min-w-[60px] md:min-w-[80px] hover:scale-105 transition-transform" style={{ background: glassBg, backdropFilter: 'blur(20px)', border: `1px solid ${border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                <AnimatedNumber value={u.value} color={text} className="text-3xl md:text-5xl font-bold tabular-nums drop-shadow-lg" animationType={animationType} />
              </div>
              <div className="text-sm font-medium mt-2 drop-shadow-md" style={{ color: text }}>{u.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== نمط 6: نيون =====
function NeonStyle({ timeLeft, textColor, title, animationType }: StyleProps) {
  const units = getTimeUnits(timeLeft);
  const neon = textColor || '#00ffff';
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-2xl" style={{ backgroundColor: '#0a0a0a', border: `1px solid ${neon}33` }}>
      <div className="relative p-6 md:p-8">
        <h3 className="text-center text-lg md:text-xl font-bold mb-6" style={{ color: neon, textShadow: `0 0 10px ${neon}, 0 0 30px ${neon}66` }}>
          <Zap className="inline w-5 h-5 mr-1" /> {title}
        </h3>
        <div className="flex justify-center items-center gap-3 md:gap-6" dir="rtl">
          {units.map((u, i) => (
            <div key={i} className="text-center">
              <div className="rounded-xl p-3 md:p-5 min-w-[60px] md:min-w-[80px]" style={{ border: `2px solid ${neon}66`, boxShadow: `0 0 15px ${neon}33, inset 0 0 15px ${neon}11`, backgroundColor: `${neon}08` }}>
                <AnimatedNumber value={u.value} color={neon} className="text-3xl md:text-5xl font-mono font-bold tabular-nums" animationType={animationType} />
              </div>
              <div className="text-xs mt-2" style={{ color: neon + '99' }}>{u.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== نمط 7: دافئ =====
function WarmGradientStyle({ timeLeft, title, animationType }: StyleProps) {
  const units = getTimeUnits(timeLeft);
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(135deg, #f97316, #ef4444, #ec4899)' }}>
      <div className="relative p-6 md:p-8">
        <h3 className="text-center text-lg md:text-xl font-bold text-white mb-6">
          <Flame className="inline w-5 h-5 mr-1" /> {title}
        </h3>
        <div className="flex justify-center items-center gap-3 md:gap-6" dir="rtl">
          {units.map((u, i) => (
            <div key={i} className="text-center">
              <div className="rounded-2xl p-3 md:p-5 min-w-[60px] md:min-w-[80px] bg-white/20 backdrop-blur-sm border border-white/30">
                <AnimatedNumber value={u.value} color="#ffffff" className="text-3xl md:text-5xl font-bold tabular-nums drop-shadow-lg" animationType={animationType} />
              </div>
              <div className="text-sm text-white/80 mt-2">{u.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== نمط 8: إسلامي =====
function IslamicStyle({ timeLeft, textColor, title, animationType }: StyleProps) {
  const units = getTimeUnits(timeLeft);
  const gold = textColor || '#d4af37';
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(135deg, #1a3a2a, #0d2818, #1a3a2a)', border: `2px solid ${gold}44` }}>
      <div className="absolute inset-0 islamic-pattern opacity-10" />
      <div className="relative p-6 md:p-8">
        <h3 className="text-center text-lg md:text-xl font-bold mb-1" style={{ color: gold, fontFamily: 'Amiri, serif' }}>
          ﴿ {title} ﴾
        </h3>
        <div className="w-16 h-0.5 mx-auto mb-6" style={{ background: `linear-gradient(to right, transparent, ${gold}, transparent)` }} />
        <div className="flex justify-center items-center gap-3 md:gap-6" dir="rtl">
          {units.map((u, i) => (
            <div key={i} className="text-center">
              <div className="rounded-lg p-3 md:p-5 min-w-[60px] md:min-w-[80px]" style={{ backgroundColor: `${gold}0D`, border: `1px solid ${gold}33` }}>
                <AnimatedNumber value={u.value} color={gold} className="text-3xl md:text-5xl font-bold tabular-nums" animationType={animationType} />
              </div>
              <div className="text-sm mt-2" style={{ color: `${gold}AA` }}>{u.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== نمط 9: فليب =====
function FlipStyle({ timeLeft, bgColor, textColor, title, animationType }: StyleProps) {
  const units = getTimeUnits(timeLeft);
  const bg = bgColor || '#1e293b';
  const text = textColor || '#f8fafc';
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-2xl p-6 md:p-8" style={{ backgroundColor: '#0f172a' }}>
      <h3 className="text-center text-lg md:text-xl font-bold text-slate-300 mb-6">{title}</h3>
      <div className="flex justify-center items-center gap-3 md:gap-6" dir="rtl">
        {units.map((u, i) => (
          <div key={i} className="text-center">
            <div className="relative rounded-lg overflow-hidden min-w-[60px] md:min-w-[80px]" style={{ backgroundColor: bg }}>
              <div className="absolute inset-x-0 top-1/2 h-px bg-black/30 z-10" />
              <div className="p-3 md:p-5">
                <AnimatedNumber value={u.value} color={text} className="text-3xl md:text-5xl font-bold tabular-nums font-mono" animationType={animationType} />
              </div>
              <div className="absolute bottom-0 inset-x-0 h-1/2 bg-black/10" />
            </div>
            <div className="text-xs text-slate-500 mt-2">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== نمط 10: فاخر =====
function LuxuryStyle({ timeLeft, title }: StyleProps) {
  const units = getTimeUnits(timeLeft);
  return (
    <div className="relative overflow-hidden rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.15) 0%, transparent 60%)' }} />
      <div className="relative p-6 md:p-8">
        <h3 className="text-center text-lg md:text-xl font-bold mb-6" style={{ color: '#d4af37', textShadow: '0 0 10px rgba(212,175,55,0.5)' }}>
          <Star className="inline w-5 h-5 mr-1" /> {title}
        </h3>
        <div className="flex justify-center items-center gap-3 md:gap-6" dir="rtl">
          {units.map((u, i) => (
            <div key={i} className="text-center">
              <div className="rounded-xl p-3 md:p-5 min-w-[60px] md:min-w-[80px]" style={{ background: 'linear-gradient(180deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 4px 20px rgba(212,175,55,0.1)' }}>
                <span className="text-3xl md:text-5xl font-bold tabular-nums" style={{ background: 'linear-gradient(180deg, #ffd700, #d4af37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {String(u.value).padStart(2, '0')}
                </span>
              </div>
              <div className="text-sm mt-2" style={{ color: '#d4af3799' }}>{u.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpiredState() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 text-center shadow-2xl">
      <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary-foreground animate-pulse" />
      <p className="text-2xl md:text-3xl text-primary-foreground font-bold">🎉 الحلقة الآن أو قريبًا جدًا! 🎉</p>
    </div>
  );
}

const STYLE_COMPONENTS: Record<number, React.FC<StyleProps>> = {
  1: LEDStyle, 2: ClassicStyle, 3: MinimalStyle, 4: CircularStyle, 5: GlassStyle,
  6: NeonStyle, 7: WarmGradientStyle, 8: IslamicStyle, 9: FlipStyle, 10: LuxuryStyle,
};

export function CountdownTimer({ targetDate, style = 1, bgColor, textColor, borderColor, title, animationType = 1 }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return <ExpiredState />;

  const StyleComponent = STYLE_COMPONENTS[style] || LEDStyle;
  return <StyleComponent timeLeft={timeLeft} bgColor={bgColor} textColor={textColor} borderColor={borderColor} title={title || DEFAULT_TITLE} animationType={animationType} />;
}

export function CountdownTimerPreview({ style, bgColor, textColor, borderColor, animationType }: { style: number; bgColor?: string; textColor?: string; borderColor?: string; animationType?: number }) {
  const previewTimeLeft = { days: 3, hours: 5, minutes: 23, seconds: 45 };
  const StyleComponent = STYLE_COMPONENTS[style] || LEDStyle;
  return <StyleComponent timeLeft={previewTimeLeft} bgColor={bgColor} textColor={textColor} borderColor={borderColor} title={DEFAULT_TITLE} animationType={animationType} />;
}

export const COUNTDOWN_STYLES = [
  { val: 1, label: 'LED' }, { val: 2, label: 'كلاسيك' }, { val: 3, label: 'بسيط' },
  { val: 4, label: 'دائري' }, { val: 5, label: '3D' }, { val: 6, label: 'نيون' },
  { val: 7, label: 'دافئ' }, { val: 8, label: 'إسلامي' }, { val: 9, label: 'فليب' },
  { val: 10, label: 'فاخر' },
];

export const COUNTDOWN_ANIMATIONS = [
  { val: 1, label: 'انقلاب', icon: '🔄' },
  { val: 2, label: 'تلاشي', icon: '✨' },
  { val: 3, label: 'انزلاق ↑', icon: '⬆️' },
  { val: 4, label: 'انزلاق ↓', icon: '⬇️' },
  { val: 5, label: 'نبضة', icon: '💫' },
  { val: 6, label: 'دوران', icon: '🌀' },
  { val: 7, label: 'ضبابي', icon: '🌫️' },
  { val: 8, label: 'موجة', icon: '🌊' },
  { val: 9, label: 'كاتبة', icon: '⌨️' },
  { val: 10, label: 'تشويش', icon: '⚡' },
];
