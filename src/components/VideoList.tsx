import { useVideos } from '@/hooks/useVideos';
import { VideoPlayer } from './VideoPlayer';

export function VideoList() {
  const { data: videos, isLoading } = useVideos();

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        جارٍ تحميل الفيديوهات...
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {videos.map((video) => (
        <VideoPlayer key={video.id} url={video.url} title={video.title} />
      ))}
    </div>
  );
}
