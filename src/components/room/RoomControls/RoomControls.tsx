import React, { useState } from 'react';
import {
  Play,
  Pause,
  Rewind,
  FastForward,
  SkipForward,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/common';
import { Modal, Input } from '@/components/common';
import { cn } from '@/utils/helpers';

interface RoomControlsProps {
  isHost: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
  onSeekBack10: () => void;
  onSeekForward10: () => void;
  onAddVideo: (videoId: string) => void;
  onOpenAddVideo: () => void;
  showAddVideoModal: boolean;
  onCloseAddVideo: () => void;
}

export const RoomControls: React.FC<RoomControlsProps> = ({
  isHost,
  isPlaying,
  onPlay,
  onPause,
  onSkip,
  onSeekBack10,
  onSeekForward10,
  onAddVideo,
  onOpenAddVideo,
  showAddVideoModal,
  onCloseAddVideo,
}) => {
  return (
    <>
      <div className="flex items-center justify-center gap-3 py-4">
        {isHost ? (
          <>
            <button
              onClick={isPlaying ? onPause : onPlay}
              className={cn(
                'p-4 rounded-full transition-all duration-200',
                isPlaying
                  ? 'bg-dark-700 hover:bg-dark-600 text-dark-200'
                  : 'bg-primary-600 hover:bg-primary-500 text-white shadow-glow'
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
              className="p-4 rounded-full bg-dark-700 hover:bg-dark-600 text-dark-200 transition-all"
            >
              <SkipForward className="w-6 h-6" />
            </button>
            <button
              onClick={onSeekBack10}
              className="p-4 rounded-full bg-dark-700 hover:bg-dark-600 text-dark-200 transition-all"
              title="Go back 10 seconds"
              aria-label="Go back 10 seconds"
            >
              <Rewind className="w-6 h-6" />
            </button>
            <button
              onClick={onSeekForward10}
              className="p-4 rounded-full bg-dark-700 hover:bg-dark-600 text-dark-200 transition-all"
              title="Skip forward 10 seconds"
              aria-label="Skip forward 10 seconds"
            >
              <FastForward className="w-6 h-6" />
            </button>

            <button
              onClick={onOpenAddVideo}
              className="p-4 rounded-full bg-dark-700 hover:bg-dark-600 text-dark-200 transition-all"
            >
              <Plus className="w-6 h-6" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 text-dark-400">
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
            <span className="text-xs text-dark-500">
              (Host controls playback)
            </span>
          </div>
        )}
      </div>

      <AddVideoModal
        isOpen={showAddVideoModal}
        onClose={onCloseAddVideo}
        onAdd={onAddVideo}
      />
    </>
  );
};

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (videoId: string) => void;
}

const AddVideoModal: React.FC<AddVideoModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [videoUrl, setVideoUrl] = useState('');
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

  const handleAdd = () => {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setError('Invalid YouTube URL or video ID');
      return;
    }
    onAdd(videoId);
    setVideoUrl('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Video"
      description="Paste a YouTube URL or video ID"
    >
      <div className="space-y-4">
        <Input
          placeholder="https://youtube.com/watch?v=..."
          value={videoUrl}
          onChange={(e) => {
            setVideoUrl(e.target.value);
            setError('');
          }}
          error={error}
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdd}>
            Add Video
          </Button>
        </div>
      </div>
    </Modal>
  );
};
