import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button, Input, Card } from '@/components/common';
import { MainLayout } from '@/components/layout';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');

  const handleJoin = () => {
    if (joinCode.trim()) {
      navigate(`/join/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <MainLayout className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-theme-accent mb-2">
            Chronos
          </h1>
          <p className="text-theme-secondary text-base sm:text-lg">
            Watch YouTube videos together in perfect sync
          </p>
          <p className="text-theme-muted text-sm mt-1">
            Real-time playback for up to 8 participants
          </p>
        </div>

        <Card variant="hover" className="mb-6 p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-theme-primary">Create a Room</h3>
              <p className="text-sm text-theme-secondary">
                Start a new room and invite friends
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/create')}
              className="min-h-[44px] touch-manipulation shrink-0"
            >
              Create
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        <Card variant="hover" className="mb-8 p-4 sm:p-5">
          <h3 className="font-semibold text-theme-primary mb-4">
            Join Existing Room
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.toUpperCase().slice(0, 6))
              }
              className="font-mono text-center tracking-widest text-lg min-h-[48px]"
              maxLength={6}
            />
            <Button
              variant="primary"
              onClick={handleJoin}
              disabled={joinCode.length !== 6}
              className="min-h-[48px] touch-manipulation sm:w-auto"
            >
              Join
            </Button>
          </div>
        </Card>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-theme-elevated rounded-lg border border-theme">
            <span className="w-2 h-2 bg-status-success rounded-full animate-pulse" />
            <span className="text-sm text-theme-secondary">
              Real-time sync with{" "}
              <span className="text-theme-accent">up to 8 participants</span>
            </span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
