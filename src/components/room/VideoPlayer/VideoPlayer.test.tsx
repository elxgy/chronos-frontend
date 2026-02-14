import { useEffect } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VideoPlayer } from './VideoPlayer';

const mockPlayer = {
  getCurrentTime: vi.fn(() => 0),
  seekTo: vi.fn(),
  playVideo: vi.fn(),
  pauseVideo: vi.fn(),
  setVolume: vi.fn(),
  mute: vi.fn(),
  unMute: vi.fn(),
};

vi.mock('react-youtube', () => ({
  default: ({ onReady, onStateChange }: { onReady?: (event: { target: unknown }) => void; onStateChange?: (event: number) => void }) => {
    useEffect(() => {
      onReady?.({ target: mockPlayer });
    }, [onReady]);

    return (
      <button data-testid="youtube-player" onClick={() => onStateChange?.(5)}>
        youtube
      </button>
    );
  },
}));

describe('VideoPlayer', () => {
  beforeEach(() => {
    mockPlayer.getCurrentTime.mockReset();
    mockPlayer.getCurrentTime.mockReturnValue(0);
    mockPlayer.seekTo.mockReset();
    mockPlayer.playVideo.mockReset();
    mockPlayer.pauseVideo.mockReset();
    mockPlayer.setVolume.mockReset();
    mockPlayer.mute.mockReset();
    mockPlayer.unMute.mockReset();
  });

  it('does not allow non-host click overlay to trigger play', () => {
    const onPlay = vi.fn();

    render(
      <VideoPlayer
        video={{
          id: 'abc123def45',
          title: 'Video',
          thumbnail: '',
          duration: 120,
          addedBy: 'u1',
          addedAt: new Date().toISOString(),
          addedByName: 'Host',
        }}
        currentTime={0}
        stateVersion={1}
        isPlaying={false}
        isHost={false}
        onReady={vi.fn()}
        onStateChange={vi.fn()}
        onSeek={vi.fn()}
        onSkip={vi.fn()}
        onPlay={onPlay}
        onPause={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Play video' }));
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('applies final paused authoritative state after rapid skip transition', async () => {
    mockPlayer.getCurrentTime.mockReturnValue(12);
    const { rerender } = render(
      <VideoPlayer
        video={{
          id: 'video0000001',
          title: 'Video A',
          thumbnail: '',
          duration: 120,
          addedBy: 'u1',
          addedAt: new Date().toISOString(),
          addedByName: 'Host',
        }}
        currentTime={20}
        stateVersion={5}
        isPlaying={true}
        isHost={true}
        onReady={vi.fn()}
        onStateChange={vi.fn()}
        onSeek={vi.fn()}
        onSkip={vi.fn()}
        onPlay={vi.fn()}
        onPause={vi.fn()}
      />
    );

    rerender(
      <VideoPlayer
        video={{
          id: 'video0000002',
          title: 'Video B',
          thumbnail: '',
          duration: 140,
          addedBy: 'u1',
          addedAt: new Date().toISOString(),
          addedByName: 'Host',
        }}
        currentTime={0}
        stateVersion={6}
        isPlaying={false}
        isHost={true}
        onReady={vi.fn()}
        onStateChange={vi.fn()}
        onSeek={vi.fn()}
        onSkip={vi.fn()}
        onPlay={vi.fn()}
        onPause={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(mockPlayer.seekTo).toHaveBeenCalledWith(0, true);
      expect(mockPlayer.pauseVideo).toHaveBeenCalled();
    });
  });

  it('re-applies authoritative transition after player state events', async () => {
    render(
      <VideoPlayer
        video={{
          id: 'video0000003',
          title: 'Video C',
          thumbnail: '',
          duration: 160,
          addedBy: 'u1',
          addedAt: new Date().toISOString(),
          addedByName: 'Host',
        }}
        currentTime={10}
        stateVersion={9}
        isPlaying={false}
        isHost={true}
        onReady={vi.fn()}
        onStateChange={vi.fn()}
        onSeek={vi.fn()}
        onSkip={vi.fn()}
        onPlay={vi.fn()}
        onPause={vi.fn()}
      />
    );

    mockPlayer.pauseVideo.mockClear();
    fireEvent.click(screen.getAllByTestId('youtube-player')[0]);

    await waitFor(() => {
      expect(mockPlayer.pauseVideo).toHaveBeenCalled();
    });
  });

  it('seeks locally immediately when host commits timeline seek', async () => {
    const onSeek = vi.fn();
    const { container } = render(
      <VideoPlayer
        video={{
          id: 'video0000004',
          title: 'Video D',
          thumbnail: '',
          duration: 200,
          addedBy: 'u1',
          addedAt: new Date().toISOString(),
          addedByName: 'Host',
        }}
        currentTime={10}
        stateVersion={10}
        isPlaying={true}
        isHost={true}
        onReady={vi.fn()}
        onStateChange={vi.fn()}
        onSeek={onSeek}
        onSkip={vi.fn()}
        onPlay={vi.fn()}
        onPause={vi.fn()}
      />
    );

    const slider = container.querySelector('input[type="range"]') as HTMLInputElement | null;
    expect(slider).not.toBeNull();
    if (!slider) {
      return;
    }
    fireEvent.change(slider, { target: { value: '42' } });
    fireEvent.mouseUp(slider);

    await waitFor(() => {
      expect(mockPlayer.seekTo).toHaveBeenCalledWith(42, true);
      expect(onSeek).toHaveBeenCalledWith(42);
    });
  });
});
