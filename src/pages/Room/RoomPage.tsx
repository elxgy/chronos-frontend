import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { YouTubePlayer } from "react-youtube";
import { Loader2, AlertCircle, X } from "lucide-react";
import { cn } from "@/utils/helpers";
import { Header, MainLayout } from "@/components/layout";
import {
  VideoPlayer,
  Queue,
  ParticipantList,
  RoomControls,
} from "@/components/room";
import { Button, ConfirmModal } from "@/components/common";
import { useRoomBootstrap } from "@/hooks/useRoomBootstrap";

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
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"queue" | "participants">(
    "queue",
  );
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const onLeaveClick = () => setShowLeaveConfirm(true);
  const onLeaveConfirm = () => {
    setShowLeaveConfirm(false);
    handleLeave();
  };

  const handlePlayerReady = (playerInstance: YouTubePlayer) => {
    setPlayer(playerInstance);
  };

  const handlePlayerStateChange = (playerState: number) => {
    if (playerState === 1 && player && roomState.currentVideo) {
      try {
        const localTime = player.getCurrentTime();
        const targetTime = roomState.currentTime;
        const drift = localTime - targetTime;
        if (drift > 0 || drift < -1) {
          player.seekTo(targetTime, true);
        }
      } catch {
        // Player may be stale (e.g. video switched)
      }
    }
  };

  const handleSeek = (time: number) => {
    sendMessage({
      type: "control",
      payload: { type: "seek", payload: { targetTime: time } },
    });
  };

  const handleSkip = () => {
    sendMessage({ type: "control", payload: { type: "skip" } });
  };

  const handleAddVideo = async (videoId: string) => {
    sendMessage({ type: "add_video", payload: { videoId } });
  };

  const handleAddPlaylist = (playlistId: string) => {
    sendMessage({ type: "add_playlist", payload: { playlistId } });
  };

  const handleRemoveVideo = (videoId: string) => {
    sendMessage({ type: "remove_video", payload: { videoId } });
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    sendMessage({ type: "reorder_queue", payload: { fromIndex, toIndex } });
  };

  const handlePlay = () => {
    sendMessage({ type: "control", payload: { type: "play" } });
  };

  const handlePause = () => {
    sendMessage({ type: "control", payload: { type: "pause" } });
  };

  const handleSetAutoplay = (enabled: boolean) => {
    sendMessage({
      type: "control",
      payload: { type: "set_autoplay", payload: { enabled } },
    });
  };

  const handleSetLoop = (enabled: boolean) => {
    sendMessage({
      type: "control",
      payload: { type: "set_loop", payload: { enabled } },
    });
  };

  const handleClearQueue = () => {
    sendMessage({ type: "clear_queue", payload: {} });
  };

  const handleShuffleQueue = () => {
    sendMessage({ type: "control", payload: { type: "shuffle_queue" } });
  };

  const handleSeekBack10 = () => {
    if (!isHost || !roomState.currentVideo) {
      return;
    }
    const target = Math.max(0, roomState.currentTime - 10);
    sendMessage({
      type: "control",
      payload: { type: "seek", payload: { targetTime: target } },
    });
  };

  const handleSeekForward10 = () => {
    if (!isHost || !roomState.currentVideo) {
      return;
    }
    const duration = roomState.currentVideo.duration;
    const target = Math.min(duration, roomState.currentTime + 10);
    sendMessage({
      type: "control",
      payload: { type: "seek", payload: { targetTime: target } },
    });
  };

  if (!code) {
    return (
      <MainLayout
        className="min-h-screen flex items-center justify-center"
        maxWidth="full"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          <p className="text-dark-400">Redirecting to home...</p>
        </div>
      </MainLayout>
    );
  }

  if (phase === "initial" || phase === "bootstrapping") {
    return (
      <MainLayout
        className="min-h-screen flex items-center justify-center"
        maxWidth="full"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
          <p className="text-dark-300 font-medium">Connecting to room...</p>
          <p className="text-sm text-dark-500">Setting up real-time sync</p>
        </div>
      </MainLayout>
    );
  }

  if (phase === "fatal") {
    return (
      <MainLayout
        className="min-h-screen flex items-center justify-center"
        maxWidth="full"
      >
        <div className="w-full max-w-md p-6 card">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-100 mb-1">
                Could not load room
              </h2>
              <p className="text-dark-400 text-sm">{loadError}</p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate("/")}
              className="min-h-[44px] px-6"
            >
              Back to home
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isHost = session?.isHost ?? false;
  const participantId = session?.participantId ?? "";

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <Header
        roomCode={code}
        participantCount={participants.length}
        onLeave={onLeaveClick}
      />
      <ConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={onLeaveConfirm}
        title="Leave room?"
        message="You will disconnect from the room. Rejoin with the same room code to watch again."
        confirmText="Leave"
        cancelText="Stay"
        variant="danger"
      />
      {phase === "recovering" && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-yellow-300 bg-yellow-500/10 border-b border-yellow-500/20 shrink-0">
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
          <span>Realtime disconnected, reconnecting...</span>
        </div>
      )}
      {roomError && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-yellow-300 bg-yellow-500/10 border-b border-yellow-500/20 shrink-0">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{roomError}</span>
        </div>
      )}

      <div className="relative flex flex-1 flex-col lg:flex-row min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-auto p-3 sm:p-4 md:p-6 flex flex-col">
          <div
            className={cn(
              "mx-auto w-full transition-all duration-300",
              showSidebar ? "max-w-5xl" : "max-w-7xl",
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

            <div className="mt-4 space-y-4">
              {roomState.currentVideo && (
                <div className="flex gap-3 items-start">
                  {roomState.currentVideo.thumbnail && (
                    <img
                      src={roomState.currentVideo.thumbnail}
                      alt=""
                      className="w-24 h-14 rounded-lg object-cover flex-shrink-0 hidden sm:block"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-dark-100 line-clamp-2">
                      {roomState.currentVideo.title}
                    </h2>
                    <p className="text-sm text-dark-400 mt-0.5">
                      Added by {roomState.currentVideo.addedByName}
                    </p>
                  </div>
                </div>
              )}

              <RoomControls
                isHost={isHost}
                isPlaying={roomState.isPlaying}
                loop={roomState.loop ?? false}
                onPlay={handlePlay}
                onPause={handlePause}
                onSkip={handleSkip}
                onSeekBack10={handleSeekBack10}
                onSeekForward10={handleSeekForward10}
                onSetLoop={handleSetLoop}
                onAddVideo={handleAddVideo}
                onAddPlaylist={handleAddPlaylist}
                onOpenAddVideo={() => setShowAddVideoModal(true)}
                showAddVideoModal={showAddVideoModal}
                onCloseAddVideo={() => setShowAddVideoModal(false)}
              />
            </div>
          </div>
        </div>

        <aside
          className={cn(
            "border-l border-dark-700 bg-dark-900/95 backdrop-blur-sm flex flex-col transition-all duration-300 shrink-0",
            showSidebar
              ? "fixed inset-x-0 bottom-0 z-30 flex flex-col w-full sm:left-auto sm:right-0 sm:w-96 top-[var(--header-height)] lg:relative lg:inset-auto lg:bottom-auto lg:top-auto lg:w-96"
              : "hidden",
          )}
        >
          <div className="flex items-center border-b border-dark-700 shrink-0">
            <button
              onClick={() => setSidebarTab("queue")}
              className={cn(
                "flex-1 py-3.5 px-4 text-sm font-medium transition-colors min-h-[44px] touch-manipulation",
                sidebarTab === "queue"
                  ? "text-primary-400 border-b-2 border-primary-400 bg-primary-500/5"
                  : "text-dark-400 hover:text-dark-200 hover:bg-dark-800/50",
              )}
            >
              Queue ({roomState.queue.length})
            </button>
            <button
              onClick={() => setSidebarTab("participants")}
              className={cn(
                "flex-1 py-3.5 px-4 text-sm font-medium transition-colors min-h-[44px] touch-manipulation",
                sidebarTab === "participants"
                  ? "text-primary-400 border-b-2 border-primary-400 bg-primary-500/5"
                  : "text-dark-400 hover:text-dark-200 hover:bg-dark-800/50",
              )}
            >
              People ({participants.length})
            </button>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-3 text-dark-400 hover:text-dark-200 hover:bg-dark-800/50 transition-colors touch-manipulation shrink-0"
              aria-label="Hide panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {sidebarTab === "queue" ? (
              <Queue
                videos={roomState.queue}
                currentVideoId={roomState.currentVideo?.id}
                isHost={isHost}
                autoplay={roomState.autoplay ?? false}
                onSetAutoplay={handleSetAutoplay}
                onShuffle={handleShuffleQueue}
                onClearQueue={handleClearQueue}
                onAddVideo={handleAddVideo}
                onAddPlaylist={handleAddPlaylist}
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
        </aside>

        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="fixed bottom-4 right-4 z-50 min-h-[48px] min-w-[48px] flex items-center justify-center bg-dark-800 border border-dark-600 px-4 py-2.5 rounded-xl text-sm font-medium text-dark-200 hover:text-dark-50 hover:bg-dark-700 transition-colors touch-manipulation shadow-lg"
            aria-label="Show panel"
          >
            Queue & People
          </button>
        )}
        {showSidebar && (
          <div
            className="fixed inset-0 z-20 bg-dark-950/60 backdrop-blur-sm lg:hidden"
            style={{ top: "var(--header-height)" }}
            onClick={() => setShowSidebar(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
};
