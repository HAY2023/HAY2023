import { supabase } from '@/integrations/supabase/client';

interface DeviceInfo {
  deviceType: string;
  browser: string;
  os: string;
  screenSize: string;
  userAgent: string;
  timezone: string;
  language: string;
  hardwareConcurrency: number;
  deviceMemory: number | null;
  networkType: string;
  referrer: string;
  connectionType: string;
  touchSupport: boolean;
  colorDepth: number;
  pixelRatio: number;
}

interface IpInfo {
  ip: string;
  country: string;
  city: string;
  isp: string;
  latitude: number | null;
  longitude: number | null;
  asn: string;
  org: string;
  region: string;
  postal: string;
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  threat: string;
}

function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  
  // نوع الجهاز
  let deviceType = 'desktop';
  if (/Mobi|Android/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/Tablet|iPad/i.test(ua)) {
    deviceType = 'tablet';
  }
  
  // المتصفح
  let browser = 'unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  
  // نظام التشغيل
  let os = 'unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  // حجم الشاشة
  const screenSize = `${window.screen.width}x${window.screen.height}`;
  
  // نوع الاتصال
  const connection = (navigator as any).connection;
  const networkType = connection?.effectiveType || 'unknown';
  const connectionType = connection?.type || 'unknown';
  
  // دعم اللمس
  const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return {
    deviceType,
    browser,
    os,
    screenSize,
    userAgent: ua,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || null,
    networkType,
    referrer: document.referrer || 'direct',
    connectionType,
    touchSupport,
    colorDepth: window.screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1,
  };
}

// إنشاء بصمة بسيطة للمتصفح
function generateFingerprint(): string {
  const deviceInfo = getDeviceInfo();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let canvasFingerprint = '';
  
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint', 2, 2);
    canvasFingerprint = canvas.toDataURL().slice(-50);
  }
  
  const fingerPrintData = [
    deviceInfo.userAgent,
    deviceInfo.timezone,
    deviceInfo.language,
    deviceInfo.screenSize,
    deviceInfo.colorDepth.toString(),
    deviceInfo.pixelRatio.toString(),
    deviceInfo.hardwareConcurrency.toString(),
    canvasFingerprint,
    new Date().getTimezoneOffset().toString(),
  ].join('|');
  
  // تشفير بسيط للبصمة
  let hash = 0;
  for (let i = 0; i < fingerPrintData.length; i++) {
    const char = fingerPrintData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16);
}

// جلب معلومات IP من عدة مصادر
async function fetchIpInfo(): Promise<IpInfo> {
  const defaultInfo: IpInfo = {
    ip: 'unknown',
    country: 'unknown',
    city: 'unknown',
    isp: 'unknown',
    latitude: null,
    longitude: null,
    asn: 'unknown',
    org: 'unknown',
    region: 'unknown',
    postal: 'unknown',
    isVpn: false,
    isProxy: false,
    isTor: false,
    isDatacenter: false,
    threat: 'none',
  };

  // محاولة 1: ipapi.co (مجاني)
  try {
    const res = await fetch('https://ipapi.co/json/', { 
      signal: AbortSignal.timeout(4000) 
    });
    if (res.ok) {
      const data = await res.json();
      return {
        ip: data.ip || 'unknown',
        country: data.country_name || 'unknown',
        city: data.city || 'unknown',
        isp: data.org || 'unknown',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        asn: data.asn || 'unknown',
        org: data.org || 'unknown',
        region: data.region || 'unknown',
        postal: data.postal || 'unknown',
        isVpn: false,
        isProxy: false,
        isTor: false,
        isDatacenter: data.org?.toLowerCase().includes('hosting') || 
                      data.org?.toLowerCase().includes('datacenter') ||
                      data.org?.toLowerCase().includes('cloud') ||
                      data.org?.toLowerCase().includes('server') ||
                      data.org?.toLowerCase().includes('vps') ||
                      data.org?.toLowerCase().includes('leaseweb') ||
                      data.org?.toLowerCase().includes('digital ocean') ||
                      data.org?.toLowerCase().includes('amazon') ||
                      data.org?.toLowerCase().includes('google') ||
                      data.org?.toLowerCase().includes('microsoft') ||
                      false,
        threat: 'none',
      };
    }
  } catch (e) {
    console.log('ipapi.co failed, trying backup');
  }

  // محاولة 2: ip-api.com (مجاني)
  try {
    const res = await fetch('http://ip-api.com/json/?fields=status,message,country,city,zip,lat,lon,isp,org,as,proxy,hosting,query', { 
      signal: AbortSignal.timeout(4000) 
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          ip: data.query || 'unknown',
          country: data.country || 'unknown',
          city: data.city || 'unknown',
          isp: data.isp || 'unknown',
          latitude: data.lat || null,
          longitude: data.lon || null,
          asn: data.as || 'unknown',
          org: data.org || 'unknown',
          region: 'unknown',
          postal: data.zip || 'unknown',
          isVpn: data.proxy || false,
          isProxy: data.proxy || false,
          isTor: false,
          isDatacenter: data.hosting || false,
          threat: data.proxy ? 'proxy' : (data.hosting ? 'datacenter' : 'none'),
        };
      }
    }
  } catch (e) {
    console.log('ip-api.com failed, trying backup');
  }

  // محاولة 3: ipinfo.io (مجاني محدود)
  try {
    const res = await fetch('https://ipinfo.io/json', { 
      signal: AbortSignal.timeout(4000) 
    });
    if (res.ok) {
      const data = await res.json();
      const [lat, lon] = (data.loc || ',').split(',').map(Number);
      return {
        ip: data.ip || 'unknown',
        country: data.country || 'unknown',
        city: data.city || 'unknown',
        isp: data.org || 'unknown',
        latitude: lat || null,
        longitude: lon || null,
        asn: 'unknown',
        org: data.org || 'unknown',
        region: data.region || 'unknown',
        postal: data.postal || 'unknown',
        isVpn: false,
        isProxy: false,
        isTor: false,
        isDatacenter: data.org?.toLowerCase().includes('hosting') || 
                      data.org?.toLowerCase().includes('datacenter') ||
                      data.org?.toLowerCase().includes('cloud') || false,
        threat: 'none',
      };
    }
  } catch (e) {
    console.log('ipinfo.io failed');
  }

  return defaultInfo;
}

