import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { BarChart3, Users, MessageSquare, TrendingUp, Globe, Monitor, Smartphone as SmartphoneIcon, Tablet, Eye } from 'lucide-react';
import { getCategoryLabel } from '@/lib/categories';

interface Question {
  id: string;
  category: string;
  question_text: string;
  created_at: string;
  review_status: string | null;
  reviewed_text: string | null;
  reviewer_notes: string | null;
}

interface AccessLog {
  id: string;
  accessed_at: string;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  is_authorized: boolean | null;
}

interface AdminStatsProps {
  questions: Question[];
  accessLogs: AccessLog[];
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function AdminStats({ questions, accessLogs }: AdminStatsProps) {
  // ملخص عام
  const summary = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const questionsToday = questions.filter(q => q.created_at.startsWith(todayStr)).length;
    const thisWeek = questions.filter(q => {
      const diff = (today.getTime() - new Date(q.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }).length;
    const avgPerDay = questions.length > 0 
      ? (questions.length / Math.max(1, Math.ceil((today.getTime() - new Date(questions[questions.length - 1]?.created_at).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1)
      : '0';
    
    // أكثر فئة طلباً
    const catCount: Record<string, number> = {};
    questions.forEach(q => {
      const cat = getCategoryLabel(q.category);
      catCount[cat] = (catCount[cat] || 0) + 1;
    });
    const topCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];

    return { questionsToday, thisWeek, avgPerDay, topCategory, totalVisitors: accessLogs.length };
  }, [questions, accessLogs]);

  // إحصائيات حسب الفئة
  const categoryData = useMemo(() => {
    const count: Record<string, number> = {};
    questions.forEach(q => {
      const cat = getCategoryLabel(q.category);
      count[cat] = (count[cat] || 0) + 1;
    });
    return Object.entries(count)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [questions]);

  // إحصائيات آخر 7 أيام
  const dailyData = useMemo(() => {
    const today = new Date();
    const days: { name: string; questions: number; visitors: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const label = date.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' });
      days.push({
        name: label,
        questions: questions.filter(q => q.created_at.startsWith(dateStr)).length,
        visitors: accessLogs.filter(l => l.accessed_at.startsWith(dateStr)).length,
      });
    }
    return days;
  }, [questions, accessLogs]);

  // إحصائيات آخر 4 أسابيع
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weeks: { name: string; count: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(today);
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date(today);
      end.setDate(end.getDate() - i * 7);
      const count = questions.filter(q => {
        const d = new Date(q.created_at);
        return d >= start && d < end;
      }).length;
      weeks.push({
        name: `أسبوع ${4 - i}`,
        count,
      });
    }
    return weeks;
  }, [questions]);

  // إحصائيات الأجهزة
  const deviceData = useMemo(() => {
    const count: Record<string, number> = {};
    accessLogs.forEach(l => {
      const type = l.device_type || 'غير معروف';
      count[type] = (count[type] || 0) + 1;
    });
    return Object.entries(count).map(([name, value]) => ({ name, value }));
  }, [accessLogs]);

  // إحصائيات المتصفحات
  const browserData = useMemo(() => {
    const count: Record<string, number> = {};
    accessLogs.forEach(l => {
      const browser = l.browser || 'غير معروف';
      count[browser] = (count[browser] || 0) + 1;
    });
    return Object.entries(count)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [accessLogs]);

  // إحصائيات البلدان
  const countryData = useMemo(() => {
    const count: Record<string, number> = {};
    accessLogs.forEach(l => {
      const country = l.country || 'غير معروف';
      count[country] = (count[country] || 0) + 1;
    });
    return Object.entries(count)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [accessLogs]);

  const getDeviceIcon = (type: string) => {
    if (type.toLowerCase().includes('mobile') || type.toLowerCase().includes('هاتف')) return <SmartphoneIcon className="w-4 h-4" />;
    if (type.toLowerCase().includes('tablet')) return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* ملخص عام - بطاقات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center space-y-1">
          <MessageSquare className="w-5 h-5 mx-auto text-primary" />
          <div className="text-2xl font-bold text-primary">{questions.length}</div>
          <div className="text-xs text-muted-foreground">إجمالي الأسئلة</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center space-y-1">
          <TrendingUp className="w-5 h-5 mx-auto text-emerald-500" />
          <div className="text-2xl font-bold text-emerald-500">{summary.questionsToday}</div>
          <div className="text-xs text-muted-foreground">أسئلة اليوم</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center space-y-1">
          <BarChart3 className="w-5 h-5 mx-auto text-blue-500" />
          <div className="text-2xl font-bold text-blue-500">{summary.thisWeek}</div>
          <div className="text-xs text-muted-foreground">هذا الأسبوع</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center space-y-1">
          <Users className="w-5 h-5 mx-auto text-amber-500" />
          <div className="text-2xl font-bold text-amber-500">{summary.totalVisitors}</div>
          <div className="text-xs text-muted-foreground">إجمالي الزوار</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center space-y-1">
          <Eye className="w-5 h-5 mx-auto text-purple-500" />
          <div className="text-2xl font-bold text-purple-500">{summary.avgPerDay}</div>
          <div className="text-xs text-muted-foreground">معدل يومي</div>
        </div>
      </div>

      {/* أكثر فئة */}
      {summary.topCategory && (
        <div className="bg-gradient-to-l from-primary/10 to-transparent border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="bg-primary/20 rounded-full p-2">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">أكثر نوع طلباً</div>
            <div className="font-bold text-foreground">{summary.topCategory[0]} ({summary.topCategory[1]} سؤال)</div>
          </div>
        </div>
      )}

      {/* رسوم بيانية أساسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* الأسئلة والزوار - آخر 7 أيام */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-medium mb-4 text-center text-sm">📊 الأسئلة والزوار - آخر 7 أيام</h4>
          {questions.length > 0 || accessLogs.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="questions" name="أسئلة" stroke="#3b82f6" fill="url(#colorQ)" />
                <Area type="monotone" dataKey="visitors" name="زوار" stroke="#10b981" fill="url(#colorV)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
          )}
        </div>

        {/* الأسئلة حسب الفئة */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-medium mb-4 text-center text-sm">📌 الأسئلة حسب الفئة</h4>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
          )}
        </div>

        {/* الأسئلة حسب الأسبوع */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-medium mb-4 text-center text-sm">📅 تطور الأسئلة - آخر 4 أسابيع</h4>
          {questions.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" name="أسئلة" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
          )}
        </div>

        {/* الزوار حسب البلد */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-medium mb-4 text-center text-sm">🌍 الزوار حسب البلد</h4>
          {countryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={countryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" fontSize={11} />
                <YAxis type="category" dataKey="name" fontSize={11} width={80} />
                <Tooltip />
                <Bar dataKey="value" name="زوار" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* إحصائيات الأجهزة والمتصفحات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* الأجهزة */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-medium mb-4 text-center text-sm">📱 أنواع الأجهزة</h4>
          {deviceData.length > 0 ? (
            <div className="space-y-3">
              {deviceData.map((d, i) => {
                const total = accessLogs.length || 1;
                const pct = ((d.value / total) * 100).toFixed(0);
                return (
                  <div key={d.name} className="flex items-center gap-3">
                    {getDeviceIcon(d.name)}
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{d.name}</span>
                        <span className="text-muted-foreground">{d.value} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all" 
                          style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
          )}
        </div>

        {/* المتصفحات */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="font-medium mb-4 text-center text-sm">🌐 المتصفحات</h4>
          {browserData.length > 0 ? (
            <div className="space-y-3">
              {browserData.map((b, i) => {
                const total = accessLogs.length || 1;
                const pct = ((b.value / total) * 100).toFixed(0);
                return (
                  <div key={b.name} className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{b.name}</span>
                        <span className="text-muted-foreground">{b.value} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all" 
                          style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[(i + 3) % CHART_COLORS.length] }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
          )}
        </div>
      </div>
    </div>
  );
}
