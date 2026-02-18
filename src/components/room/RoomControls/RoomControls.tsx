import React, { useState } from 'react';
import {
  Play,
  Pause,
  Rewind,
  FastForward,
  SkipForward,
  Plus,
  Repeat1,
} from 'lucide-react';
import { Button } from '@/components/common';
import { Modal, Input } from '@/components/common';
import { cn, extractVideoId } from '@/utils/helpers';

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
                'min-w-[48px] min-h-[48px] p-4 rounded-full transition-all duration-200 flex items-center justify-center touch-manipulation',
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
              className="min-w-[48px] min-h-[48px] p-4 rounded-full bg-dark-700 hover:bg-dark-600 text-dark-200 transition-all flex items-center justify-center touch-manipulation"
            >
              <SkipForward className="w-6 h-6" />
            </button>
            <button
              onClick={onSeekBack10}
              className="min-w-[48px] min-h-[48px] p-4 rounded-full bg-dark-700 hover:bg-dark-600 text-dark-200 transition-all flex items-center justify-center touch-manipulation"
              title="Go back 10 seconds"
              aria-label="Go back 10 seconds"
            >
              <Rewind className="w-6 h-6" />
            </button>
            <button
              onClick={onSeekForward10}
              className="min-w-[48px] min-h-[48px] p-4 rounded-full bg-dark-700 hover:bg-dark-600 text-dark-200 transition-all flex items-center justify-center touch-manipulation"
              title="Skip forward 10 seconds"
              aria-label="Skip forward 10 seconds"
            >
              <FastForward className="w-6 h-6" />
            </button>

            <button
              onClick={() => onSetLoop(!loop)}
              className={cn(
                'min-w-[48px] min-h-[48px] p-4 rounded-full transition-all flex items-center justify-center touch-manipulation',
                loop
                  ? 'bg-primary-600 hover:bg-primary-500 text-white'
                  : 'bg-dark-700 hover:bg-dark-600 text-dark-200'
              )}
              title={loop ? 'Loop on: replay current video when it ends' : 'Loop off'}
              aria-label={loop ? 'Loop on' : 'Loop off'}
            >
              <Repeat1 className="w-6 h-6" />
            </button>

            <button
              onClick={onOpenAddVideo}
              className="min-w-[48px] min-h-[48px] p-4 rounded-full bg-dark-700 hover:bg-dark-600 text-dark-200 transition-all flex items-center justify-center touch-manipulation"
              aria-label="Add video"
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
