import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { YouTubePlayer } from 'react-youtube';
import { cn } from '@/utils/helpers';
import { Header, MainLayout } from '@/components/layout';
import { VideoPlayer, Queue, ParticipantList, RoomControls } from '@/components/room';
import { useRoomBootstrap } from '@/hooks/useRoomBootstrap';

export const RoomPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    phase,
    session,
    roomState,
    participants,
    loadError,
    roomError,
    sendMessage,
    handleLeave,
  } = useRoomBootstrap(code, location.state, navigate);

  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'queue' | 'participants'>('queue');

  const handlePlayerReady = (playerInstance: YouTubePlayer) => {
    setPlayer(playerInstance);
  };

  const handlePlayerStateChange = (playerState: number) => {
    if (playerState === 1 && player && roomState.currentVideo) {
      const localTime = player.getCurrentTime();
      const targetTime = roomState.currentTime;
      const drift = localTime - targetTime;
      if (drift > 0 || drift < -1) {
        player.seekTo(targetTime, true);
      }
    }
  };

  const handleSeek = (time: number) => {
    sendMessage({
      type: 'control',
      payload: { type: 'seek', payload: { targetTime: time } },
    });
  };

  const handleSkip = () => {
    sendMessage({ type: 'control', payload: { type: 'skip' } });
  };

  const handleAddVideo = async (videoId: string) => {
    sendMessage({ type: 'add_video', payload: { videoId } });
  };

  const handleRemoveVideo = (videoId: string) => {
    sendMessage({ type: 'remove_video', payload: { videoId } });
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    sendMessage({ type: 'reorder_queue', payload: { fromIndex, toIndex } });
  };

  const handlePlay = () => {
    sendMessage({ type: 'control', payload: { type: 'play' } });
  };

  const handlePause = () => {
    sendMessage({ type: 'control', payload: { type: 'pause' } });
  };

  const handleSeekBack10 = () => {
    if (!isHost || !roomState.currentVideo) {
      return;
    }
    const target = Math.max(0, roomState.currentTime - 10);
    sendMessage({
      type: 'control',
      payload: { type: 'seek', payload: { targetTime: target } },
    });
  };

  const handleSeekForward10 = () => {
    if (!isHost || !roomState.currentVideo) {
      return;
    }
    const duration = roomState.currentVideo.duration;
    const target = Math.min(duration, roomState.currentTime + 10);
    sendMessage({
      type: 'control',
      payload: { type: 'seek', payload: { targetTime: target } },
    });
  };

  if (!code) {
    return (
      <MainLayout className="min-h-screen" maxWidth="full">
        <div className="p-6 text-dark-300">Redirecting to home...</div>
      </MainLayout>
    );
  }

  if (phase === 'initial' || phase === 'bootstrapping') {
    return (
      <MainLayout className="min-h-screen" maxWidth="full">
        <div className="p-6 text-dark-300">Loading room...</div>
      </MainLayout>
    );
  }

  if (phase === 'fatal') {
    return (
      <MainLayout className="min-h-screen" maxWidth="full">
        <div className="p-6 space-y-4">
          <p className="text-red-400">{loadError}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg bg-dark-700 text-dark-100 hover:bg-dark-600 transition-colors"
          >
            Back to home
          </button>
        </div>
      </MainLayout>
    );
  }

  const isHost = session?.isHost ?? false;
  const participantId = session?.participantId ?? '';

  return (
    <MainLayout className="min-h-screen" maxWidth="full">
      <Header
        roomCode={code}
        participantCount={participants.length}
        onLeave={handleLeave}
      />
      {phase === 'recovering' && (
        <div className="px-4 py-2 text-sm text-yellow-300 bg-yellow-500/10 border-b border-yellow-500/20">
          Realtime disconnected, reconnecting...
        </div>
      )}
      {roomError && (
        <div className="px-4 py-2 text-sm text-yellow-300 bg-yellow-500/10 border-b border-yellow-500/20">
          {roomError}
        </div>
      )}

      <div className="relative flex h-[calc(100vh-64px)]">
        <div className="flex-1 min-w-0 overflow-auto p-3 sm:p-4 md:p-6">
          <div
            className={cn(
              'mx-auto w-full transition-all duration-300',
              showSidebar ? 'max-w-5xl' : 'max-w-7xl'
            )}
          >
            <VideoPlayer
              video={roomState.currentVideo}
              currentTime={roomState.currentTime}
              stateVersion={roomState.stateVersion}
              isPlaying={roomState.isPlaying}
              isHost={isHost}
              onReady={handlePlayerReady}
              onStateChange={handlePlayerStateChange}
              onSeek={handleSeek}
              onSkip={handleSkip}
              onPlay={handlePlay}
              onPause={handlePause}
            />

            <div className="mt-4">
              {roomState.currentVideo && (
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-dark-100 line-clamp-1">
                    {roomState.currentVideo.title}
                  </h2>
                  <p className="text-sm text-dark-400">
                    Added by {roomState.currentVideo.addedByName}
                  </p>
                </div>
              )}

              <RoomControls
                isHost={isHost}
                isPlaying={roomState.isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
                onSkip={handleSkip}
                onSeekBack10={handleSeekBack10}
                onSeekForward10={handleSeekForward10}
                onAddVideo={handleAddVideo}
                onOpenAddVideo={() => setShowAddVideoModal(true)}
                showAddVideoModal={showAddVideoModal}
                onCloseAddVideo={() => setShowAddVideoModal(false)}
              />
            </div>
          </div>
        </div>

        <div
          className={cn(
            'border-l border-dark-700 bg-dark-900/90 backdrop-blur-sm flex flex-col transition-all duration-300',
            'fixed right-0 top-16 bottom-0 z-30 w-[min(22rem,92vw)] lg:static lg:top-auto lg:bottom-auto lg:h-auto',
            showSidebar
              ? 'translate-x-0 lg:w-80'
              : 'translate-x-full lg:translate-x-0 lg:w-0 lg:border-l-0 lg:overflow-hidden'
          )}
        >
          <div className="flex border-b border-dark-700">
            <button
              onClick={() => setSidebarTab('queue')}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors',
                sidebarTab === 'queue'
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-dark-400 hover:text-dark-200'
              )}
            >
              Queue ({roomState.queue.length})
            </button>
            <button
              onClick={() => setSidebarTab('participants')}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors',
                sidebarTab === 'participants'
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-dark-400 hover:text-dark-200'
              )}
            >
              People ({participants.length})
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'queue' ? (
              <Queue
                videos={roomState.queue}
                currentVideoId={roomState.currentVideo?.id}
                isHost={isHost}
                onAddVideo={handleAddVideo}
                onRemoveVideo={handleRemoveVideo}
                onReorder={handleReorder}
              />
            ) : (
              <ParticipantList
                participants={participants}
                currentUserId={participantId}
                isHost={isHost}
              />
            )}
          </div>
        </div>

        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="fixed right-3 top-20 z-40 bg-dark-800 border border-dark-700 px-3 py-2 rounded-lg text-xs font-medium text-dark-300 hover:text-dark-100 transition-colors"
        >
          {showSidebar ? 'Hide panel' : 'Show panel'}
        </button>
      </div>
    </MainLayout>
  );
};
