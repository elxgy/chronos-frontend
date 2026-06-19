import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Rewind,
  FastForward,
  SkipForward,
  Plus,
  Repeat1,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/common';
import { Modal, Input } from '@/components/common';
import { cn, parseYouTubeInput } from '@/utils/helpers';
import { SearchResult } from '@/types';
import { getApiUrl } from '@/config';

interface RoomControlsProps {
  isHost: boolean;
  isPlaying: boolean;
  loop: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
  onSeekBack10: () => void;
  onSeekForward10: () => void;
  onSetLoop: (enabled: boolean) => void;
  onAddVideo: (videoId: string) => void;
  onAddPlaylist?: (playlistId: string) => void;
  onOpenAddVideo: () => void;
  showAddVideoModal: boolean;
  onCloseAddVideo: () => void;
}

export const RoomControls: React.FC<RoomControlsProps> = ({
  isHost,
  isPlaying,
  loop,
  onPlay,
  onPause,
  onSkip,
  onSeekBack10,
  onSeekForward10,
  onSetLoop,
  onAddVideo,
  onAddPlaylist,
  onOpenAddVideo,
  showAddVideoModal,
  onCloseAddVideo,
}) => {
  return (
    <>
      <div className="flex items-center justify-center gap-2 sm:gap-3 py-4 flex-wrap">
        {isHost ? (
          <>
            <button
              onClick={isPlaying ? onPause : onPlay}
              className={cn(
                'min-w-[48px] min-h-[48px] p-4 rounded-lg transition-all duration-200 flex items-center justify-center touch-manipulation',
                isPlaying
                  ? 'bg-theme-hover hover:bg-theme-hover text-theme-secondary'
                  : 'bg-theme-accent hover:bg-theme-accent text-on-accent shadow-glow'
              )}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={onSkip}
              className="min-w-[48px] min-h-[48px] p-4 rounded-lg bg-theme-hover hover:bg-theme-hover text-theme-secondary transition-all flex items-center justify-center touch-manipulation"
            >
              <SkipForward className="w-6 h-6" />
            </button>
            <button
              onClick={onSeekBack10}
              className="min-w-[48px] min-h-[48px] p-4 rounded-lg bg-theme-hover hover:bg-theme-hover text-theme-secondary transition-all flex items-center justify-center touch-manipulation"
              title="Go back 10 seconds"
              aria-label="Go back 10 seconds"
            >
              <Rewind className="w-6 h-6" />
            </button>
            <button
              onClick={onSeekForward10}
              className="min-w-[48px] min-h-[48px] p-4 rounded-lg bg-theme-hover hover:bg-theme-hover text-theme-secondary transition-all flex items-center justify-center touch-manipulation"
              title="Skip forward 10 seconds"
              aria-label="Skip forward 10 seconds"
            >
              <FastForward className="w-6 h-6" />
            </button>

            <button
              onClick={() => onSetLoop(!loop)}
              className={cn(
                'min-w-[48px] min-h-[48px] p-4 rounded-lg transition-all flex items-center justify-center touch-manipulation',
                loop
                  ? 'bg-theme-accent hover:bg-theme-accent text-on-accent'
                  : 'bg-theme-hover hover:bg-theme-hover text-theme-secondary'
              )}
              title={loop ? 'Loop on: replay current video when it ends' : 'Loop off'}
              aria-label={loop ? 'Loop on' : 'Loop off'}
            >
              <Repeat1 className="w-6 h-6" />
            </button>

            <button
              onClick={onOpenAddVideo}
              className="min-w-[48px] min-h-[48px] p-4 rounded-lg bg-theme-hover hover:bg-theme-hover text-theme-secondary transition-all flex items-center justify-center touch-manipulation"
              aria-label="Add video"
            >
              <Plus className="w-6 h-6" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 text-theme-muted">
            <span className="text-sm">
              {isPlaying ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Playing
                </span>
              ) : (
                'Paused'
              )}
            </span>
            <span className="text-xs text-theme-muted">
              (Host controls playback)
            </span>
          </div>
        )}
      </div>

      <AddVideoModal
        isOpen={showAddVideoModal}
        onClose={onCloseAddVideo}
        onAddVideo={onAddVideo}
        onAddPlaylist={onAddPlaylist}
      />
    </>
  );
};

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVideo: (videoId: string) => void;
  onAddPlaylist?: (playlistId: string) => void;
}

const AddVideoModal: React.FC<AddVideoModalProps> = ({
  isOpen,
  onClose,
  onAddVideo,
  onAddPlaylist,
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  const handleSearch = async (query: string) => {
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
      // Search failed silently
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = window.setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleAdd = () => {
    if (searchQuery.trim() && searchResults.length === 0) {
      setError('No search results. Try a different query or paste a URL.');
      return;
    }
    if (!videoUrl.trim()) {
      setError('Enter a YouTube URL or search for a video');
      return;
    }
    const parsed = parseYouTubeInput(videoUrl);
    if (parsed.playlistId && onAddPlaylist) {
      onAddPlaylist(parsed.playlistId);
      setVideoUrl('');
      setError('');
      onClose();
      return;
    }
    if (parsed.videoId) {
      onAddVideo(parsed.videoId);
      setVideoUrl('');
      setError('');
      onClose();
      return;
    }
    setError('Invalid YouTube URL, video ID, or playlist link');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Video" description="Search YouTube or paste a URL">
      <div className="space-y-4">
        <Input
          placeholder="Search YouTube or paste URL..."
          value={searchQuery}
          onChange={(e) => {
            handleSearchInputChange(e.target.value);
            setError('');
          }}
          error={error}
        />

        {searchResults.length > 0 && (
          <div className="border-2 border-theme rounded-lg max-h-48 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => {
                  onAddVideo(result.id);
                  setSearchQuery('');
                  setSearchResults([]);
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-2 hover:bg-theme-hover/50 transition-colors text-left"
              >
                <img src={result.thumbnail} alt="" className="w-16 h-10 object-cover rounded" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-theme-secondary truncate">{result.title}</p>
                  <p className="text-xs text-theme-muted">{result.channel}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-theme-accent animate-spin" />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd} disabled={!searchQuery.trim()}>Add</Button>
        </div>
      </div>
    </Modal>
  );
};
