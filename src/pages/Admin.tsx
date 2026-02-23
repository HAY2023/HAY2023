import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings, useVerifyAdminPassword, useUpdateSettingsAuthenticated, useDeleteAllQuestionsAuthenticated, useDeleteSelectedQuestionsAuthenticated } from '@/hooks/useSettings';
import { useGetQuestionsAuthenticated, useGetAccessLogsAuthenticated, Question, AccessLog } from '@/hooks/useQuestionsList';
import { useVideos, useAddVideo, useDeleteVideo, useReorderVideos, useUpdateVideo, Video as VideoType } from '@/hooks/useVideos';
import { useAnnouncements, useAddAnnouncement, useDeleteAnnouncement } from '@/hooks/useAnnouncements';
import { useAllFlashMessages, useAddFlashMessage, useDeleteFlashMessage } from '@/hooks/useFlashMessages';
import { supabase } from '@/integrations/supabase/client';
import { logAdminAccess } from '@/hooks/useAdminAccessLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';
import { getCategoryLabel } from '@/lib/categories';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CountdownTimerPreview } from '@/components/CountdownTimer';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableVideoItem } from '@/components/SortableVideoItem';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Lock, MessageSquare, Calendar, Video,
  FileSpreadsheet, FileText, Bell, Trash2, Settings, List, Home, AlertTriangle, CheckSquare, Plus, Megaphone, Zap, Hash,
  Shield, MapPin, Monitor, Globe, CheckCircle, XCircle, Clock, Wifi, Smartphone, Fingerprint, ChevronDown, ChevronUp, Search, Filter, BarChart3, Send, Bug, AlertCircle, RefreshCw, Timer, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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

