import { useState, useEffect } from 'react';
import { Settings2, Type, Sun, Moon, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

interface ReadingSettings {
  fontSize: FontSize;
  highContrast: boolean;
}

const fontSizeMap: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
  xlarge: '20px',
};

const fontSizeLabels: Record<FontSize, string> = {
  small: 'صغير',
  medium: 'متوسط',
  large: 'كبير',
  xlarge: 'كبير جداً',
};

const ReadingMode = () => {
  const [settings, setSettings] = useState<ReadingSettings>(() => {
    const saved = localStorage.getItem('readingSettings');
    return saved ? JSON.parse(saved) : { fontSize: 'medium', highContrast: false };
  });

  const [fontSizeIndex, setFontSizeIndex] = useState(() => {
    const sizes: FontSize[] = ['small', 'medium', 'large', 'xlarge'];
    return sizes.indexOf(settings.fontSize);
  });

  useEffect(() => {
    // Apply font size to root
    document.documentElement.style.setProperty('--reading-font-size', fontSizeMap[settings.fontSize]);
    
    // Apply high contrast
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Save to localStorage
    localStorage.setItem('readingSettings', JSON.stringify(settings));
  }, [settings]);

  const handleFontSizeChange = (value: number[]) => {
    const sizes: FontSize[] = ['small', 'medium', 'large', 'xlarge'];
    const newIndex = value[0];
    setFontSizeIndex(newIndex);
    setSettings(prev => ({ ...prev, fontSize: sizes[newIndex] }));
  };

  const decreaseFontSize = () => {
    if (fontSizeIndex > 0) {
      handleFontSizeChange([fontSizeIndex - 1]);
    }
  };

  const increaseFontSize = () => {
    if (fontSizeIndex < 3) {
      handleFontSizeChange([fontSizeIndex + 1]);
    }
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          title="إعدادات القراءة"
        >
          <Type className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <h4 className="font-medium text-center mb-4">إعدادات القراءة</h4>
          
          {/* Font Size Control */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">حجم الخط</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={decreaseFontSize}
                disabled={fontSizeIndex === 0}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="flex-1">
                <Slider
                  value={[fontSizeIndex]}
                  onValueChange={handleFontSizeChange}
                  max={3}
                  step={1}
                  className="w-full"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={increaseFontSize}
                disabled={fontSizeIndex === 3}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {fontSizeLabels[settings.fontSize]}
            </p>
          </div>

          {/* High Contrast Toggle */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              {settings.highContrast ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <Label htmlFor="high-contrast" className="text-sm">
                تباين عالي
              </Label>
            </div>
            <Switch
              id="high-contrast"
              checked={settings.highContrast}
              onCheckedChange={toggleHighContrast}
            />
          </div>

          {/* Preview */}
          <div 
            className="p-3 rounded-lg bg-muted/50 border mt-3"
            style={{ fontSize: fontSizeMap[settings.fontSize] }}
          >
            <p className="text-center leading-relaxed">
              معاينة حجم الخط
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReadingMode;
