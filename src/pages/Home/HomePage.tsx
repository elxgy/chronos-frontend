import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Users, ChevronRight, Play } from 'lucide-react';
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
      <div className="w-full max-w-md">
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary-500/20 border border-primary-500/30 mb-4">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-gradient mb-2">
            Chronos
          </h1>
          <p className="text-dark-400 text-base sm:text-lg">
            Watch YouTube videos together in perfect sync
          </p>
          <p className="text-dark-500 text-sm mt-1">
            Real-time playback for up to 8 participants
          </p>
        </div>

        <Card variant="hover" className="mb-6 p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-dark-100">Create a Room</h3>
              <p className="text-sm text-dark-400">
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
          <h3 className="font-semibold text-dark-100 mb-4">
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
              <Users className="w-4 h-4" />
              Join
            </Button>
          </div>
        </Card>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-dark-800 rounded-lg border border-dark-700">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-dark-300">
              Real-time sync with{" "}
              <span className="text-primary-400">up to 8 participants</span>
            </span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
