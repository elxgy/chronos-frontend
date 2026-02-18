import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Copy, Check } from 'lucide-react';

interface HeaderProps {
  roomCode?: string;
  participantCount?: number;
  onLeave?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  participantCount,
  onLeave,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [roomCode]);

  return (
    <header className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-xl border-b border-dark-700 shrink-0" style={{ height: 'var(--header-height)' }}>
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link to="/" className="group flex-shrink-0">
              <span className="text-lg sm:text-xl font-display font-bold text-gradient">
                Chronos
              </span>
            </Link>

            {roomCode && (
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-dark-800 rounded-lg border border-dark-700 hover:border-dark-600 hover:bg-dark-700/80 transition-colors min-h-[36px] touch-manipulation group/copy min-w-0 max-w-[140px] sm:max-w-[180px]"
                title="Copy room code"
              >
                <span className="text-xs font-medium text-dark-400 uppercase tracking-wider hidden sm:inline shrink-0">
                  Room
                </span>
                <span className="font-mono font-semibold text-primary-400 text-sm sm:text-base truncate">
                  {roomCode}
                </span>
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
