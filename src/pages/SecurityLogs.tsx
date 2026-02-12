import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Shield, Lock, Trash2, Ban, UserX, Home, RefreshCw, AlertTriangle } from 'lucide-react';

interface SecurityLog {
  id: string;
  accessed_at: string;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  is_authorized: boolean | null;
  password_attempted: boolean | null;
  fingerprint_id: string | null;
  isp: string | null;
  org: string | null;
  timezone: string | null;
  language: string | null;
}

interface BlockedUser {
  id: string;
  ip_address: string | null;
  fingerprint_id: string | null;
  reason: string | null;
  blocked_at: string;
}

// كلمة المرور الثابتة للأمان
const SECURITY_PASSWORD = '20122025';

export default function SecurityLogs() {
  const [password, setPassword] = useState('');
  const [storedPassword, setStoredPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // التحقق من كلمة المرور الثابتة
    if (password === SECURITY_PASSWORD) {
      setIsAuthenticated(true);
      setStoredPassword(password);
      loadData(password);
    } else {
      toast({ title: 'خطأ', description: 'كلمة المرور غير صحيحة', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const loadData = async (pwd: string = storedPassword) => {
    if (!pwd) return;
    setIsLoading(true);
    try {
      // جلب السجلات
      const { data: logsData, error: logsError } = await supabase.rpc('get_security_logs_authenticated', {
        p_password: pwd
      });
      if (logsError) throw logsError;
      if (logsData) setLogs(logsData as SecurityLog[]);

      // جلب المحظورين
      const { data: blockedData, error: blockedError } = await supabase.rpc('get_blocked_users_authenticated', {
        p_password: pwd
      });
      if (blockedError) throw blockedError;
      if (blockedData) setBlockedUsers(blockedData as BlockedUser[]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'خطأ', description: 'فشل في تحميل البيانات', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleBlockUser = async (log: SecurityLog) => {
    try {
      const { data, error } = await supabase.rpc('block_user_authenticated', {
        p_password: storedPassword,
        p_ip_address: log.ip_address || '',
        p_fingerprint_id: log.fingerprint_id || '',
        p_reason: `Blocked from security logs - ISP: ${log.isp || 'Unknown'}`
      });
      
      if (error) throw error;
      
      if (data) {
        toast({ title: 'تم الحظر', description: 'تم حظر المستخدم بنجاح' });
        loadData();
      }
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في حظر المستخدم', variant: 'destructive' });
    }
  };

  const handleUnblockUser = async (blockedId: string) => {
    try {
      const { data, error } = await supabase.rpc('unblock_user_authenticated', {
        p_password: storedPassword,
        p_blocked_id: blockedId
      });
      
      if (error) throw error;
      
      if (data) {
        toast({ title: 'تم إلغاء الحظر', description: 'تم إلغاء حظر المستخدم بنجاح' });
        loadData();
      }
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في إلغاء الحظر', variant: 'destructive' });
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      const { data, error } = await supabase.rpc('delete_access_log_authenticated', {
        p_password: storedPassword,
        p_log_id: logId
      });
      
      if (error) throw error;
      
      if (data) {
        toast({ title: 'تم الحذف', description: 'تم حذف السجل بنجاح' });
        setLogs(logs.filter(l => l.id !== logId));
      }
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في حذف السجل', variant: 'destructive' });
    }
  };

  const detectVpnIndicators = (log: SecurityLog): string[] => {
    const indicators: string[] = [];
    
    const vpnIsps = ['vpn', 'proxy', 'hosting', 'datacenter', 'cloud', 'server', 'digital ocean', 'aws', 'azure', 'google cloud', 'linode', 'vultr', 'ovh'];
    if (log.isp && vpnIsps.some(v => log.isp!.toLowerCase().includes(v))) {
      indicators.push('ISP مشبوه');
    }
    if (log.org && vpnIsps.some(v => log.org!.toLowerCase().includes(v))) {
      indicators.push('مؤسسة مشبوهة');
    }
    
    // التحقق من عدم تطابق المنطقة الزمنية
    if (log.timezone && log.country) {
      const timezoneCountry = log.timezone.split('/')[0];
      if (timezoneCountry && !log.country.toLowerCase().includes(timezoneCountry.toLowerCase())) {
        indicators.push('عدم تطابق المنطقة الزمنية');
      }
    }
    
    return indicators;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">سجل الحماية</CardTitle>
            <p className="text-muted-foreground mt-2">أدخل كلمة المرور للوصول</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'جاري التحقق...' : 'دخول'}
              </Button>
            </form>
            <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
              <Home className="ml-2 w-4 h-4" />
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">سجل الحماية</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => loadData()} variant="ghost" size="icon" disabled={isLoading}>
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">{logs.length}</div>
            <div className="text-sm text-muted-foreground">إجمالي السجلات</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {logs.filter(l => l.is_authorized).length}
            </div>
            <div className="text-sm text-muted-foreground">دخول ناجح</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-destructive">
              {logs.filter(l => !l.is_authorized && l.password_attempted).length}
            </div>
            <div className="text-sm text-muted-foreground">محاولات فاشلة</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">{blockedUsers.length}</div>
            <div className="text-sm text-muted-foreground">محظورون</div>
          </div>
        </div>

        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              سجلات الدخول ({logs.length})
            </TabsTrigger>
            <TabsTrigger value="blocked" className="flex items-center gap-2">
              <Ban className="w-4 h-4" />
              المحظورين ({blockedUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  سجلات محاولات الدخول
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">لا توجد سجلات</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">التاريخ</TableHead>
                          <TableHead className="text-right">IP</TableHead>
                          <TableHead className="text-right">الموقع</TableHead>
                          <TableHead className="text-right">الجهاز</TableHead>
                          <TableHead className="text-right">ISP</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">مؤشرات VPN</TableHead>
                          <TableHead className="text-right">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => {
                          const vpnIndicators = detectVpnIndicators(log);
                          return (
                            <TableRow key={log.id} className={vpnIndicators.length > 0 ? 'bg-destructive/5' : ''}>
                              <TableCell className="whitespace-nowrap text-sm">
                                {new Date(log.accessed_at).toLocaleString('ar-SA')}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{log.ip_address || '-'}</TableCell>
                              <TableCell>
                                {log.country && log.city ? `${log.city}, ${log.country}` : log.country || '-'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {log.device_type} - {log.browser}
                              </TableCell>
                              <TableCell className="text-sm max-w-[150px] truncate" title={log.isp || ''}>
                                {log.isp || '-'}
                              </TableCell>
                              <TableCell>
                                {log.is_authorized ? (
                                  <Badge variant="default" className="bg-green-500">مصرح</Badge>
                                ) : log.password_attempted ? (
                                  <Badge variant="destructive">فشل</Badge>
                                ) : (
                                  <Badge variant="secondary">زيارة</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {vpnIndicators.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {vpnIndicators.map((indicator, i) => (
                                      <Badge key={i} variant="destructive" className="text-xs">
                                        {indicator}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-green-600">نظيف</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        title="حظر"
                                        className="h-8 w-8 text-amber-500 hover:text-amber-600"
                                      >
                                        <Ban className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent dir="rtl">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>حظر المستخدم</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          هل تريد حظر هذا المستخدم؟ سيتم حظر IP و Fingerprint.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex-row-reverse gap-2">
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleBlockUser(log)}>
                                          حظر
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        title="حذف"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent dir="rtl">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                          <AlertTriangle className="w-5 h-5 text-destructive" />
                                          حذف السجل
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex-row-reverse gap-2">
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteLog(log.id)}
                                          className="bg-destructive hover:bg-destructive/90"
                                        >
                                          حذف
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocked">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="w-5 h-5" />
                  المستخدمين المحظورين
                </CardTitle>
              </CardHeader>
              <CardContent>
                {blockedUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Ban className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">لا يوجد مستخدمين محظورين</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">تاريخ الحظر</TableHead>
                          <TableHead className="text-right">IP</TableHead>
                          <TableHead className="text-right">Fingerprint</TableHead>
                          <TableHead className="text-right">السبب</TableHead>
                          <TableHead className="text-right">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blockedUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(user.blocked_at).toLocaleString('ar-SA')}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{user.ip_address || '-'}</TableCell>
                            <TableCell className="font-mono text-xs max-w-[150px] truncate">
                              {user.fingerprint_id || '-'}
                            </TableCell>
                            <TableCell>{user.reason || '-'}</TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    إلغاء الحظر
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>إلغاء الحظر</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      هل تريد إلغاء حظر هذا المستخدم؟
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-row-reverse gap-2">
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleUnblockUser(user.id)}>
                                      إلغاء الحظر
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
