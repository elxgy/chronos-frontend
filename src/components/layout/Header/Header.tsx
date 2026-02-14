import React from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

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
  return (
    <header className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="group">
              <span className="text-xl font-display font-bold text-gradient hidden sm:block">
                Chronos
              </span>
              <span className="text-lg font-display font-bold text-gradient sm:hidden">Chronos</span>
            </Link>

            {roomCode && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-lg border border-dark-700">
                <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">
                  Room
                </span>
                <span className="font-mono font-semibold text-primary-400">
                  {roomCode}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {participantCount !== undefined && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-lg border border-dark-700">
                <Users className="w-4 h-4 text-dark-400" />
                <span className="text-sm font-medium text-dark-200">
                  {participantCount}
                </span>
              </div>
            )}

            {onLeave && (
              <button
                onClick={onLeave}
                className="btn-ghost text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