// Helper functions for video URL parsing
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getGoogleDriveFileId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/\n?#]+)/,
    /drive\.google\.com\/open\?id=([^&\n?#]+)/,
    /drive\.google\.com\/uc\?.*id=([^&\n?#]+)/,
    /docs\.google\.com\/file\/d\/([^/\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [storedPassword, setStoredPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionsCount, setQuestionsCount] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // ظپظ„ط§طھط± ط§ظ„ط³ط¬ظ„
  const [logSearchIP, setLogSearchIP] = useState('');
  const [logFilterStatus, setLogFilterStatus] = useState<'all' | 'authorized' | 'failed'>('all');
  const [logFilterDate, setLogFilterDate] = useState('');

  // ظپظ„طھط± ط§ظ„ط£ط³ط¦ظ„ط©
  const [questionFilter, setQuestionFilter] = useState<'all' | 'new' | 'old'>('all');
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState<string>('all');

  const { toast } = useToast();

  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: videos, isLoading: videosLoading } = useVideos();
  const { data: announcements } = useAnnouncements();
  const { data: flashMessages } = useAllFlashMessages();
  const verifyPassword = useVerifyAdminPassword();
  const updateSettings = useUpdateSettingsAuthenticated();
  const getQuestions = useGetQuestionsAuthenticated();
  const getAccessLogs = useGetAccessLogsAuthenticated();
  const deleteAllQuestions = useDeleteAllQuestionsAuthenticated();
  const deleteSelectedQuestions = useDeleteSelectedQuestionsAuthenticated();
  const addVideo = useAddVideo();
  const deleteVideo = useDeleteVideo();
  const reorderVideos = useReorderVideos();
  const updateVideo = useUpdateVideo();
  const addAnnouncement = useAddAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const addFlashMessage = useAddFlashMessage();
  const deleteFlashMessage = useDeleteFlashMessage();

  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [nextSessionDate, setNextSessionDate] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [showCountdown, setShowCountdown] = useState(true);
  const [countdownStyle, setCountdownStyle] = useState(1);
  const [showQuestionCount, setShowQuestionCount] = useState(false);
  const [showInstallPage, setShowInstallPage] = useState(true);
  const [savingVideo, setSavingVideo] = useState(false);
  const [savingCountdownStyle, setSavingCountdownStyle] = useState(false);

  // Countdown color customization
  const [countdownBgColor, setCountdownBgColor] = useState('#000000');
  const [countdownTextColor, setCountdownTextColor] = useState('#22c55e');
  const [countdownBorderColor, setCountdownBorderColor] = useState('#166534');
  const [savingCountdownColors, setSavingCountdownColors] = useState(false);
  const [localVideos, setLocalVideos] = useState<VideoType[]>([]);

  // Announcement states
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementType, setAnnouncementType] = useState('info');
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // Flash message states
  const [flashMessage, setFlashMessage] = useState('');
  const [flashDirection, setFlashDirection] = useState('rtl');
  const [flashColor, setFlashColor] = useState('#3b82f6');
  const [flashStartDate, setFlashStartDate] = useState('');
  const [flashEndDate, setFlashEndDate] = useState('');
  const [flashFontSize, setFlashFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [savingFlash, setSavingFlash] = useState(false);

  // Notification settings states
  const [notifyOnQuestion, setNotifyOnQuestion] = useState(true);
  const [notifyEveryN, setNotifyEveryN] = useState(10);
  const [savingNotification, setSavingNotification] = useState(false);

  // Push notification states
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<Array<{
    id: string;
    title: string;
    body: string;
    sent_at: string;
    recipients_count: number;
  }>>([]);

  // Admin device management states
  const [adminDeviceToken, setAdminDeviceToken] = useState('');
  const [settingAdminDevice, setSettingAdminDevice] = useState(false);
  const [pushTokensList, setPushTokensList] = useState<Array<{
    id: string;
    token: string;
    device_type: string | null;
    is_admin: boolean | null;
    created_at: string | null;
  }>>([]);

  // Content filter state
  const [contentFilterEnabled, setContentFilterEnabled] = useState(true);

  // User reports state
  const [userReports, setUserReports] = useState<Array<{
    id: string;
    report_type: string;
    message: string;
    email: string | null;
    device_info: any;
    created_at: string;
    status: string;
  }>>([]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ط¥ط­طµط§ط¦ظٹط§طھ ط§ظ„ط£ط³ط¦ظ„ط©
  const questionStats = useMemo(() => {
    const categoryCount: Record<string, number> = {};
    questions.forEach(q => {
      const cat = getCategoryLabel(q.category);
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

    // ط¥ط­طµط§ط¦ظٹط§طھ ط­ط³ط¨ ط§ظ„طھط§ط±ظٹط® (ط¢ط®ط± 7 ط£ظٹط§ظ…)
    const last7Days: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' });
      last7Days[dateStr] = 0;
    }

    questions.forEach(q => {
      const qDate = new Date(q.created_at);
      const daysDiff = Math.floor((today.getTime() - qDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7) {
        const dateStr = qDate.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' });
        if (last7Days[dateStr] !== undefined) {
          last7Days[dateStr]++;
        }
      }
    });

    const dailyData = Object.entries(last7Days).map(([name, count]) => ({ name, count }));

    return { categoryData, dailyData };
  }, [questions]);

  // ط¥ط­طµط§ط¦ظٹط§طھ ط§ظ„ط²ظˆط§ط± ط­ط³ط¨ ط§ظ„ظٹظˆظ…
  const visitorStats = useMemo(() => {
    const last7Days: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' });
      last7Days[dateStr] = 0;
    }

    accessLogs.forEach(log => {
      const logDate = new Date(log.accessed_at);
      const daysDiff = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7) {
        const dateStr = logDate.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' });
        if (last7Days[dateStr] !== undefined) {
          last7Days[dateStr]++;
        }
      }
    });

    return Object.entries(last7Days).map(([name, count]) => ({ name, count }));
  }, [accessLogs]);

  // ظپظ„طھط±ط© ط§ظ„ط£ط³ط¦ظ„ط© ط­ط³ط¨ ط§ظ„طھطµظ†ظٹظپ ظˆط§ظ„طھط§ط±ظٹط® (ظ‚ط¯ظٹظ… ط£ظˆظ„ط§ظ‹ ط«ظ… ط¬ط¯ظٹط¯)
  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    // ظپظ„طھط± ط­ط³ط¨ ط§ظ„ظˆظ‚طھ (ظ‚ط¯ظٹظ…/ط¬ط¯ظٹط¯)
    if (questionFilter === 'new') {
      // ط§ظ„ط£ط³ط¦ظ„ط© ظپظٹ ط¢ط®ط± 24 ط³ط§ط¹ط©
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter(q => new Date(q.created_at) > oneDayAgo);
    } else if (questionFilter === 'old') {
      // ط§ظ„ط£ط³ط¦ظ„ط© ط£ظ‚ط¯ظ… ظ…ظ† 24 ط³ط§ط¹ط©
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter(q => new Date(q.created_at) <= oneDayAgo);
    }

    // ظپظ„طھط± ط­ط³ط¨ ظ†ظˆط¹ ط§ظ„ظپطھظˆظ‰
    if (questionCategoryFilter !== 'all') {
      filtered = filtered.filter(q => q.category === questionCategoryFilter);
    }

    // طھط±طھظٹط¨ ظ‚ط¯ظٹظ… ط£ظˆظ„ط§ظ‹ ط«ظ… ط¬ط¯ظٹط¯
    filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return filtered;
  }, [questions, questionFilter, questionCategoryFilter]);

  // ظپظ„طھط±ط© ط§ظ„ط³ط¬ظ„ط§طھ
  const filteredLogs = useMemo(() => {
    return accessLogs.filter(log => {
      // ظپظ„طھط± ط§ظ„ط¨ط­ط« ط¨ظ€ IP
      if (logSearchIP && !log.ip_address?.toLowerCase().includes(logSearchIP.toLowerCase())) {
        return false;
      }

      // ظپظ„طھط± ط§ظ„ط­ط§ظ„ط©
      if (logFilterStatus === 'authorized' && !log.is_authorized) return false;
      if (logFilterStatus === 'failed' && log.is_authorized) return false;

      // ظپظ„طھط± ط§ظ„طھط§ط±ظٹط®
      if (logFilterDate) {
        const logDate = new Date(log.accessed_at).toISOString().split('T')[0];
        if (logDate !== logFilterDate) return false;
      }

      return true;
    });
  }, [accessLogs, logSearchIP, logFilterStatus, logFilterDate]);

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const formatDateForInput = (isoDate: string | null): string => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (settings) {
      setIsBoxOpen(settings.is_box_open);
      setNextSessionDate(formatDateForInput(settings.next_session_date));
      setVideoTitle(settings.video_title || '');
      setVideoUrl(settings.video_url || '');
      setShowCountdown(settings.show_countdown);
      setCountdownStyle(settings.countdown_style ?? 1);
      setShowQuestionCount(settings.show_question_count ?? false);
      setShowInstallPage(settings.show_install_page ?? true);
      setContentFilterEnabled((settings as any).content_filter_enabled ?? true);
      setCountdownBgColor(settings.countdown_bg_color ?? '#000000');
      setCountdownTextColor(settings.countdown_text_color ?? '#22c55e');
      setCountdownBorderColor(settings.countdown_border_color ?? '#166534');
    }
  }, [settings]);

  useEffect(() => {
    if (videos) {
      setLocalVideos(videos);
    }
  }, [videos]);

  useEffect(() => {
    if (isAuthenticated && storedPassword) {
      loadQuestions();
      loadAccessLogs();
      loadNotificationHistory();
      loadUserReports();
      loadPushTokens();
    }
  }, [isAuthenticated, storedPassword]);

  const loadNotificationHistory = async () => {
    if (!storedPassword) return;
    try {
      const { data, error } = await supabase.rpc('get_notification_history_authenticated', {
        p_password: storedPassword
      });
      if (!error && data) {
        setNotificationHistory(data as any[]);
      }
    } catch (error) {
      console.error('Failed to load notification history:', error);
    }
  };

  const loadUserReports = async () => {
    if (!storedPassword) return;
    try {
      const { data, error } = await supabase.rpc('get_user_reports_authenticated', {
        p_password: storedPassword
      });
      if (!error && data) {
        setUserReports(data as any[]);
      }
    } catch (error) {
      console.error('Failed to load user reports:', error);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, newStatus: string) => {
    if (!storedPassword) return;
    try {
      const { data, error } = await supabase.rpc('update_report_status_authenticated', {
        p_password: storedPassword,
        p_report_id: reportId,
        p_status: newStatus
      });
      if (!error && data) {
        setUserReports(prev => prev.map(r =>
          r.id === reportId ? { ...r, status: newStatus } : r
        ));
        toast({ title: 'طھظ… ط§ظ„طھط­ط¯ظٹط«', description: `طھظ… طھط­ط¯ظٹط« ط­ط§ظ„ط© ط§ظ„ط¨ظ„ط§ط؛ ط¥ظ„ظ‰ "${newStatus === 'reviewed' ? 'طھظ…طھ ط§ظ„ظ…ط±ط§ط¬ط¹ط©' : newStatus === 'resolved' ? 'طھظ… ط§ظ„ط­ظ„' : 'ظ…ط¹ظ„ظ‚'}"` });
      }
    } catch (error) {
      console.error('Failed to update report status:', error);
      toast({ title: 'ط®ط·ط£', description: 'ظپط´ظ„ طھط­ط¯ظٹط« ط­ط§ظ„ط© ط§ظ„ط¨ظ„ط§ط؛', variant: 'destructive' });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!storedPassword) return;
    try {
      const { data, error } = await supabase.rpc('delete_user_report_authenticated', {
        p_password: storedPassword,
        p_report_id: reportId
      });
      if (!error && data) {
        setUserReports(prev => prev.filter(r => r.id !== reportId));
        toast({ title: 'طھظ… ط§ظ„ط­ط°ظپ', description: 'طھظ… ط­ط°ظپ ط§ظ„ط¨ظ„ط§ط؛ ط¨ظ†ط¬ط§ط­' });
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
      toast({ title: 'ط®ط·ط£', description: 'ظپط´ظ„ ط­ط°ظپ ط§ظ„ط¨ظ„ط§ط؛', variant: 'destructive' });
    }
  };

  const loadAccessLogs = async () => {
    if (!storedPassword) return;
    try {
      const data = await getAccessLogs.mutateAsync(storedPassword);
      setAccessLogs(data || []);
    } catch (error) {
      console.error('Failed to load access logs:', error);
    }
  };

  // ط·ظ„ط¨ ط¥ط°ظ† ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ ط¹ظ†ط¯ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('questions-realtime-admin')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'questions' },
        async () => {
          loadQuestions();
          toast({ title: 'سؤال جديد', description: 'تم استلام سؤال جديد' });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  
  // Set device as admin
  const handleSetAdminDevice = async () => {
    if (!storedPassword || !adminDeviceToken.trim()) return;
    setSettingAdminDevice(true);
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          action: 'set-admin',
          token: adminDeviceToken.trim(),
          admin_password: storedPassword
        }
      });

      if (error) throw error;

      setAdminDeviceToken('');
      await loadPushTokens();
      toast({
        title: 'âœ“ طھظ… ط§ظ„طھط¹ظٹظٹظ†',
        description: 'طھظ… طھط¹ظٹظٹظ† ط§ظ„ط¬ظ‡ط§ط² ظƒظ…ط³ط¤ظˆظ„ ط¨ظ†ط¬ط§ط­'
      });
    } catch (error) {
      console.error('Error setting admin device:', error);
      toast({ title: 'ط®ط·ط£', description: 'ظپط´ظ„ طھط¹ظٹظٹظ† ط§ظ„ط¬ظ‡ط§ط² ظƒظ…ط³ط¤ظˆظ„', variant: 'destructive' });
    }
    setSettingAdminDevice(false);
  };

  // Delete notification from history
  const handleDeleteNotification = async (notificationId: string) => {
    if (!storedPassword) return;
    try {
      const { error } = await supabase.rpc('delete_notification_authenticated', {
        p_password: storedPassword,
        p_notification_id: notificationId
      });

      if (error) throw error;

      setNotificationHistory(prev => prev.filter(n => n.id !== notificationId));
      toast({ title: 'âœ“ طھظ… ط§ظ„ط­ط°ظپ', description: 'طھظ… ط­ط°ظپ ط§ظ„ط¥ط´ط¹ط§ط± ط¨ظ†ط¬ط§ط­' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({ title: 'ط®ط·ط£', description: 'ظپط´ظ„ ط­ط°ظپ ط§ظ„ط¥ط´ط¹ط§ط±', variant: 'destructive' });
    }
  };

  const handleDeleteAllQuestions = async () => {
    if (!storedPassword) return;
    setIsLoading(true);
    try {
      const success = await deleteAllQuestions.mutateAsync(storedPassword);
      if (success) {
        setQuestions([]);
        setQuestionsCount(0);
        setSelectedQuestions([]);
        toast({ title: 'طھظ… ط§ظ„ط­ط°ظپ', description: 'طھظ… ط­ط°ظپ ط¬ظ…ظٹط¹ ط§ظ„ط£ط³ط¦ظ„ط© ط¨ظ†ط¬ط§ط­' });
      }
    } catch {
      toast({ title: 'ط®ط·ط£', description: 'ظپط´ظ„ ط­ط°ظپ ط§ظ„ط£ط³ط¦ظ„ط©', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleDeleteSelectedQuestions = async () => {
    if (!storedPassword || selectedQuestions.length === 0) return;
    setIsLoading(true);
    try {
      const success = await deleteSelectedQuestions.mutateAsync({
        password: storedPassword,
        questionIds: selectedQuestions,
      });
      if (success) {
        setQuestions(prev => prev.filter(q => !selectedQuestions.includes(q.id)));
        setQuestionsCount(prev => (prev ?? 0) - selectedQuestions.length);
        toast({ title: 'طھظ… ط§ظ„ط­ط°ظپ', description: `طھظ… ط­ط°ظپ ${selectedQuestions.length} ط³ط¤ط§ظ„` });
        setSelectedQuestions([]);
      }
    } catch {
      toast({ title: 'ط®ط·ط£', description: 'ظپط´ظ„ ط­ط°ظپ ط§ظ„ط£ط³ط¦ظ„ط© ط§ظ„ظ…ط­ط¯ط¯ط©', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.id));
    }
  };

  const toggleLogExpand = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl p-10 w-full max-w-md shadow-2xl shadow-primary/10">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…</h2>
            <p className="text-sm text-muted-foreground">ط£ط¯ط®ظ„ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ظ„ظ„ظˆطµظˆظ„ ط¥ظ„ظ‰ ظ„ظˆط­ط© ط§ظ„ط¥ط¯ط§ط±ط©</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium">ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  className="pr-11 text-center h-12 text-lg rounded-xl bg-muted/50 border-muted-foreground/20 focus:border-primary transition-colors"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-lg font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 ml-2 animate-spin" />
                  ط¬ط§ط±ظچ ط§ظ„طھط­ظ‚ظ‚...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 ml-2" />
                  ط¯ط®ظˆظ„
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="w-4 h-4 ml-2" />
              ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط±ط¦ظٹط³ظٹط©
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">ط¬ط§ط±ظچ ط§ظ„طھط­ظ…ظٹظ„...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 max-w-5xl">
        {/* Questions Count Summary */}
        <div className="bg-primary/10 rounded-xl p-4 mb-6 text-center">
          <div className="text-3xl font-bold text-primary">{questionsCount ?? 0}</div>
          <div className="text-sm text-muted-foreground">ط³ط¤ط§ظ„ ظ…ط³طھظ„ظ…</div>
        </div>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-9 mb-6">
            <TabsTrigger value="stats" className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">ط¥ط­طµط§ط¦ظٹط§طھ</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-1">
              <List className="w-4 h-4" />
              <span className="hidden md:inline">ط§ظ„ط£ط³ط¦ظ„ط©</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1">
              <Video className="w-4 h-4" />
              <span className="hidden md:inline">ط§ظ„ظپظٹط¯ظٹظˆ</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-1">
              <Megaphone className="w-4 h-4" />
              <span className="hidden md:inline">ط§ظ„ط¥ط¹ظ„ط§ظ†ط§طھ</span>
            </TabsTrigger>
            <TabsTrigger value="flash" className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span className="hidden md:inline">ظپظ„ط§ط´</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Bell className="w-4 h-4" />
              <span className="hidden md:inline">ط¥ط´ط¹ط§ط±ط§طھ</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1 relative">
              <Bug className="w-4 h-4" />
              <span className="hidden md:inline">ط§ظ„ط¨ظ„ط§ط؛ط§طھ</span>
              {userReports.filter(r => r.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {userReports.filter(r => r.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span className="hidden md:inline">ط§ظ„ط³ط¬ظ„</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ</span>
            </TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              ط¥ط­طµط§ط¦ظٹط§طھ ط§ظ„ط£ط³ط¦ظ„ط©
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ط§ظ„ط£ط³ط¦ظ„ط© ط­ط³ط¨ ط§ظ„ظپط¦ط© */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-medium mb-4 text-center">ط§ظ„ط£ط³ط¦ظ„ط© ط­ط³ط¨ ط§ظ„ظپط¦ط©</h4>
                {questionStats.categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={questionStats.categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {questionStats.categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ
                  </div>
                )}
              </div>

              {/* ط§ظ„ط£ط³ط¦ظ„ط© ط­ط³ط¨ ط§ظ„ظٹظˆظ… */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-medium mb-4 text-center">ط§ظ„ط£ط³ط¦ظ„ط© ظپظٹ ط¢ط®ط± 7 ط£ظٹط§ظ…</h4>
                {questions.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={questionStats.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" name="ط¹ط¯ط¯ ط§ظ„ط£ط³ط¦ظ„ط©" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ
                  </div>
                )}
              </div>

              {/* ط§ظ„ط²ظˆط§ط± ط­ط³ط¨ ط§ظ„ظٹظˆظ… */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-medium mb-4 text-center">ط§ظ„ط²ظˆط§ط± ظپظٹ ط¢ط®ط± 7 ط£ظٹط§ظ…</h4>
                {accessLogs.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={visitorStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" name="ط¹ط¯ط¯ ط§ظ„ط²ظˆط§ط±" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ
                  </div>
                )}
              </div>
            </div>

            {/* ظ…ظ„ط®طµ ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{questions.length}</div>
                <div className="text-sm text-muted-foreground">ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط£ط³ط¦ظ„ط©</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{questionStats.categoryData.length}</div>
                <div className="text-sm text-muted-foreground">ظپط¦ط§طھ ظ…ط®طھظ„ظپط©</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {accessLogs.length}
                </div>
                <div className="text-sm text-muted-foreground">ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط²ظˆط§ط±</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-500">
                  {accessLogs.filter(l => l.is_authorized).length}
                </div>
                <div className="text-sm text-muted-foreground">ط¯ط®ظˆظ„ ظ†ط§ط¬ط­</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-destructive">
                  {accessLogs.filter(l => !l.is_authorized).length}
                </div>
                <div className="text-sm text-muted-foreground">ظ…ط­ط§ظˆظ„ط§طھ ظپط§ط´ظ„ط©</div>
              </div>
            </div>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToExcel(questions)}
                  disabled={questions.length === 0}
                >
                  <FileSpreadsheet className="w-4 h-4 ml-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToPDF(questions)}
                  disabled={questions.length === 0}
                >
                  <FileText className="w-4 h-4 ml-2" />
                  PDF
                </Button>
                {questions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    <CheckSquare className="w-4 h-4 ml-2" />
                    {selectedQuestions.length === questions.length ? 'ط¥ظ„ط؛ط§ط، ط§ظ„طھط­ط¯ظٹط¯' : 'طھط­ط¯ظٹط¯ ط§ظ„ظƒظ„'}
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {selectedQuestions.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        ط­ط°ظپ ط§ظ„ظ…ط­ط¯ط¯ ({selectedQuestions.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          طھط£ظƒظٹط¯ ط§ظ„ط­ط°ظپ
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ {selectedQuestions.length} ط³ط¤ط§ظ„طں ظ„ط§ ظٹظ…ظƒظ† ط§ظ„طھط±ط§ط¬ط¹ ط¹ظ† ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogCancel>ط¥ظ„ط؛ط§ط،</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelectedQuestions} className="bg-destructive hover:bg-destructive/90">
                          ط­ط°ظپ ط§ظ„ظ…ط­ط¯ط¯
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={questions.length === 0}
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      ط­ط°ظپ ط§ظ„ظƒظ„
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        طھط£ظƒظٹط¯ ط§ظ„ط­ط°ظپ
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ط¬ظ…ظٹط¹ ط§ظ„ط£ط³ط¦ظ„ط©طں ظ„ط§ ظٹظ…ظƒظ† ط§ظ„طھط±ط§ط¬ط¹ ط¹ظ† ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                      <AlertDialogCancel>ط¥ظ„ط؛ط§ط،</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAllQuestions} className="bg-destructive hover:bg-destructive/90">
                        ط­ط°ظپ ط§ظ„ظƒظ„
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* ظپظ„ط§طھط± ط§ظ„ط£ط³ط¦ظ„ط© */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="w-4 h-4" />
                طھطµظپظٹط© ط§ظ„ط£ط³ط¦ظ„ط©
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">ط­ط³ط¨ ط§ظ„ظˆظ‚طھ</label>
                  <Select value={questionFilter} onValueChange={(v) => setQuestionFilter(v as typeof questionFilter)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ط¬ظ…ظٹط¹ ط§ظ„ط£ط³ط¦ظ„ط©</SelectItem>
                      <SelectItem value="old">ط£ط³ط¦ظ„ط© ظ‚ط¯ظٹظ…ط©</SelectItem>
                      <SelectItem value="new">ط£ط³ط¦ظ„ط© ط¬ط¯ظٹط¯ط© (ط¢ط®ط± 24 ط³ط§ط¹ط©)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm mb-1">ط­ط³ط¨ ظ†ظˆط¹ ط§ظ„ظپطھظˆظ‰</label>
                  <Select value={questionCategoryFilter} onValueChange={setQuestionCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ط¬ظ…ظٹط¹ ط§ظ„ط£ظ†ظˆط§ط¹</SelectItem>
                      {Array.from(new Set(questions.map(q => q.category))).map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {getCategoryLabel(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(questionFilter !== 'all' || questionCategoryFilter !== 'all') && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    ط¹ط±ط¶ {filteredQuestions.length} ظ…ظ† {questions.length} ط³ط¤ط§ظ„
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuestionFilter('all');
                      setQuestionCategoryFilter('all');
                    }}
                  >
                    ظ…ط³ط­ ط§ظ„ظپظ„ط§طھط±
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">ظ„ط§ طھظˆط¬ط¯ ط£ط³ط¦ظ„ط© ط­طھظ‰ ط§ظ„ط¢ظ†</p>
                </div>
              ) : (
                filteredQuestions.map((q, index) => (
                  <div
                    key={q.id}
                    className={`bg-card border rounded-lg p-4 cursor-pointer transition-colors ${selectedQuestions.includes(q.id) ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    onClick={() => toggleQuestionSelection(q.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedQuestions.includes(q.id)}
                        onCheckedChange={() => toggleQuestionSelection(q.id)}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                            {getCategoryLabel(q.category)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            #{index + 1} - {new Date(q.created_at).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                        <p className="text-sm">{q.question_text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* User Reports Tab - ط¨ظ„ط§ط؛ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† */}
          <TabsContent value="reports" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium flex items-center gap-2">
                <Bug className="w-5 h-5 text-primary" />
                ط¨ظ„ط§ط؛ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† ({userReports.length})
              </h3>
              <Button variant="outline" size="sm" onClick={loadUserReports}>
                طھط­ط¯ظٹط«
              </Button>
            </div>

            {userReports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>ظ„ط§ طھظˆط¬ط¯ ط¨ظ„ط§ط؛ط§طھ ط­ط§ظ„ظٹط§ظ‹</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userReports.map((report) => (
                  <div key={report.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${report.report_type === 'bug' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            report.report_type === 'suggestion' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                            {report.report_type === 'bug' ? 'ظ…ط´ظƒظ„ط© طھظ‚ظ†ظٹط©' : report.report_type === 'suggestion' ? 'ط§ظ‚طھط±ط§ط­' : 'ط£ط®ط±ظ‰'}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${report.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            report.status === 'reviewed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                            {report.status === 'pending' ? 'ظ…ط¹ظ„ظ‚' : report.status === 'reviewed' ? 'طھظ…طھ ط§ظ„ظ…ط±ط§ط¬ط¹ط©' : 'طھظ… ط§ظ„ط­ظ„'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{report.message}</p>
                        {report.email && (
                          <p className="text-xs text-muted-foreground">ًں“§ {report.email}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={report.status}
                          onValueChange={(value) => handleUpdateReportStatus(report.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">ظ…ط¹ظ„ظ‚</SelectItem>
                            <SelectItem value="reviewed">طھظ…طھ ط§ظ„ظ…ط±ط§ط¬ط¹ط©</SelectItem>
                            <SelectItem value="resolved">طھظ… ط§ظ„ط­ظ„</SelectItem>
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>ط­ط°ظپ ط§ظ„ط¨ظ„ط§ط؛</AlertDialogTitle>
                              <AlertDialogDescription>
                                ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ط¨ظ„ط§ط؛طں ظ„ط§ ظٹظ…ظƒظ† ط§ظ„طھط±ط§ط¬ط¹ ط¹ظ† ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ط¥ظ„ط؛ط§ط،</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteReport(report.id)}>
                                ط­ط°ظپ
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Logs Tab - ط³ط¬ظ„ ط§ظ„ط¯ط®ظˆظ„ */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="font-medium flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                ط³ط¬ظ„ ظ…ط­ط§ظˆظ„ط§طھ ط§ظ„ط¯ط®ظˆظ„ ({filteredLogs.length})
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/security-logs')}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Lock className="w-4 h-4 ml-2" />
                  ط³ط¬ظ„ط§طھ ط§ظ„ط£ظ…ط§ظ† ط§ظ„ظ…طھظ‚ط¯ظ…ط©
                </Button>
                <Button variant="outline" size="sm" onClick={loadAccessLogs}>
                  <RefreshCw className="w-4 h-4 ml-2" />
                  طھط­ط¯ظٹط«
                </Button>
              </div>
            </div>

            {/* ظپظ„ط§طھط± ط§ظ„ط¨ط­ط« */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="w-4 h-4" />
                ط§ظ„ط¨ط­ط« ظˆط§ظ„ظپظ„طھط±ط©
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">ط§ظ„ط¨ط­ط« ط¨ظ€ IP</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={logSearchIP}
                      onChange={(e) => setLogSearchIP(e.target.value)}
                      placeholder="ط§ط¨ط­ط« ط¨ط¹ظ†ظˆط§ظ† IP..."
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">ط§ظ„ط­ط§ظ„ط©</label>
                  <Select value={logFilterStatus} onValueChange={(v) => setLogFilterStatus(v as typeof logFilterStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ط§ظ„ظƒظ„</SelectItem>
                      <SelectItem value="authorized">ط¯ط®ظˆظ„ ظ†ط§ط¬ط­</SelectItem>
                      <SelectItem value="failed">ظ…ط­ط§ظˆظ„ط§طھ ظپط§ط´ظ„ط©</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm mb-1">ط§ظ„طھط§ط±ظٹط®</label>
                  <Input
                    type="date"
                    value={logFilterDate}
                    onChange={(e) => setLogFilterDate(e.target.value)}
                  />
                </div>
              </div>
              {(logSearchIP || logFilterStatus !== 'all' || logFilterDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLogSearchIP('');
                    setLogFilterStatus('all');
                    setLogFilterDate('');
                  }}
                >
                  ظ…ط³ط­ ط§ظ„ظپظ„ط§طھط±
                </Button>
              )}
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">ظ„ط§ طھظˆط¬ط¯ ط³ط¬ظ„ط§طھ</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`bg-card border rounded-lg overflow-hidden ${log.is_authorized ? 'border-green-500/30' : 'border-destructive/30'
                      }`}
                  >
                    {/* Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleLogExpand(log.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {log.is_authorized ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive" />
                          )}
                          <span className={log.is_authorized ? 'text-green-500 font-medium' : 'text-destructive font-medium'}>
                            {log.is_authorized ? 'ط¯ط®ظˆظ„ ظ…طµط±ط­' : 'ظ…ط­ط§ظˆظ„ط© ظپط§ط´ظ„ط©'}
                          </span>
                          {log.fingerprint_id && (
                            <span className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
                              <Fingerprint className="w-3 h-3" />
                              {log.fingerprint_id.slice(0, 8)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.accessed_at).toLocaleString('ar-SA')}
                          </span>
                          {expandedLogId === log.id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Globe className="w-4 h-4" />
                          <span>{log.ip_address || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{log.country && log.city ? `${log.city}, ${log.country}` : 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Smartphone className="w-4 h-4" />
                          <span>{log.device_type || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {log.browser} / {log.os}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedLogId === log.id && (
                      <div className="border-t border-border bg-muted/30 p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {/* ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظˆظ‚ط¹ */}
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2 text-primary">
                              <MapPin className="w-4 h-4" />
                              ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظˆظ‚ط¹
                            </h4>
                            <div className="bg-card rounded-lg p-3 space-y-1">
                              <p><span className="text-muted-foreground">ط§ظ„ط¯ظˆظ„ط©:</span> {log.country || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ط§ظ„ظ…ط¯ظٹظ†ط©:</span> {log.city || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ط§ظ„ظ…ظ†ط·ظ‚ط©:</span> {log.region || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ط§ظ„ط±ظ…ط² ط§ظ„ط¨ط±ظٹط¯ظٹ:</span> {log.postal || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              {log.latitude && log.longitude && (
                                <p><span className="text-muted-foreground">ط§ظ„ط¥ط­ط¯ط§ط«ظٹط§طھ:</span> {log.latitude}, {log.longitude}</p>
                              )}
                            </div>
                          </div>

                          {/* ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط´ط¨ظƒط© */}
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2 text-primary">
                              <Wifi className="w-4 h-4" />
                              ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط´ط¨ظƒط©
                            </h4>
                            <div className="bg-card rounded-lg p-3 space-y-1">
                              <p><span className="text-muted-foreground">IP:</span> {log.ip_address || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ظ…ط²ظˆط¯ ط§ظ„ط®ط¯ظ…ط©:</span> {log.isp || log.org || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ASN:</span> {log.asn || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ظ†ظˆط¹ ط§ظ„ط§طھطµط§ظ„:</span> {log.network_type || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ظ†ظˆط¹ ط§ظ„ط´ط¨ظƒط©:</span> {log.connection_type || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                            </div>
                          </div>

                          {/* ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط¬ظ‡ط§ط² */}
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2 text-primary">
                              <Monitor className="w-4 h-4" />
                              ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط¬ظ‡ط§ط²
                            </h4>
                            <div className="bg-card rounded-lg p-3 space-y-1">
                              <p><span className="text-muted-foreground">ط§ظ„ظ†ظˆط¹:</span> {log.device_type || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ط§ظ„ظ…طھطµظپط­:</span> {log.browser || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ط§ظ„ظ†ط¸ط§ظ…:</span> {log.os || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ط­ط¬ظ… ط§ظ„ط´ط§ط´ط©:</span> {log.screen_size || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ط¹ظ…ظ‚ ط§ظ„ط£ظ„ظˆط§ظ†:</span> {log.color_depth || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ظƒط«ط§ظپط© ط§ظ„ط¨ظƒط³ظ„:</span> {log.pixel_ratio || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ط¯ط¹ظ… ط§ظ„ظ„ظ…ط³:</span> {log.touch_support ? 'ظ†ط¹ظ…' : 'ظ„ط§'}</p>
                            </div>
                          </div>

                          {/* ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…طھطµظپط­ */}
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2 text-primary">
                              <Globe className="w-4 h-4" />
                              ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…طھطµظپط­
                            </h4>
                            <div className="bg-card rounded-lg p-3 space-y-1">
                              <p><span className="text-muted-foreground">ط§ظ„ظ„ط؛ط©:</span> {log.language || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ط§ظ„ظ…ظ†ط·ظ‚ط© ط§ظ„ط²ظ…ظ†ظٹط©:</span> {log.timezone || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ط¹ط¯ط¯ ط§ظ„ط£ظ†ظˆظٹط©:</span> {log.hardware_concurrency || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ط§ظ„ط°ط§ظƒط±ط©:</span> {log.device_memory ? `${log.device_memory} GB` : 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</p>
                              <p><span className="text-muted-foreground">ط§ظ„ظ…طµط¯ط±:</span> {log.referrer || 'ظ…ط¨ط§ط´ط±'}</p>
                            </div>
                          </div>
                        </div>

                        {/* User Agent */}
                        {log.user_agent && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-primary">User Agent</h4>
                            <div className="bg-card rounded-lg p-3">
                              <p className="text-xs text-muted-foreground break-all font-mono" dir="ltr">
                                {log.user_agent}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Fingerprint */}
                        {log.fingerprint_id && (
                          <div className="flex items-center gap-2 text-sm">
                            <Fingerprint className="w-4 h-4 text-primary" />
                            <span className="text-muted-foreground">ط¨طµظ…ط© ط§ظ„ظ…طھطµظپط­:</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs">{log.fingerprint_id}</code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4">
            {videosLoading ? (
              <div className="text-center py-4 text-muted-foreground">ط¬ط§ط±ظچ طھط­ظ…ظٹظ„ ط§ظ„ظپظٹط¯ظٹظˆظ‡ط§طھ...</div>
            ) : localVideos && localVideos.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">ط§ظ„ظپظٹط¯ظٹظˆظ‡ط§طھ ط§ظ„ط­ط§ظ„ظٹط© ({localVideos.length}) - ط§ط³ط­ط¨ ظ„ط¥ط¹ط§ط¯ط© ط§ظ„طھط±طھظٹط¨</h4>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={localVideos.map(v => v.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {localVideos.map((video) => (
                      <SortableVideoItem
                        key={video.id}
                        video={video}
                        onDelete={handleDeleteVideo}
                        onEdit={handleEditVideo}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>ظ„ط§ طھظˆط¬ط¯ ظپظٹط¯ظٹظˆظ‡ط§طھ</p>
              </div>
            )}

            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                ط¥ط¶ط§ظپط© ظپظٹط¯ظٹظˆ ط¬ط¯ظٹط¯
              </h4>
              <Input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="ط¹ظ†ظˆط§ظ† ط§ظ„ظپظٹط¯ظٹظˆ"
              />
              <Input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="ط±ط§ط¨ط· YouTube ط£ظˆ Google Drive (ظ…ط«ط§ظ„: https://www.youtube.com/watch?v=... ط£ظˆ https://drive.google.com/file/d/...)"
                dir="ltr"
              />

              {/* ظ…ط¹ط§ظٹظ†ط© ط§ظ„ظپظٹط¯ظٹظˆ */}
              {videoUrl && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 text-sm font-medium flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    ظ…ط¹ط§ظٹظ†ط© ط§ظ„ظپظٹط¯ظٹظˆ
                  </div>
                  <div className="aspect-video">
                    {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(videoUrl)}`}
                        title="ظ…ط¹ط§ظٹظ†ط©"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : videoUrl.includes('drive.google.com') || videoUrl.includes('docs.google.com/file') ? (
                      <iframe
                        src={`https://drive.google.com/file/d/${getGoogleDriveFileId(videoUrl)}/preview`}
                        title="ظ…ط¹ط§ظٹظ†ط©"
                        className="w-full h-full"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={videoUrl}
                        controls
                        className="w-full h-full"
                        preload="metadata"
                      >
                        ظ…طھطµظپط­ظƒ ظ„ط§ ظٹط¯ط¹ظ… طھط´ط؛ظٹظ„ ط§ظ„ظپظٹط¯ظٹظˆ
                      </video>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSaveVideo}
                disabled={savingVideo || !videoUrl || !videoTitle}
                className="w-full"
              >
                <Plus className="w-4 h-4 ml-2" />
                {savingVideo ? 'ط¬ط§ط±ظچ ط§ظ„ط¥ط¶ط§ظپط©...' : 'ط¥ط¶ط§ظپط© ط§ظ„ظپظٹط¯ظٹظˆ'}
              </Button>
            </div>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            {announcements && announcements.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">ط§ظ„ط¥ط¹ظ„ط§ظ†ط§طھ ط§ظ„ط­ط§ظ„ظٹط© ({announcements.length})</h4>
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <span className={`text-xs px-2 py-1 rounded ${ann.type === 'success' ? 'bg-green-500/20 text-green-600' :
                          ann.type === 'warning' ? 'bg-amber-500/20 text-amber-600' :
                            ann.type === 'error' ? 'bg-destructive/20 text-destructive' :
                              'bg-primary/20 text-primary'
                          }`}>
                          {ann.type === 'success' ? 'ظ†ط¬ط§ط­' : ann.type === 'warning' ? 'طھظ†ط¨ظٹظ‡' : ann.type === 'error' ? 'ط®ط·ط£' : 'ط¥ط¹ظ„ط§ظ†'}
                        </span>
                        <p className="mt-2 text-sm">{ann.message}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>ظ„ط§ طھظˆط¬ط¯ ط¥ط¹ظ„ط§ظ†ط§طھ</p>
              </div>
            )}

            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                ط¥ط¶ط§ظپط© ط¥ط¹ظ„ط§ظ† ط¬ط¯ظٹط¯
              </h4>
              <Input
                type="text"
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                placeholder="ظ†طµ ط§ظ„ط¥ط¹ظ„ط§ظ†"
              />
              <Select value={announcementType} onValueChange={setAnnouncementType}>
                <SelectTrigger>
                  <SelectValue placeholder="ظ†ظˆط¹ ط§ظ„ط¥ط¹ظ„ط§ظ†" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ط¥ط¹ظ„ط§ظ†</SelectItem>
                  <SelectItem value="success">ظ†ط¬ط§ط­</SelectItem>
                  <SelectItem value="warning">طھظ†ط¨ظٹظ‡</SelectItem>
                  <SelectItem value="error">طھط­ط°ظٹط±</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSaveAnnouncement}
                disabled={savingAnnouncement || !announcementMessage}
                className="w-full"
              >
                <Plus className="w-4 h-4 ml-2" />
                {savingAnnouncement ? 'ط¬ط§ط±ظچ ط§ظ„ط¥ط¶ط§ظپط©...' : 'ط¥ط¶ط§ظپط© ط§ظ„ط¥ط¹ظ„ط§ظ†'}
              </Button>
            </div>
          </TabsContent>

          {/* Flash Messages Tab */}
          <TabsContent value="flash" className="space-y-4">
            {flashMessages && flashMessages.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">ط±ط³ط§ط¦ظ„ ط§ظ„ظپظ„ط§ط´ ط§ظ„ط­ط§ظ„ظٹط© ({flashMessages.length})</h4>
                {flashMessages.map((msg) => (
                  <div key={msg.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: msg.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {msg.text_direction === 'rtl' ? 'ظ…ظ† ط§ظ„ظٹظ…ظٹظ† ظ„ظ„ظٹط³ط§ط±' : 'ظ…ظ† ط§ظ„ظٹط³ط§ط± ظ„ظ„ظٹظ…ظٹظ†'}
                          </span>
                          {msg.start_date && (
                            <span className="text-xs text-muted-foreground">
                              ظ…ظ†: {new Date(msg.start_date).toLocaleDateString('ar-SA')}
                            </span>
                          )}
                          {msg.end_date && (
                            <span className="text-xs text-muted-foreground">
                              ط¥ظ„ظ‰: {new Date(msg.end_date).toLocaleDateString('ar-SA')}
                            </span>
                          )}
                        </div>
                        <p
                          className="text-sm p-2 rounded"
                          style={{ backgroundColor: msg.color, color: getContrastColor(msg.color) }}
                          dir={msg.text_direction}
                        >
                          {msg.message}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteFlashMessage(msg.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>ظ„ط§ طھظˆط¬ط¯ ط±ط³ط§ط¦ظ„ ظپظ„ط§ط´</p>
              </div>
            )}

            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                ط¥ط¶ط§ظپط© ط±ط³ط§ظ„ط© ظپظ„ط§ط´ ط¬ط¯ظٹط¯ط©
              </h4>

              <Input
                type="text"
                value={flashMessage}
                onChange={(e) => setFlashMessage(e.target.value)}
                placeholder="ظ†طµ ط§ظ„ط±ط³ط§ظ„ط©"
              />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-2">ط§طھط¬ط§ظ‡ ط§ظ„ظ†طµ</label>
                  <Select value={flashDirection} onValueChange={setFlashDirection}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rtl">ظ…ظ† ط§ظ„ظٹظ…ظٹظ† ظ„ظ„ظٹط³ط§ط±</SelectItem>
                      <SelectItem value="ltr">ظ…ظ† ط§ظ„ظٹط³ط§ط± ظ„ظ„ظٹظ…ظٹظ†</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm mb-2">ط­ط¬ظ… ط§ظ„ط®ط·</label>
                  <Select value={flashFontSize} onValueChange={(v) => setFlashFontSize(v as 'sm' | 'md' | 'lg' | 'xl')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">طµط؛ظٹط±</SelectItem>
                      <SelectItem value="md">ظ…طھظˆط³ط·</SelectItem>
                      <SelectItem value="lg">ظƒط¨ظٹط±</SelectItem>
                      <SelectItem value="xl">ظƒط¨ظٹط± ط¬ط¯ط§ظ‹</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm mb-2">ط§ظ„ظ„ظˆظ†</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={flashColor}
                      onChange={(e) => setFlashColor(e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={flashColor}
                      onChange={(e) => setFlashColor(e.target.value)}
                      className="flex-1"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">طھط§ط±ظٹط® ط§ظ„ط¨ط¯ط§ظٹط© (ط§ط®طھظٹط§ط±ظٹ)</label>
                  <Input
                    type="datetime-local"
                    value={flashStartDate}
                    onChange={(e) => setFlashStartDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">ط§طھط±ظƒظ‡ ظپط§ط±ط؛ط§ظ‹ ظ„ظ„ط¸ظ‡ظˆط± ظپظˆط±ط§ظ‹</p>
                </div>

                <div>
                  <label className="block text-sm mb-2">طھط§ط±ظٹط® ط§ظ„ظ†ظ‡ط§ظٹط© (ط§ط®طھظٹط§ط±ظٹ)</label>
                  <Input
                    type="datetime-local"
                    value={flashEndDate}
                    onChange={(e) => setFlashEndDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">ط§طھط±ظƒظ‡ ظپط§ط±ط؛ط§ظ‹ ظ„ط¹ط¯ظ… ط§ظ„ط§ظ†طھظ‡ط§ط،</p>
                </div>
              </div>

              {flashMessage && (
                <div>
                  <label className="block text-sm mb-2">ظ…ط¹ط§ظٹظ†ط©:</label>
                  <div
                    className="p-3 rounded-lg flex items-center gap-2 overflow-hidden"
                    style={{ backgroundColor: flashColor, color: getContrastColor(flashColor) }}
                    dir={flashDirection}
                  >
                    <Zap className="w-5 h-5 flex-shrink-0" />
                    <div className="animate-marquee whitespace-nowrap">
                      <p className={`inline-block font-medium ${flashFontSize === 'sm' ? 'text-sm' :
                        flashFontSize === 'lg' ? 'text-lg' :
                          flashFontSize === 'xl' ? 'text-xl' : 'text-base'
                        }`}>{flashMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSaveFlashMessage}
                disabled={savingFlash || !flashMessage}
                className="w-full"
              >
                <Plus className="w-4 h-4 ml-2" />
                {savingFlash ? 'ط¬ط§ط±ظچ ط§ظ„ط¥ط¶ط§ظپط©...' : 'ط¥ط¶ط§ظپط© ط±ط³ط§ظ„ط© ط§ظ„ظپظ„ط§ط´'}
              </Button>
            </div>
          </TabsContent>

          {/* Notifications Tab - ط¥ط±ط³ط§ظ„ ط¥ط´ط¹ط§ط±ط§طھ */}
          <TabsContent value="notifications" className="space-y-4">
            {/* طھط¹ظٹظٹظ† ظ‡ط°ط§ ط§ظ„ط¬ظ‡ط§ط² ظƒظ…ط³ط¤ظˆظ„ */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                طھط¹ظٹظٹظ† ط¬ظ‡ط§ط² ظƒظ…ط³ط¤ظˆظ„
              </h4>
              <p className="text-sm text-muted-foreground">
                ط£ط¯ط®ظ„ ط±ظ…ط² ط§ظ„ط¬ظ‡ط§ط² (Push Token) ظ„طھط¹ظٹظٹظ†ظ‡ ظƒط¬ظ‡ط§ط² ظ…ط³ط¤ظˆظ„ ظ„ط§ط³طھظ‚ط¨ط§ظ„ ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ
              </p>
              <div className="flex gap-2">
                <Input
                  value={adminDeviceToken}
                  onChange={(e) => setAdminDeviceToken(e.target.value)}
                  placeholder="ط±ظ…ط² ط§ظ„ط¬ظ‡ط§ط² (Push Token)"
                  className="flex-1"
                  dir="ltr"
                />
                <Button
                  onClick={handleSetAdminDevice}
                  disabled={settingAdminDevice || !adminDeviceToken.trim()}
                  variant="outline"
                >
                  <Shield className="w-4 h-4 ml-2" />
                  {settingAdminDevice ? 'ط¬ط§ط±ظچ ط§ظ„طھط¹ظٹظٹظ†...' : 'طھط¹ظٹظٹظ† ظƒظ…ط³ط¤ظˆظ„'}
                </Button>
              </div>
            </div>

            {/* ظ‚ط§ط¦ظ…ط© ط§ظ„ط£ط¬ظ‡ط²ط© ط§ظ„ظ…ط³ط¬ظ„ط© */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  ط§ظ„ط£ط¬ظ‡ط²ط© ط§ظ„ظ…ط³ط¬ظ„ط© ظ„ظ„ط¥ط´ط¹ط§ط±ط§طھ
                </h4>
                <Button variant="ghost" size="sm" onClick={loadPushTokens}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              {pushTokensList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">ظ„ط§ طھظˆط¬ط¯ ط£ط¬ظ‡ط²ط© ظ…ط³ط¬ظ„ط©</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {pushTokensList.map((device) => (
                    <div key={device.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-mono truncate max-w-[200px]" dir="ltr">
                          {device.token.slice(0, 20)}...
                        </span>
                        <span className="text-xs text-muted-foreground">({device.device_type})</span>
                      </div>
                      {device.is_admin && (
                        <Badge variant="default" className="text-xs">
                          <Shield className="w-3 h-3 ml-1" />
                          ظ…ط³ط¤ظˆظ„
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ط¥ط±ط³ط§ظ„ ط¥ط´ط¹ط§ط± */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                ط¥ط±ط³ط§ظ„ ط¥ط´ط¹ط§ط± ظ„ظ„ظ…ط³ط¤ظˆظ„ظٹظ†
              </h4>
              <Input
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="ط¹ظ†ظˆط§ظ† ط§ظ„ط¥ط´ط¹ط§ط±"
              />
              <Textarea
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                placeholder="ظ†طµ ط§ظ„ط¥ط´ط¹ط§ط±..."
                className="min-h-[100px]"
              />
              <Button
                onClick={handleSendPushNotification}
                disabled={sendingNotification || !notifTitle.trim() || !notifBody.trim()}
                className="w-full"
              >
                <Send className="w-4 h-4 ml-2" />
                {sendingNotification ? 'ط¬ط§ط±ظچ ط§ظ„ط¥ط±ط³ط§ظ„...' : 'ط¥ط±ط³ط§ظ„ ظ„ظ„ظ…ط³ط¤ظˆظ„ظٹظ†'}
              </Button>
            </div>

            {/* ط³ط¬ظ„ ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ */}
            {notificationHistory.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ ط§ظ„ط³ط§ط¨ظ‚ط© ({notificationHistory.length})</h4>
                {notificationHistory.map((notif) => (
                  <div key={notif.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium">{notif.title}</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notif.sent_at).toLocaleString('ar-SA')}
                        </span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                طھط£ظƒظٹط¯ ط§ظ„ط­ط°ظپ
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ط¥ط´ط¹ط§ط± ظ…ظ† ط§ظ„ط³ط¬ظ„طں
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row-reverse gap-2">
                              <AlertDialogCancel>ط¥ظ„ط؛ط§ط،</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteNotification(notif.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                ط­ط°ظپ
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{notif.body}</p>
                    <div className="mt-2 text-xs text-primary">
                      ط£ظڈط±ط³ظ„ ط¥ظ„ظ‰ {notif.recipients_count} ط¬ظ‡ط§ط²
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="settings" className="space-y-4">

            {/* ظپطھط­/ط¥ط؛ظ„ط§ظ‚ ط§ظ„طµظ†ط¯ظˆظ‚ */}
            <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  طµظ†ط¯ظˆظ‚ ط§ظ„ط£ط³ط¦ظ„ط©
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isBoxOpen ? 'ط§ظ„طµظ†ط¯ظˆظ‚ ظ…ظپطھظˆط­ - ظٹظ…ظƒظ† ظ„ظ„ط²ظˆط§ط± ط¥ط±ط³ط§ظ„ ط§ظ„ط£ط³ط¦ظ„ط©' : 'ط§ظ„طµظ†ط¯ظˆظ‚ ظ…ط؛ظ„ظ‚ - ظ„ط§ ظٹظ…ظƒظ† ط¥ط±ط³ط§ظ„ ط§ظ„ط£ط³ط¦ظ„ط©'}
                </p>
              </div>
              <Switch
                checked={isBoxOpen}
                onCheckedChange={handleToggleBox}
                disabled={isLoading}
              />
            </div>

            <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  ط§ظ„ط¹ط¯ط§ط¯ ط§ظ„طھظ†ط§ط²ظ„ظٹ
                </h3>
                <p className="text-sm text-muted-foreground">
                  {showCountdown ? 'ظٹط¸ظ‡ط± ط§ظ„ط¹ط¯ط§ط¯ ط§ظ„طھظ†ط§ط²ظ„ظٹ ظ„ظ„ط­ظ„ظ‚ط© ط§ظ„ظ‚ط§ط¯ظ…ط©' : 'ط§ظ„ط¹ط¯ط§ط¯ ط§ظ„طھظ†ط§ط²ظ„ظٹ ظ…ط®ظپظٹ'}
                </p>
              </div>
              <Switch
                checked={showCountdown}
                onCheckedChange={handleToggleCountdown}
                disabled={isLoading}
              />
            </div>

            {/* ط§ط®طھظٹط§ط± ظ†ظ…ط· ط§ظ„ط¹ط¯ط§ط¯ ط§ظ„طھظ†ط§ط²ظ„ظٹ */}
            {showCountdown && (
              <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="font-medium flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    ظ†ظ…ط· ط§ظ„ط¹ط¯ط§ط¯ ط§ظ„طھظ†ط§ط²ظ„ظٹ
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    ط§ط®طھط± ط§ظ„ظ†ظ…ط· ط§ظ„ظ…ظ†ط§ط³ط¨ ظˆط´ط§ظ‡ط¯ ط§ظ„ظ…ط¹ط§ظٹظ†ط© ظ‚ط¨ظ„ ط§ظ„ط­ظپط¸
                  </p>
                </div>

                <RadioGroup
                  value={String(countdownStyle)}
                  onValueChange={(val) => setCountdownStyle(Number(val))}
                  className="grid grid-cols-2 md:grid-cols-5 gap-3"
                >
                  <div>
                    <RadioGroupItem value="1" id="style-1" className="peer sr-only" />
                    <Label
                      htmlFor="style-1"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <Monitor className="w-6 h-6 mb-1" />
                      <span className="text-sm font-medium">LED ط±ظ‚ظ…ظٹ</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="2" id="style-2" className="peer sr-only" />
                    <Label
                      htmlFor="style-2"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <Clock className="w-6 h-6 mb-1" />
                      <span className="text-sm font-medium">ظƒظ„ط§ط³ظٹظƒظٹ</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="3" id="style-3" className="peer sr-only" />
                    <Label
                      htmlFor="style-3"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <Timer className="w-6 h-6 mb-1" />
                      <span className="text-sm font-medium">ط¨ط³ظٹط·</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="4" id="style-4" className="peer sr-only" />
                    <Label
                      htmlFor="style-4"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <RefreshCw className="w-6 h-6 mb-1" />
                      <span className="text-sm font-medium">ط¯ط§ط¦ط±ظٹ</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="5" id="style-5" className="peer sr-only" />
                    <Label
                      htmlFor="style-5"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <Sparkles className="w-6 h-6 mb-1" />
                      <span className="text-sm font-medium">ط²ط¬ط§ط¬ظٹ 3D</span>
                    </Label>
                  </div>
                </RadioGroup>

                {/* طھط®طµظٹطµ ط§ظ„ط£ظ„ظˆط§ظ† */}
                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                    ًںژ¨ طھط®طµظٹطµ ط§ظ„ط£ظ„ظˆط§ظ†
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm mb-2">ظ„ظˆظ† ط§ظ„ط®ظ„ظپظٹط©</label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={countdownBgColor}
                          onChange={(e) => setCountdownBgColor(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={countdownBgColor}
                          onChange={(e) => setCountdownBgColor(e.target.value)}
                          className="flex-1"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm mb-2">ظ„ظˆظ† ط§ظ„ظ†طµ</label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={countdownTextColor}
                          onChange={(e) => setCountdownTextColor(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={countdownTextColor}
                          onChange={(e) => setCountdownTextColor(e.target.value)}
                          className="flex-1"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm mb-2">ظ„ظˆظ† ط§ظ„ط¥ط·ط§ط±</label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={countdownBorderColor}
                          onChange={(e) => setCountdownBorderColor(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={countdownBorderColor}
                          onChange={(e) => setCountdownBorderColor(e.target.value)}
                          className="flex-1"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleSaveCountdownColors}
                    disabled={savingCountdownColors}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    {savingCountdownColors ? 'ط¬ط§ط±ظچ ط§ظ„ط­ظپط¸...' : 'ط­ظپط¸ ط§ظ„ط£ظ„ظˆط§ظ†'}
                  </Button>
                </div>

                {/* ظ…ط¹ط§ظٹظ†ط© ط§ظ„ظ†ظ…ط· */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">ظ…ط¹ط§ظٹظ†ط©:</h4>
                  <div className="max-w-xl mx-auto">
                    <CountdownTimerPreview
                      style={countdownStyle}
                      bgColor={countdownBgColor}
                      textColor={countdownTextColor}
                      borderColor={countdownBorderColor}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSaveCountdownStyle(countdownStyle)}
                  disabled={savingCountdownStyle || countdownStyle === (settings?.countdown_style ?? 1)}
                  className="w-full"
                >
                  {savingCountdownStyle ? 'ط¬ط§ط±ظچ ط§ظ„ط­ظپط¸...' : 'ط­ظپط¸ ظ†ظ…ط· ط§ظ„ط¹ط¯ط§ط¯'}
                </Button>
              </div>
            )}

            <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  ط¹ط¯ط§ط¯ ط§ظ„ط£ط³ط¦ظ„ط©
                </h3>
                <p className="text-sm text-muted-foreground">
                  {showQuestionCount ? 'ظٹط¸ظ‡ط± ط¹ط¯ط¯ ط§ظ„ط£ط³ط¦ظ„ط© ط§ظ„ظ…ط³طھظ„ظ…ط© ظ„ظ„ط²ظˆط§ط±' : 'ط¹ط¯ط§ط¯ ط§ظ„ط£ط³ط¦ظ„ط© ظ…ط®ظپظٹ ط¹ظ† ط§ظ„ط²ظˆط§ط±'}
                </p>
              </div>
              <Switch
                checked={showQuestionCount}
                onCheckedChange={handleToggleQuestionCount}
                disabled={isLoading}
              />
            </div>

            <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  طµظپط­ط© ط§ظ„طھط«ط¨ظٹطھ
                </h3>
                <p className="text-sm text-muted-foreground">
                  {showInstallPage ? 'طµظپط­ط© ط§ظ„طھط«ط¨ظٹطھ ظ…طھط§ط­ط© ظ„ظ„ط²ظˆط§ط± (/install)' : 'طµظپط­ط© ط§ظ„طھط«ط¨ظٹطھ ظ…ط¹ط·ظ‘ظ„ط©'}
                </p>
              </div>
              <Switch
                checked={showInstallPage}
                onCheckedChange={handleToggleInstallPage}
                disabled={isLoading}
              />
            </div>

            <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  ظپظ„طھط± ط§ظ„ظ…ط­طھظˆظ‰
                </h3>
                <p className="text-sm text-muted-foreground">
                  {contentFilterEnabled ? 'ظٹظ…ظ†ط¹ ط§ظ„ط£ط³ط¦ظ„ط© ط؛ظٹط± ط§ظ„ظ„ط§ط¦ظ‚ط©' : 'ظپظ„طھط± ط§ظ„ظ…ط­طھظˆظ‰ ظ…ط¹ط·ظ‘ظ„'}
                </p>
              </div>
              <Switch
                checked={contentFilterEnabled}
                onCheckedChange={handleToggleContentFilter}
                disabled={isLoading}
              />
            </div>

            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-medium">ظ…ظˆط¹ط¯ ط§ظ„ط­ظ„ظ‚ط© ط§ظ„ظ‚ط§ط¯ظ…ط©</h3>
              </div>
              <Input
                type="datetime-local"
                value={nextSessionDate}
                onChange={(e) => setNextSessionDate(e.target.value)}
              />
              <Button onClick={handleUpdateSession} disabled={isLoading || !nextSessionDate}>
                {isLoading ? 'ط¬ط§ط±ظچ ط§ظ„ط­ظپط¸...' : 'ط­ظپط¸ ط§ظ„ظ…ظˆط¹ط¯'}
              </Button>
            </div>

          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Helper function to get contrast color
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export default AdminPage;




