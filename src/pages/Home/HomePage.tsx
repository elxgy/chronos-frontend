import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Users, ChevronRight } from 'lucide-react';
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
    <MainLayout className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-gradient mb-3">
            Chronos
          </h1>
          <p className="text-dark-400 text-lg">
            Watch YouTube videos together in perfect sync
          </p>
        </div>

        <Card variant="hover" className="mb-6">
          <div className="flex items-center gap-4 p-2">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-primary-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-dark-100">Create a Room</h3>
              <p className="text-sm text-dark-400">
                Start a new room and invite friends
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate('/create')}>
              Create
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        <Card variant="hover" className="mb-8">
          <div className="p-2">
            <h3 className="font-semibold text-dark-100 mb-4 px-2">
              Join Existing Room
            </h3>
            <div className="flex gap-3 px-2">
              <Input
                placeholder="Enter room code"
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(e.target.value.toUpperCase().slice(0, 6))
                }
                className="font-mono text-center tracking-widest text-lg"
                maxLength={6}
              />
              <Button
                variant="primary"
                onClick={handleJoin}
                disabled={joinCode.length !== 6}
              >
                <Users className="w-4 h-4" />
                Join
              </Button>
            </div>
          </div>
        </Card>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-lg border border-dark-700">
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
