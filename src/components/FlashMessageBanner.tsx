import { useFlashMessages } from '@/hooks/useFlashMessages';
import { Megaphone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function FlashMessageBanner() {
  const { data: flashMessages, isLoading } = useFlashMessages();

  if (isLoading || !flashMessages || flashMessages.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {flashMessages.map((message) => (
        <FlashMessageItem
          key={message.id}
          message={message}
        />
      ))}
    </div>
  );
}

function FlashMessageItem({ 
  message, 
}: { 
  message: { 
    id: string; 
    message: string; 
    text_direction: string; 
  }; 
}) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        const textWidth = textRef.current.scrollWidth;
        const containerWidth = containerRef.current.clientWidth - 80;
        setNeedsMarquee(textWidth > containerWidth);
      }
    };
    
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [message.message]);

  return (
    <div
      dir={message.text_direction}
      className="
        relative overflow-hidden
        flex items-center gap-5 px-0 py-6 
        bg-muted border-y-2 border-border
        w-full
      "
    >
      <div className="px-6 flex-shrink-0">
        <Megaphone className="w-7 h-7 text-primary" />
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden px-4">
        {needsMarquee ? (
          <div className="animate-marquee-smooth whitespace-nowrap">
            <p ref={textRef} className="inline-block font-semibold text-xl md:text-2xl text-foreground">
              {message.message}
            </p>
            <span className="inline-block w-32"></span>
            <p className="inline-block font-semibold text-xl md:text-2xl text-foreground">
              {message.message}
            </p>
          </div>
        ) : (
          <p ref={textRef} className="font-semibold text-xl md:text-2xl text-foreground text-center">
            {message.message}
          </p>
        )}
      </div>
      <div className="px-6 flex-shrink-0 opacity-0">
        <Megaphone className="w-7 h-7" />
      </div>
    </div>
  );
}