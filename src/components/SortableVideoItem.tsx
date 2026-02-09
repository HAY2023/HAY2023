import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GripVertical, Trash2, Pencil, Check, X, Video } from 'lucide-react';
import { Video as VideoType } from '@/hooks/useVideos';

interface SortableVideoItemProps {
  video: VideoType;
  onDelete: (videoId: string) => void;
  onEdit: (videoId: string, title: string, url: string) => void;
}

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

export function SortableVideoItem({ video, onDelete, onEdit }: SortableVideoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(video.title);
  const [editUrl, setEditUrl] = useState(video.url);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editTitle.trim() && editUrl.trim()) {
      onEdit(video.id, editTitle.trim(), editUrl.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(video.title);
    setEditUrl(video.url);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-card border-2 border-primary rounded-lg p-4 space-y-4"
      >
        <div className="space-y-3">
          <Input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="عنوان الفيديو"
          />
          <Input
            type="url"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="رابط الفيديو"
            dir="ltr"
          />
          
          {/* معاينة الفيديو */}
          {editUrl && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 text-sm font-medium flex items-center gap-2">
                <Video className="w-4 h-4" />
                معاينة
              </div>
              <div className="aspect-video">
                {editUrl.includes('youtube.com') || editUrl.includes('youtu.be') ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(editUrl)}`}
                    title="معاينة"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : editUrl.includes('drive.google.com') || editUrl.includes('docs.google.com/file') ? (
                  <iframe
                    src={`https://drive.google.com/file/d/${getGoogleDriveFileId(editUrl)}/preview`}
                    title="معاينة"
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={editUrl}
                    controls
                    className="w-full h-full"
                    preload="metadata"
                  >
                    متصفحك لا يدعم تشغيل الفيديو
                  </video>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" className="flex-1">
            <Check className="w-4 h-4 ml-1" />
            حفظ
          </Button>
          <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
            <X className="w-4 h-4 ml-1" />
            إلغاء
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border border-border rounded-lg p-4"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical className="w-5 h-5" />
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{video.title}</h4>
          <a 
            href={video.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-primary hover:underline truncate block"
          >
            {video.url}
          </a>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => onDelete(video.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
