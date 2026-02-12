import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      // إخفاء بعد 3 ثواني
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // إظهار عند التحميل إذا كان غير متصل
    if (!navigator.onLine) {
      setShowStatus(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`fixed top-0 left-0 right-0 z-[100] py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 ${
            isOnline 
              ? 'bg-green-500 text-white' 
              : 'bg-destructive text-destructive-foreground'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>تم استعادة الاتصال</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 animate-pulse" />
              <span>لا يوجد اتصال بالإنترنت</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