// كشف مؤشرات VPN/Proxy
function detectVpnIndicators(ipInfo: IpInfo, deviceInfo: DeviceInfo): string[] {
  const indicators: string[] = [];
  
  // المنطقة الزمنية لا تتطابق مع الموقع
  const browserTz = deviceInfo.timezone.toLowerCase();
  const country = ipInfo.country.toLowerCase();
  
  // بعض عدم التطابقات الواضحة
  if (country.includes('united kingdom') && !browserTz.includes('london') && !browserTz.includes('europe')) {
    indicators.push('timezone_mismatch');
  }
  if (country.includes('united states') && !browserTz.includes('america')) {
    indicators.push('timezone_mismatch');
  }
  
  // اللغة لا تتطابق مع البلد
  const lang = deviceInfo.language.toLowerCase();
  if (country.includes('algeria') || country.includes('morocco') || country.includes('tunisia')) {
    if (!lang.includes('ar') && !lang.includes('fr')) {
      indicators.push('language_mismatch');
    }
  }
  
  // مؤشرات Datacenter/VPN
  if (ipInfo.isDatacenter) indicators.push('datacenter_ip');
  if (ipInfo.isProxy) indicators.push('proxy_detected');
  if (ipInfo.isVpn) indicators.push('vpn_detected');
  if (ipInfo.isTor) indicators.push('tor_detected');
  
  // ISP مشبوه
  const isp = ipInfo.isp.toLowerCase();
  const org = ipInfo.org.toLowerCase();
  const vpnProviders = [
    'nordvpn', 'expressvpn', 'surfshark', 'cyberghost', 'private internet access',
    'mullvad', 'protonvpn', 'windscribe', 'tunnelbear', 'hotspot shield',
    'leaseweb', 'choopa', 'vultr', 'linode', 'digitalocean', 'amazon', 'google cloud',
    'microsoft azure', 'ovh', 'hetzner', 'scaleway', 'contabo'
  ];
  
  for (const provider of vpnProviders) {
    if (isp.includes(provider) || org.includes(provider)) {
      indicators.push('suspicious_isp');
      break;
    }
  }
  
  return indicators;
}

export async function logAdminAccess(isAuthorized: boolean, passwordAttempted: boolean = false) {
  try {
    const deviceInfo = getDeviceInfo();
    const fingerprint = generateFingerprint();
    const ipInfo = await fetchIpInfo();
    
    // كشف مؤشرات VPN
    const vpnIndicators = detectVpnIndicators(ipInfo, deviceInfo);
    const threatLevel = vpnIndicators.length > 0 ? vpnIndicators.join(',') : ipInfo.threat;
    
    // تحديد ISP مع معلومات التهديد
    const ispWithThreat = vpnIndicators.length > 0 
      ? `${ipInfo.isp} [⚠️ ${vpnIndicators.join(', ')}]`
      : ipInfo.isp;
    
    // تسجيل الدخول مع جميع المعلومات
    const { error } = await supabase.rpc('log_admin_access', {
      p_ip_address: ipInfo.ip,
      p_country: ipInfo.country,
      p_city: ipInfo.city,
      p_device_type: deviceInfo.deviceType,
      p_browser: deviceInfo.browser,
      p_os: deviceInfo.os,
      p_screen_size: deviceInfo.screenSize,
      p_is_authorized: isAuthorized,
      p_password_attempted: passwordAttempted,
      p_user_agent: deviceInfo.userAgent,
      p_timezone: deviceInfo.timezone,
      p_language: deviceInfo.language,
      p_hardware_concurrency: deviceInfo.hardwareConcurrency,
      p_device_memory: deviceInfo.deviceMemory,
      p_network_type: deviceInfo.networkType,
      p_isp: ispWithThreat,
      p_referrer: deviceInfo.referrer,
      p_fingerprint_id: fingerprint,
      p_latitude: ipInfo.latitude,
      p_longitude: ipInfo.longitude,
      p_asn: ipInfo.asn,
      p_org: ipInfo.org,
      p_region: ipInfo.region,
      p_postal: ipInfo.postal,
      p_connection_type: threatLevel || deviceInfo.connectionType,
      p_touch_support: deviceInfo.touchSupport,
      p_color_depth: deviceInfo.colorDepth,
      p_pixel_ratio: deviceInfo.pixelRatio,
    });
    
    if (error) {
      console.error('Error logging admin access:', error);
    }
  } catch (error) {
    console.error('Error in logAdminAccess:', error);
  }
}