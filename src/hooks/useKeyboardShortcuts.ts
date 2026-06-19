import { useEffect, useCallback } from "react";

interface KeyboardShortcutHandlers {
  isHost: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeekBack10: () => void;
  onSeekForward10: () => void;
  onSkip: () => void;
  onToggleMute: () => void;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (el as HTMLElement).contentEditable === "true"
  );
}

export function useKeyboardShortcuts({
  isHost,
  isPlaying,
  onPlay,
  onPause,
  onSeekBack10,
  onSeekForward10,
  onSkip,
  onToggleMute,
}: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isInputFocused()) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (isHost) {
            isPlaying ? onPause() : onPlay();
          }
          break;
        case "ArrowLeft":
          if (isHost) {
            e.preventDefault();
            onSeekBack10();
          }
          break;
        case "ArrowRight":
          if (isHost) {
            e.preventDefault();
            onSeekForward10();
          }
          break;
        case "n":
        case "N":
          if (isHost) {
            e.preventDefault();
            onSkip();
          }
          break;
        case "m":
        case "M":
          e.preventDefault();
          onToggleMute();
          break;
      }
    },
    [isHost, isPlaying, onPlay, onPause, onSeekBack10, onSeekForward10, onSkip, onToggleMute]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
