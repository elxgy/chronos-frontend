import React, { useState } from 'react';
import {
  ListMusic,
  Plus,
  GripVertical,
  Trash2,
  Clock,
  PlayCircle,
} from 'lucide-react';
import { cn, formatDuration } from '@/utils/helpers';
import { Button, Input, Card } from '@/components/common';
import { Video } from '@/types';

interface QueueProps {
  videos: Video[];
  currentVideoId?: string;
  isHost: boolean;
  onAddVideo: (videoId: string) => void;
  onRemoveVideo: (videoId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onVideoClick?: (video: Video) => void;
}

export const Queue: React.FC<QueueProps> = ({
  videos,
  currentVideoId,
  isHost,
  onAddVideo,
  onRemoveVideo,
  onReorder,
  onVideoClick,
}) => {
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleAddVideo = async () => {
    if (!newVideoUrl.trim()) return;

    setError('');
    const videoId = extractVideoId(newVideoUrl);

    if (!videoId) {
      setError('Invalid YouTube URL or video ID');
      return;
    }

    setIsAdding(true);
    try {
      await onAddVideo(videoId);
      setNewVideoUrl('');
    } catch (err) {
      setError('Failed to add video');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('dragIndex', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'));
    if (dragIndex !== index) {
      onReorder(dragIndex, index);
    }
  };

  return (
    <Card className="h-full flex flex-col" padding="none">
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center gap-2 mb-4">
          <ListMusic className="w-5 h-5 text-primary-400" />
          <h3 className="font-semibold text-dark-100">Queue</h3>
          <span className="ml-auto badge-primary">{videos.length}</span>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Paste YouTube URL or ID"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            error={error}
            className="text-sm"
          />
          <Button
            variant="primary"
            onClick={handleAddVideo}
            loading={isAdding}
            disabled={!newVideoUrl.trim() || isAdding}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {videos.length === 0 ? (
          <div className="p-8 text-center">
            <ListMusic className="w-12 h-12 mx-auto mb-3 text-dark-500" />
            <p className="text-dark-400">Queue is empty</p>
            <p className="text-dark-500 text-sm mt-1">
              Add videos to watch together
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-dark-700">
            {videos.map((video, index) => (
              <li
                key={`${video.id}-${index}`}
                className={cn(
                  'p-3 hover:bg-dark-700/50 transition-colors group',
                  currentVideoId === video.id && 'bg-primary-500/10'
                )}
                draggable={isHost}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onClick={() => onVideoClick?.(video)}
              >
                <div className="flex items-center gap-3">
                  {isHost && (
                    <div className="cursor-grab active:cursor-grabbing text-dark-500 group-hover:text-dark-400">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}

                  <div className="relative w-20 h-12 bg-dark-700 rounded overflow-hidden flex-shrink-0">
                    {video.thumbnail && (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {currentVideoId === video.id && (
                      <div className="absolute inset-0 bg-primary-500/30 flex items-center justify-center">
                        <PlayCircle className="w-6 h-6 text-primary-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-200 truncate text-sm">
                      {video.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-dark-400">
                      <span>{video.addedByName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(video.duration)}
                      </span>
                    </div>
                  </div>

                  {isHost && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveVideo(video.id);
                      }}
                      className="p-2 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};
