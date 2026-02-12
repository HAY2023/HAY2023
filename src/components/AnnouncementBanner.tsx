import { useAnnouncements } from '@/hooks/useAnnouncements';

export function AnnouncementBanner() {
  const { data: announcements, isLoading } = useAnnouncements();

  if (isLoading || !announcements || announcements.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className="text-center py-6 px-4"
        >
          <p className="text-xl md:text-2xl lg:text-3xl font-serif text-foreground leading-relaxed">
            {announcement.message}
          </p>
        </div>
      ))}
    </div>
  );
}
