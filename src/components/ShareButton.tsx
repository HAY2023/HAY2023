import { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Send, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const ShareButton = () => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const appUrl = window.location.origin;
  const shareText = 'صندوق الفتوى مسجد الإيمان - أرسل سؤالك الشرعي واحصل على إجابة من العلماء';
  const shareTitle = 'صندوق الفتوى مسجد الإيمان';

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: appUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast.success('تم نسخ الرابط');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('فشل نسخ الرابط');
    }
  };

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${appUrl}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`,
  };

  // If native share is supported, use it directly
  if (navigator.share) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className="gap-2 border-primary/30 hover:bg-primary/10"
      >
        <Share2 className="h-4 w-4" />
        <span>شارك التطبيق</span>
      </Button>
    );
  }

  // Fallback to dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-primary/30 hover:bg-primary/10"
        >
          <Share2 className="h-4 w-4" />
          <span>شارك التطبيق</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-48">
        <DropdownMenuItem
          onClick={() => window.open(shareLinks.whatsapp, '_blank')}
          className="gap-2 cursor-pointer"
        >
          <MessageCircle className="h-4 w-4 text-green-500" />
          <span>واتساب</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(shareLinks.telegram, '_blank')}
          className="gap-2 cursor-pointer"
        >
          <Send className="h-4 w-4 text-blue-500" />
          <span>تلجرام</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(shareLinks.twitter, '_blank')}
          className="gap-2 cursor-pointer"
        >
          <Twitter className="h-4 w-4 text-sky-500" />
          <span>تويتر</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleCopyLink}
          className="gap-2 cursor-pointer"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;
