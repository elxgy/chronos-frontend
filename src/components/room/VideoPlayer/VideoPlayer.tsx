import React, { useEffect, useMemo, useRef, useState } from "react";
import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";
import {
  Play,
  Pause,
  Volume1,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
} from "lucide-react";
import { Video } from "@/types";

const VOLUME_STORAGE_KEY = "chronos-volume";

function loadStoredVolume(): number {
  try {
    const v = parseInt(localStorage.getItem(VOLUME_STORAGE_KEY) ?? "100", 10);
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
  onReady?: (player: YouTubePlayer) => void;
  onStateChange?: (state: number) => void;
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
  onReady = () => {},
  onStateChange = () => {},
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
  const transitionKeyRef = useRef("");
  const pauseEnforceUntilRef = useRef(0);
  const lastNonZeroVolumeRef = useRef(100);
  const videoRef = useRef(video);
  videoRef.current = video;
  const stablePlayerVideoIdRef = useRef<string | null>(null);
  const prevVideoIdRef = useRef<string | null>(null);

  currentTimeRef.current = currentTime;
  isPlayingRef.current = isPlaying;
  stateVersionRef.current = stateVersion;

  const [volume, setVolume] = useState(loadStoredVolume);
  const [showControls, setShowControls] = useState(true);
  const [seekingTime, setSeekingTime] = useState<number | null>(null);
  const [hostDisplayTime, setHostDisplayTime] = useState(currentTime);
  const [isFullscreen, setIsFullscreen] = useState(false);
  seekingTimeRef.current = seekingTime;

  const opts = useMemo(
    () => ({
      width: "100%",
      height: "100%",
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
    }),
    [],
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number): string => {
    const safe = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const duration = video?.duration ?? 0;
  const progressTime =
    seekingTime ?? (isHost && isPlaying ? hostDisplayTime : currentTime);
  const sliderMax = duration > 0 ? duration : 1;

  const DRIFT_TOLERANCE_SEC = 1;
  const PAUSE_SYNC_TOLERANCE_SEC = 0.2;

  const applySyncCorrection = (
    player: YouTubePlayer,
    targetTime: number,
    tolerance = DRIFT_TOLERANCE_SEC,
  ) => {
    const localTime = player.getCurrentTime();
    const drift = localTime - targetTime;
    if (Math.abs(drift) > tolerance) {
      player.seekTo(targetTime, true);
    }
  };

  const applyAuthoritativeState = (strict = false) => {
    if (!playerRef.current || !videoRef.current) {
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

  useEffect(() => {
    setSeekingTime(null);
    setHostDisplayTime(currentTime);

    if (!video) {
      stablePlayerVideoIdRef.current = null;
      prevVideoIdRef.current = null;
      playerRef.current = null;
      return;
    }

    const isFirstMount = prevVideoIdRef.current === null;
    const videoChanged = !isFirstMount && prevVideoIdRef.current !== video.id;

    if (videoChanged && playerRef.current) {
      transitionKeyRef.current = "";
      playerRef.current.loadVideoById({
        videoId: video.id,
        startSeconds: currentTimeRef.current,
      });
    }

    prevVideoIdRef.current = video.id;
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
    applySyncCorrection(
      playerRef.current,
      currentTime,
      isPlaying ? DRIFT_TOLERANCE_SEC : PAUSE_SYNC_TOLERANCE_SEC,
    );
  }, [currentTime, isPlaying, seekingTime]);

  useEffect(() => {
    if (seekingTime !== null) {
      return;
    }
    const key = `${video?.id ?? ""}:${isPlaying ? "1" : "0"}:${stateVersionRef.current}`;
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      transitionKeyRef.current = "";
      applyAuthoritativeState(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleReady = (event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
    stablePlayerVideoIdRef.current = videoRef.current?.id ?? null;
    prevVideoIdRef.current = videoRef.current?.id ?? null;

    const iframe = event.target.getIframe?.() as HTMLIFrameElement | undefined;
    if (iframe) {
      const existing = iframe.getAttribute("allow") ?? "";
      if (!existing.includes("autoplay")) {
        iframe.setAttribute(
          "allow",
          existing ? `${existing}; autoplay` : "autoplay",
        );
      }
    }

    onReady(event.target);
    event.target.setVolume(volume);
    applyAuthoritativeState(true);
  };

  const handleStateChange = (event: YouTubeEvent<number>) => {
    const state = event.data;
    onStateChange(state);
    if (state === -1 || state === 2 || state === 5) {
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
    } catch {}
  };

  const toggleMute = () => {
    if (volume > 0) {
      handleVolumeChange(0);
    } else {
      handleVolumeChange(lastNonZeroVolumeRef.current);
    }
  };

  const handleFullscreen = () => {
    const container = document.getElementById("video-container");
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else if (container.requestFullscreen) {
      container.requestFullscreen();
    }
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
        className="relative w-full min-h-[200px] aspect-video bg-dark-800/80 rounded-xl border border-dark-700 overflow-hidden flex items-center justify-center"
      >
        <div className="text-center px-6 py-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-dark-700/80 flex items-center justify-center border border-dark-600">
            <Play className="w-10 h-10 text-dark-500" />
          </div>
          <p className="text-dark-300 font-medium">No video playing</p>
          <p className="text-dark-500 text-sm mt-1 max-w-xs mx-auto">
            Add a YouTube video to start watching together in sync
          </p>
        </div>
      </div>
    );
  }

  const youtubeVideoId = stablePlayerVideoIdRef.current ?? video.id;

  return (
    <div
      id="video-container"
      className="relative w-full aspect-video bg-dark-800 rounded-xl overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <YouTube
        videoId={youtubeVideoId}
        opts={opts}
        onReady={handleReady}
        onStateChange={handleStateChange}
        className="w-full h-full"
      />

      <div
        className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center transition-colors"
        onClick={handleVideoAreaClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleVideoAreaClick();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={isPlaying ? "Pause video" : "Play video"}
      />

      <div
        className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-dark-950/90 via-dark-950/50 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
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

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3">
            {isHost && (
              <>
                <button
                  onClick={isPlaying ? onPause : onPlay}
                  className="min-w-[44px] min-h-[44px] p-2 rounded-lg bg-dark-800/80 hover:bg-dark-700 text-dark-200 transition-colors flex items-center justify-center touch-manipulation"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={onSkip}
                  className="min-w-[44px] min-h-[44px] p-2 rounded-lg bg-dark-800/80 hover:bg-dark-700 text-dark-200 transition-colors flex items-center justify-center touch-manipulation"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={toggleMute}
                className="min-w-[44px] min-h-[44px] p-2 rounded-lg bg-dark-800/80 hover:bg-dark-700 text-dark-200 transition-colors flex items-center justify-center touch-manipulation"
                aria-label={volume === 0 ? "Unmute" : "Mute"}
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
                className="w-16 sm:w-20 accent-primary-500 cursor-pointer touch-manipulation"
                aria-label="Volume"
              />
            </div>
            <button
              onClick={handleFullscreen}
              className="min-w-[44px] min-h-[44px] p-2 rounded-lg bg-dark-800/80 hover:bg-dark-700 text-dark-200 transition-colors flex items-center justify-center touch-manipulation"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isHost && isPlaying && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-medium">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            Syncing
          </span>
        </div>
      )}
    </div>
  );
};
