import React, { useState, useRef, useCallback } from "react";
import {
  ListMusic,
  Plus,
  GripVertical,
  Trash2,
  Clock,
  PlayCircle,
  Repeat,
  Shuffle,
  Search,
  X,
} from "lucide-react";
import { cn, formatDuration, parseYouTubeInput } from "@/utils/helpers";
import { Button, Input, ConfirmModal } from "@/components/common";
import { Video, SearchResult } from "@/types";
import { getApiUrl } from "@/config";

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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  const isUrl = (value: string) => {
    const parsed = parseYouTubeInput(value);
    return !!(parsed.videoId || parsed.playlistId);
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(
        getApiUrl(`/api/youtube/search?q=${encodeURIComponent(query)}`)
      );
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results || []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setNewVideoUrl(value);
    setError("");
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }
    if (isUrl(value) || !value.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimeoutRef.current = window.setTimeout(() => {
      handleSearch(value);
    }, 400);
  };

  const handleAddFromSearch = async (result: SearchResult) => {
    setIsAdding(true);
    try {
      await onAddVideo(result.id);
      setSearchResults([]);
      setNewVideoUrl("");
    } catch {
      setError("Failed to add video");
    } finally {
      setIsAdding(false);
    }
  };

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
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setOverIndex(e.clientY < midY ? index : index + 1);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(null);
    if (dragIndex !== null && dragIndex !== index) {
      onReorder(dragIndex, index);
    }
    setDragIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b-2 border-theme">
        <div className="flex items-center gap-2 mb-4">
          <ListMusic className="w-4 h-4 text-theme-accent" />
          <h3 className="font-semibold text-theme-primary">Queue</h3>
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
                    ? "bg-theme-accent/20 text-theme-accent border border-theme-accent/40 hover:bg-theme-accent/30"
                    : "bg-theme-elevated text-theme-muted border border-theme hover:bg-theme-hover hover:text-theme-secondary",
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
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation flex-shrink-0 bg-theme-elevated text-theme-muted border border-theme hover:bg-theme-hover hover:text-theme-secondary",
                  justShuffled && "ring-2 ring-theme-accent shadow-lg shadow-theme-accent/50",
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation flex-shrink-0 bg-theme-elevated text-theme-muted border border-theme hover:bg-theme-hover hover:text-red-400 hover:border-red-500/40"
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

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Search YouTube or paste a link"
                value={newVideoUrl}
                onChange={(e) => handleInputChange(e.target.value)}
                error={error}
                className="text-sm min-h-[44px] pr-8"
              />
              {newVideoUrl && (
                <button
                  onClick={() => {
                    setNewVideoUrl("");
                    setSearchResults([]);
                    setError("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
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

          {searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto scrollbar-thin rounded-lg border-2 border-theme bg-theme-elevated divide-y divide-theme">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleAddFromSearch(result)}
                  disabled={isAdding}
                  className="w-full flex items-center gap-3 p-2 hover:bg-theme-hover/50 transition-colors text-left disabled:opacity-50"
                >
                  {result.thumbnail && (
                    <img
                      src={result.thumbnail}
                      alt=""
                      className="w-16 h-9 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-theme-primary line-clamp-1">{result.title}</p>
                    <p className="text-xs text-theme-muted truncate">{result.channel}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <div className="flex items-center gap-2 text-xs text-theme-muted px-1">
              <Search className="w-3 h-3 animate-pulse" />
              Searching...
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {videos.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-theme-hover/80 flex items-center justify-center">
              <ListMusic className="w-6 h-6 text-theme-muted" />
            </div>
            <p className="text-theme-secondary font-medium">Queue is empty</p>
            <p className="text-theme-secondary text-sm mt-1">
              Add your first video above to watch together
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-theme">
            {videos.map((video, index) => (
              <li
                key={`${video.id}-${index}`}
                className={cn(
                  "p-3 transition-all duration-150 group animate-slide-up",
                  dragIndex === index
                    ? "opacity-40 ring-2 ring-theme-accent/50"
                    : "hover:bg-theme-hover/50",
                  currentVideoId === video.id && "bg-theme-accent/10",
                  overIndex === index && dragIndex !== null && dragIndex !== index
                    ? "border-t-2 border-theme-accent"
                    : "",
                )}
                draggable={isHost}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={() => setOverIndex(null)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onVideoClick?.(video)}
              >
                <div className="flex items-center gap-3">
                  {isHost && (
                    <div className="cursor-grab active:cursor-grabbing text-theme-muted group-hover:text-theme-secondary">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}

                  <div className="relative w-20 h-12 bg-theme-hover rounded overflow-hidden flex-shrink-0">
                    {video.thumbnail && (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {currentVideoId === video.id && (
                      <div className="absolute inset-0 bg-theme-accent/30 flex items-center justify-center">
                        <PlayCircle className="w-6 h-6 text-theme-accent" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-theme-secondary truncate text-sm">
                      {video.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-theme-muted">
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
                      className="p-2 text-theme-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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
    </div>
  );
};
