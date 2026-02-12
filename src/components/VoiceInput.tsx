import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

// دالة للحصول على لغة التعرف حسب لغة التطبيق
const getRecognitionLang = (appLang: string): string => {
  const langMap: Record<string, string> = {
    ar: 'ar-SA',
    fr: 'fr-FR',
    en: 'en-US',
  };
  return langMap[appLang] || 'ar-SA';
};

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimText, setInterimText] = useState('');
  const [volume, setVolume] = useState(0);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  // تشغيل صوت
  const playSound = useCallback((type: 'start' | 'stop') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = type === 'start' ? 880 : 440;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // تجاهل الأخطاء الصوتية
    }
  }, []);

  // تحليل مستوى الصوت
  const startVolumeAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateVolume = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolume(Math.min(avg / 128, 1));
        }
        animationRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (e) {
      console.error('Volume analysis error:', e);
    }
  }, []);

  const stopVolumeAnalysis = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setVolume(0);
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getRecognitionLang(i18n.language);
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      
      setInterimText(interim);
      
      if (final) {
        onTranscript(final);
        setInterimText('');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      stopVolumeAnalysis();
      
      const errorMessages: Record<string, { ar: string; fr: string; en: string }> = {
        'not-allowed': {
          ar: 'يرجى السماح باستخدام الميكروفون',
          fr: 'Veuillez autoriser le microphone',
          en: 'Please allow microphone access',
        },
        'no-speech': {
          ar: 'لم يتم اكتشاف صوت، تحدث بوضوح',
          fr: 'Aucun son détecté, parlez clairement',
          en: 'No speech detected, speak clearly',
        },
        'network': {
          ar: 'خطأ في الشبكة، تحقق من الاتصال',
          fr: 'Erreur réseau, vérifiez la connexion',
          en: 'Network error, check connection',
        },
      };
      
      const msg = errorMessages[event.error];
      if (msg) {
        toast({
          title: t('common.error'),
          description: msg[i18n.language as 'ar' | 'fr' | 'en'] || msg.ar,
          variant: 'destructive',
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      stopVolumeAnalysis();
      setInterimText('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopVolumeAnalysis();
    };
  }, [i18n.language, onTranscript, stopVolumeAnalysis, t, toast]);

  // تحديث لغة التعرف عند تغيير لغة التطبيق
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = getRecognitionLang(i18n.language);
    }
  }, [i18n.language]);

  const toggleListening = async () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      playSound('stop');
      setIsListening(false);
      stopVolumeAnalysis();
    } else {
      try {
        recognitionRef.current.start();
        playSound('start');
        setIsListening(true);
        startVolumeAnalysis();
        
        const messages = {
          ar: 'تحدث الآن...',
          fr: 'Parlez maintenant...',
          en: 'Speak now...',
        };
        
        toast({
          title: '🎤',
          description: messages[i18n.language as 'ar' | 'fr' | 'en'] || messages.ar,
        });
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant={isListening ? "destructive" : "outline"}
        size="icon"
        onClick={toggleListening}
        disabled={disabled}
        className={`
          relative transition-all duration-300 overflow-hidden
          ${isListening ? 'ring-2 ring-destructive ring-offset-2' : ''}
        `}
        title={isListening ? 
          (i18n.language === 'fr' ? 'Arrêter' : i18n.language === 'en' ? 'Stop' : 'إيقاف') :
          (i18n.language === 'fr' ? 'Enregistrer' : i18n.language === 'en' ? 'Record' : 'تسجيل صوتي')
        }
      >
        {/* مؤشر مستوى الصوت */}
        {isListening && (
          <div 
            className="absolute inset-0 bg-destructive/30 transition-transform origin-bottom"
            style={{ transform: `scaleY(${volume})` }}
          />
        )}
        
        {isListening ? (
          <>
            <MicOff className="h-4 w-4 relative z-10 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping" />
          </>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {/* عرض النص أثناء الإملاء */}
      {isListening && interimText && (
        <div className="absolute top-full mt-2 left-0 right-0 min-w-[200px] p-2 bg-muted rounded-md text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2 z-50">
          <span className="opacity-70">{interimText}</span>
          <span className="animate-pulse">|</span>
        </div>
      )}
    </div>
  );
}
