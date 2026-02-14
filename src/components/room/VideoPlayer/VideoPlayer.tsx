import React, { useEffect, useRef, useState } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { Play, Pause, Volume1, Volume2, VolumeX, Maximize, SkipForward } from 'lucide-react';
import { Video } from '@/types';

const VOLUME_STORAGE_KEY = 'chronos-volume';

function loadStoredVolume(): number {
  try {
    const v = parseInt(localStorage.getItem(VOLUME_STORAGE_KEY) ?? '100', 10);
    return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 100;
  } catch {
    return 100;
  }
}

interface VideoPlayerProps {
  video: Video | null;
  currentTime: number;
  stateVersion: number;
  isPlaying: boolean;
  isHost: boolean;
  onReady: (player: YouTubePlayer) => void;
  onStateChange: (state: number) => void;
  onSeek: (time: number) => void;
  onSkip: () => void;
  onPlay: () => void;
  onPause: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  currentTime,
  stateVersion,
  isPlaying,
  isHost,
  onReady,
  onStateChange,
  onSeek,
  onSkip,
  onPlay,
  onPause,
}) => {
  const playerRef = useRef<YouTubePlayer>(null);
  const seekingTimeRef = useRef<number | null>(null);
  const currentTimeRef = useRef(currentTime);
  const isPlayingRef = useRef(isPlaying);
  const stateVersionRef = useRef(stateVersion);
  const transitionKeyRef = useRef('');
  const pauseEnforceUntilRef = useRef(0);
  const lastNonZeroVolumeRef = useRef(100);
  const stableVideoIdRef = useRef<string>('');
  const loadedVideoIdRef = useRef<string>('');
  currentTimeRef.current = currentTime;
  isPlayingRef.current = isPlaying;
  stateVersionRef.current = stateVersion;
  const [volume, setVolume] = useState(loadStoredVolume);
  const [showControls, setShowControls] = useState(true);
  const [seekingTime, setSeekingTime] = useState<number | null>(null);
  const [hostDisplayTime, setHostDisplayTime] = useState(currentTime);
  seekingTimeRef.current = seekingTime;

  const formatTime = (seconds: number): string => {
    const safe = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const duration = video?.duration ?? 0;
  const progressTime = seekingTime ?? (isHost && isPlaying ? hostDisplayTime : currentTime);
  const sliderMax = duration > 0 ? duration : 1;

  const DRIFT_TOLERANCE_SEC = 1;
  const PAUSE_SYNC_TOLERANCE_SEC = 0.2;
  const applySyncCorrection = (
    player: YouTubePlayer,
    targetTime: number,
    tolerance = DRIFT_TOLERANCE_SEC
  ) => {
    const localTime = player.getCurrentTime();
    const drift = localTime - targetTime;
    if (Math.abs(drift) > tolerance) {
      player.seekTo(targetTime, true);
    }
  };

  const applyAuthoritativeState = (strict = false) => {
    if (!playerRef.current || !video) {
      return;
    }
    const targetTime = currentTimeRef.current;
    const shouldPlay = isPlayingRef.current;
    const tolerance = strict
      ? shouldPlay
        ? 0.25
        : 0.05
      : shouldPlay
        ? DRIFT_TOLERANCE_SEC
        : PAUSE_SYNC_TOLERANCE_SEC;

    applySyncCorrection(playerRef.current, targetTime, tolerance);
    if (shouldPlay) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  };

  if (video?.id && !stableVideoIdRef.current) {
    stableVideoIdRef.current = video.id;
  }

  useEffect(() => {
    if (playerRef.current && video?.id && video.id !== loadedVideoIdRef.current) {
      playerRef.current.loadVideoById({ videoId: video.id });
      loadedVideoIdRef.current = video.id;
      playerRef.current.setVolume(volume);
    }
  }, [video?.id]);

  useEffect(() => {
    setSeekingTime(null);
    setHostDisplayTime(currentTime);
  }, [video?.id]);

  useEffect(() => {
    if (!isHost || isPlaying || seekingTime !== null) {
      setHostDisplayTime(currentTime);
    }
  }, [currentTime, isHost, isPlaying, seekingTime]);

  useEffect(() => {
    if (!playerRef.current || seekingTime !== null) {
      return;
    }
    applySyncCorrection(playerRef.current, currentTime, isPlaying ? DRIFT_TOLERANCE_SEC : PAUSE_SYNC_TOLERANCE_SEC);
  }, [currentTime, isPlaying, seekingTime]);

  useEffect(() => {
    if (seekingTime !== null) {
      return;
    }
    const key = `${video?.id ?? ''}:${isPlaying ? '1' : '0'}:${stateVersionRef.current}`;
    if (transitionKeyRef.current === key) {
      return;
    }
    transitionKeyRef.current = key;
    pauseEnforceUntilRef.current = isPlaying ? 0 : Date.now() + 5000;
    applyAuthoritativeState(true);
  }, [video?.id, isPlaying, stateVersion, seekingTime]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!playerRef.current || seekingTimeRef.current !== null) {
        return;
      }
      if (!isPlayingRef.current) {
        if (Date.now() <= pauseEnforceUntilRef.current) {
          applyAuthoritativeState(true);
        }
        return;
      }
      applyAuthoritativeState(false);
    }, 400);
    return () => window.clearInterval(id);
  }, [video?.id]);

  useEffect(() => {
    applyAuthoritativeState(true);
  }, [isPlaying]);

  const handleReady = (event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
    onReady(event.target);
    loadedVideoIdRef.current = video?.id ?? '';
    event.target.setVolume(volume);
    applyAuthoritativeState(true);
  };

  const handleStateChange = (state: number) => {
    onStateChange(state);
    if (state === -1 || state === 1 || state === 2 || state === 3 || state === 5) {
      window.setTimeout(() => {
        if (seekingTimeRef.current !== null) {
          return;
        }
        applyAuthoritativeState(true);
      }, 0);
    }
  };

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  const handleVolumeChange = (value: number) => {
    const v = Math.max(0, Math.min(100, value));
    setVolume(v);
    if (v > 0) lastNonZeroVolumeRef.current = v;
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(v));
    } catch {
      /* ignore */
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      handleVolumeChange(0);
    } else {
      handleVolumeChange(lastNonZeroVolumeRef.current);
    }
  };

  const handleFullscreen = () => {
    const container = document.getElementById('video-container');
    if (container?.requestFullscreen) {
      container.requestFullscreen();
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const commitSeek = () => {
    if (seekingTime === null) {
      return;
    }
    const target = Math.max(0, Math.min(duration, seekingTime));
    if (playerRef.current) {
      playerRef.current.seekTo(target, true);
      if (isPlayingRef.current) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
    setHostDisplayTime(target);
    onSeek(target);
    setSeekingTime(null);
  };

  const opts = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
      enablejsapi: 1,
      origin: window.location.origin,
      fs: 0,
      iv_load_policy: 3,
    },
  };

  const handleVideoAreaClick = () => {
    if (!isHost) {
      return;
    }
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  if (!video) {
    return (
      <div
        id="video-container"
        className="relative w-full aspect-video bg-dark-800 rounded-xl border border-dark-700 overflow-hidden flex items-center justify-center"
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-700 flex items-center justify-center">
            <Play className="w-10 h-10 text-dark-500" />
          </div>
          <p className="text-dark-400">No video playing</p>
          <p className="text-dark-500 text-sm mt-1">Add a video to start watching together</p>
        </div>
      </div>
    );
  }

  return (
    <div
      id="video-container"
      className="relative w-full aspect-video bg-dark-800 rounded-xl overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <YouTube
        videoId={stableVideoIdRef.current || video.id}
        opts={opts}
        onReady={handleReady}
        onStateChange={handleStateChange}
        className="w-full h-full"
      />

      <div
        className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center transition-colors"
        onClick={handleVideoAreaClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleVideoAreaClick();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={isPlaying ? 'Pause video' : 'Play video'}
      />

      <div
        className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-dark-950/90 via-dark-950/50 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="mb-3">
          <input
            type="range"
            min={0}
            max={sliderMax}
            step={0.1}
            value={Math.max(0, Math.min(sliderMax, progressTime))}
            disabled={!isHost}
            onChange={(e) => setSeekingTime(Number(e.target.value))}
            onMouseUp={commitSeek}
            onTouchEnd={commitSeek}
            className="w-full accent-primary-500 disabled:opacity-60 cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs text-dark-300 mt-1">
            <span>{formatTime(progressTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isHost && (
              <>
                <button
                  onClick={isPlaying ? onPause : onPlay}
                  className="p-2 rounded-lg bg-dark-800/80 hover:bg-dark-700 text-dark-200 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleSkip}
                  className="p-2 rounded-lg bg-dark-800/80 hover:bg-dark-700 text-dark-200 transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-lg bg-dark-800/80 hover:bg-dark-700 text-dark-200 transition-colors"
                aria-label={volume === 0 ? 'Unmute' : 'Mute'}
              >
                {volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : volume < 50 ? (
                  <Volume1 className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-20 accent-primary-500 cursor-pointer"
                aria-label="Volume"
              />
            </div>
            <button
              onClick={handleFullscreen}
              className="p-2 rounded-lg bg-dark-800/80 hover:bg-dark-700 text-dark-200 transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {isHost && isPlaying && (
        <div className="absolute top-4 right-4 z-30">
          <span className="badge-warning">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2" />
            Syncing
          </span>
        </div>
      )}
    </div>
  );
};
