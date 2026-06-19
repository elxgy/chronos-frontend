import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Copy, Check, Paintbrush } from 'lucide-react';
import { cn } from '@/utils/helpers';

const THEMES = [
  { id: 'dark-blue', name: 'Dark Blue' },
  { id: 'midnight', name: 'Midnight' },
] as const;

type ThemeId = typeof THEMES[number]['id'];

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
  const [theme, setTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem('chronos-theme') as ThemeId) || 'dark-blue';
  });
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.className = `dark theme-${theme}`;
    localStorage.setItem('chronos-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="sticky top-0 z-40 bg-theme-surface/90 backdrop-blur-xl border-b-2 border-theme shrink-0" style={{ height: 'var(--header-height)' }}>
      <div className="w-full px-3 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {showBack && (
              <button
                onClick={onBack}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-theme-elevated transition-colors flex-shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-theme-secondary" />
              </button>
            )}

            <Link to="/" className="group flex-shrink-0">
              <span className="text-lg sm:text-xl font-display font-bold text-theme-accent">
                Chronos
              </span>
            </Link>

            {roomCode && (
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-theme-elevated rounded-lg border border-theme hover:bg-theme-hover transition-colors min-h-[36px] touch-manipulation group/copy min-w-0 max-w-[140px] sm:max-w-[180px]"
                title={copyFailed ? 'Copy failed' : 'Copy room link'}
              >
                <span className="text-xs font-medium text-theme-muted uppercase tracking-wider hidden sm:inline shrink-0">
                  Room
                </span>
                {copyFailed ? (
                  <span className="text-sm font-medium text-red-400">Failed</span>
                ) : (
                  <span className="font-mono font-semibold text-theme-accent text-sm sm:text-base truncate">
                    {roomCode}
                  </span>
                )}
                {copied ? (
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-theme-muted group-hover/copy:text-theme-secondary flex-shrink-0" />
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {participantCount !== undefined && (
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-theme-elevated rounded-lg border border-theme min-h-[36px]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <Users className="w-4 h-4 text-theme-muted flex-shrink-0" />
                <span className="text-sm font-medium text-theme-secondary">
                  {participantCount}
                </span>
              </div>
            )}

            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="min-w-[36px] min-h-[36px] p-2 rounded-lg text-theme-muted hover:text-theme-secondary hover:bg-theme-elevated transition-colors touch-manipulation"
                aria-label="Change theme"
              >
                <Paintbrush className="w-4 h-4" />
              </button>
              {showThemeMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-theme-elevated border border-theme rounded-lg shadow-lg z-50 py-1">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setShowThemeMenu(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors",
                        theme === t.id
                          ? "text-theme-accent bg-theme-accent/10"
                          : "text-theme-secondary hover:text-theme-primary hover:bg-theme-hover"
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
