import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Copy, Check } from 'lucide-react';

interface HeaderProps {
  roomCode?: string;
  participantCount?: number;
  onLeave?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  participantCount,
  onLeave,
  showBack,
  onBack,
}) => {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const handleCopyCode = useCallback(async () => {
    if (!roomCode) return;
    const url = `${window.location.origin}/join/${roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        const ok = document.execCommand('copy');
        if (ok) {
          setCopied(true);
          setCopyFailed(false);
          setTimeout(() => setCopied(false), 2000);
        } else {
          setCopied(false);
          setCopyFailed(true);
          setTimeout(() => setCopyFailed(false), 2000);
        }
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }, [roomCode]);

  return (
    <header className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-xl border-b border-dark-700 shrink-0" style={{ height: 'var(--header-height)' }}>
      <div className="w-full px-3 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {showBack && (
              <button
                onClick={onBack}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-dark-800 transition-colors flex-shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-dark-300" />
              </button>
            )}

            <Link to="/" className="group flex-shrink-0">
              <span className="text-lg sm:text-xl font-display font-bold text-gradient">
                Chronos
              </span>
            </Link>

            {roomCode && (
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-dark-800 rounded-lg border border-dark-700 hover:border-dark-600 hover:bg-dark-700/80 transition-colors min-h-[36px] touch-manipulation group/copy min-w-0 max-w-[140px] sm:max-w-[180px]"
                title={copyFailed ? 'Copy failed' : 'Copy room link'}
              >
                <span className="text-xs font-medium text-dark-400 uppercase tracking-wider hidden sm:inline shrink-0">
                  Room
                </span>
                {copyFailed ? (
                  <span className="text-sm font-medium text-red-400">Failed</span>
                ) : (
                  <span className="font-mono font-semibold text-primary-400 text-sm sm:text-base truncate">
                    {roomCode}
                  </span>
                )}
                {copied ? (
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-dark-400 group-hover/copy:text-dark-300 flex-shrink-0" />
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {participantCount !== undefined && (
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-dark-800 rounded-lg border border-dark-700 min-h-[36px]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <Users className="w-4 h-4 text-dark-400 flex-shrink-0" />
                <span className="text-sm font-medium text-dark-200">
                  {participantCount}
                </span>
              </div>
            )}

            {onLeave && (
              <button
                onClick={onLeave}
                className="btn-ghost text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 min-h-[36px] px-3 touch-manipulation"
              >
                Leave
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
