import React, { useState } from "react";
import {
  ListMusic,
  Plus,
  GripVertical,
  Trash2,
  Clock,
  PlayCircle,
  Repeat,
  Shuffle,
} from "lucide-react";
import { cn, formatDuration, parseYouTubeInput } from "@/utils/helpers";
import { Button, Input, Card, ConfirmModal } from "@/components/common";
import { Video } from "@/types";

interface QueueProps {
  videos: Video[];
  currentVideoId?: string;
  isHost: boolean;
  autoplay?: boolean;
  onSetAutoplay?: (enabled: boolean) => void;
  onShuffle?: () => void;
  onClearQueue?: () => void;
  onAddVideo: (videoId: string) => void;
  onAddPlaylist?: (playlistId: string) => void;
  onRemoveVideo: (videoId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onVideoClick?: (video: Video) => void;
}

export const Queue: React.FC<QueueProps> = ({
  videos,
  currentVideoId,
  isHost,
  autoplay = false,
  onSetAutoplay,
  onShuffle,
  onClearQueue,
  onAddVideo,
  onAddPlaylist,
  onRemoveVideo,
  onReorder,
  onVideoClick,
}) => {
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [justShuffled, setJustShuffled] = useState(false);

  const handleAdd = async () => {
    if (!newVideoUrl.trim()) return;

    setError("");
    const parsed = parseYouTubeInput(newVideoUrl);

    if (parsed.playlistId) {
      if (!onAddPlaylist) return;
      setIsAdding(true);
      try {
        onAddPlaylist(parsed.playlistId);
        setNewVideoUrl("");
      } catch (err) {
        setError("Failed to add playlist");
      } finally {
        setIsAdding(false);
      }
      return;
    }

    if (parsed.videoId) {
      setIsAdding(true);
      try {
        await onAddVideo(parsed.videoId);
        setNewVideoUrl("");
      } catch (err) {
        setError("Failed to add video");
      } finally {
        setIsAdding(false);
      }
      return;
    }

    setError("Invalid YouTube URL, video ID, or playlist link");
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("dragIndex", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"), 10);
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

        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 min-w-0">
          <div className="flex items-center gap-2">
            {isHost && onSetAutoplay && (
              <button
                onClick={() => onSetAutoplay(!autoplay)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation flex-shrink-0",
                  autoplay
                    ? "bg-primary-600/20 text-primary-400 border border-primary-500/40 hover:bg-primary-600/30"
                    : "bg-dark-800 text-dark-400 border border-dark-600 hover:bg-dark-700 hover:text-dark-300",
                )}
                title={autoplay ? "Autoplay on" : "Autoplay off"}
                aria-label={autoplay ? "Autoplay on" : "Autoplay off"}
              >
                <Repeat className="w-3.5 h-3.5" />
                Autoplay
              </button>
            )}
            {isHost && onShuffle && videos.length > 1 && (
              <button
                onClick={() => {
                  setJustShuffled(true);
                  onShuffle();
                  setTimeout(() => setJustShuffled(false), 400);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation flex-shrink-0 bg-dark-800 text-dark-400 border border-dark-600 hover:bg-dark-700 hover:text-dark-300",
                  justShuffled && "ring-2 ring-primary-400 shadow-lg shadow-primary-500/50",
                )}
                title="Shuffle queue"
                aria-label="Shuffle queue"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Shuffle
              </button>
            )}
          </div>
          {isHost && onClearQueue && videos.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation flex-shrink-0 bg-dark-800 text-dark-400 border border-dark-600 hover:bg-dark-700 hover:text-red-400 hover:border-red-500/40"
              title="Clear queue"
              aria-label="Clear queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        <ConfirmModal
          isOpen={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          onConfirm={() => {
            onClearQueue?.();
            setShowClearConfirm(false);
          }}
          title="Clear queue?"
          message="All queued videos will be removed. The current video will keep playing."
          confirmText="Clear"
          cancelText="Cancel"
          variant="danger"
        />

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Paste YouTube URL, video ID, or playlist link"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            error={error}
            className="text-sm min-h-[44px]"
          />
          <Button
            variant="primary"
            onClick={handleAdd}
            loading={isAdding}
            disabled={!newVideoUrl.trim() || isAdding}
            className="min-h-[44px] touch-manipulation sm:shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {videos.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-dark-700/80 flex items-center justify-center">
              <ListMusic className="w-7 h-7 text-dark-500" />
            </div>
            <p className="text-dark-300 font-medium">Queue is empty</p>
            <p className="text-dark-500 text-sm mt-1">
              Add your first video above to watch together
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-dark-700">
            {videos.map((video, index) => (
              <li
                key={`${video.id}-${index}`}
                className={cn(
                  "p-3 hover:bg-dark-700/50 transition-colors group",
                  currentVideoId === video.id && "bg-primary-500/10",
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
