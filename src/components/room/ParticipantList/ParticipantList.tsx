import React from 'react';
import {
  Users,
  Crown,
  Circle,
  Signal,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn, getQualityColor, getQualityBgColor, getQualityLabel } from '@/utils/helpers';
import { Card } from '@/components/common';
import { Participant, ConnectionQuality } from '@/types';

interface ParticipantListProps {
  participants: Participant[];
  currentUserId?: string;
  isHost: boolean;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  currentUserId,
  isHost: _isHost,
}) => {
  const getQualityIcon = (quality: ConnectionQuality) => {
    switch (quality) {
      case 'excellent':
        return <Signal className="w-3.5 h-3.5 text-green-400" />;
      case 'good':
        return <Signal className="w-3.5 h-3.5 text-primary-400" />;
      case 'fair':
        return <Signal className="w-3.5 h-3.5 text-yellow-400" />;
      case 'poor':
        return <Signal className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <WifiOff className="w-3.5 h-3.5 text-dark-400" />;
    }
  };

  return (
    <Card className="h-full flex flex-col" padding="none">
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-400" />
          <h3 className="font-semibold text-dark-100">Participants</h3>
          <span className="ml-auto badge-primary">{participants.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {participants.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-dark-500" />
            <p className="text-dark-400">No participants yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-dark-700">
            {participants.map((participant) => (
              <li
                key={participant.id}
                className={cn(
                  'p-3 hover:bg-dark-700/50 transition-colors',
                  currentUserId === participant.id && 'bg-primary-500/5'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-medium">
                      {participant.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-dark-800',
                        participant.connected
                          ? 'bg-green-500'
                          : 'bg-dark-500'
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-dark-200 truncate">
                        {participant.nickname}
                      </span>
                      {participant.isHost && (
                        <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      )}
                      {currentUserId === participant.id && (
                        <span className="text-xs text-dark-400">(you)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {participant.quality !== 'unknown' && (
                        <>
                          {getQualityIcon(participant.quality)}
                          <span
                            className={cn(
                              'text-xs',
                              getQualityColor(participant.quality)
                            )}
                          >
                            {getQualityLabel(participant.quality)}
                          </span>
                          <span className="text-xs text-dark-500">
                            ({participant.latencyMs.toFixed(0)}ms)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {participant.isActive ? (
                      <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                    ) : (
                      <Circle className="w-2 h-2 fill-dark-500 text-dark-500" />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};

interface QualityIndicatorProps {
  quality: ConnectionQuality;
  latencyMs: number;
  compact?: boolean;
}

export const QualityIndicator: React.FC<QualityIndicatorProps> = ({
  quality,
  latencyMs,
  compact = false,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-lg border',
        getQualityBgColor(quality),
        compact && 'text-xs'
      )}
    >
      {quality !== 'unknown' ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          {!compact && <span className={cn('text-xs', getQualityColor(quality))}>{latencyMs.toFixed(0)}ms</span>}
        </>
      ) : (
        <WifiOff className="w-3.5 h-3.5 text-dark-400" />
      )}
    </div>
  );
};
