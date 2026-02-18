import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoomPage } from './RoomPage';
import type { UseRoomBootstrapResult } from '@/hooks/useRoomBootstrap';
import type { RoomState } from '@/types';

vi.mock('@/hooks/useRoomBootstrap', () => ({
  useRoomBootstrap: vi.fn(),
}));

import { useRoomBootstrap } from '@/hooks/useRoomBootstrap';

const mockUseRoomBootstrap = vi.mocked(useRoomBootstrap);

const baseRoomState: RoomState = {
  currentVideo: null,
  currentTime: 0,
  playbackState: 'unstarted',
  skipEpoch: 0,
  stateVersion: 0,
  queue: [],
  participantCount: 1,
  isPlaying: false,
  autoplay: false,
  loop: false,
};

function buildHookResult(overrides: Partial<UseRoomBootstrapResult>): UseRoomBootstrapResult {
  return {
    phase: 'ready',
    session: {
      participantId: 'p1',
      nickname: 'Host',
      isHost: true,
    },
    roomState: baseRoomState,
    participants: [],
    loadError: '',
    roomError: '',
    sendMessage: vi.fn(),
    handleLeave: vi.fn(),
    wsRef: { current: null },
    shouldReconnectRef: { current: true },
    ...overrides,
  };
}

function renderRoomPage(initialPath = '/room/ABC123') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/room/:code" element={<RoomPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RoomPage', () => {
  beforeEach(() => {
    mockUseRoomBootstrap.mockReset();
  });

  it('renders deterministic loading branch during bootstrapping', () => {
    mockUseRoomBootstrap.mockReturnValue(
      buildHookResult({
        phase: 'bootstrapping',
      })
    );

    renderRoomPage();

    expect(screen.getByText('Connecting to room...')).toBeInTheDocument();
  });

  it('renders fatal branch with room load error', () => {
    mockUseRoomBootstrap.mockReturnValue(
      buildHookResult({
        phase: 'fatal',
        loadError: 'Room startup timed out. Please try rejoining.',
      })
    );

    renderRoomPage();

    expect(screen.getByText('Room startup timed out. Please try rejoining.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to home' })).toBeInTheDocument();
  });

  it('renders reconnecting banner when in recovering phase', () => {
    mockUseRoomBootstrap.mockReturnValue(
      buildHookResult({
        phase: 'recovering',
      })
    );

    renderRoomPage();

    expect(screen.getByText('Realtime disconnected, reconnecting...')).toBeInTheDocument();
  });

  it('sends clear_queue when host confirms clear', async () => {
    const sendMessage = vi.fn();
    mockUseRoomBootstrap.mockReturnValue(
      buildHookResult({
        phase: 'ready',
        sendMessage,
        roomState: {
          ...baseRoomState,
          queue: [
            {
              id: 'v1',
              title: 'Video 1',
              thumbnail: '',
              duration: 60,
              addedBy: 'p1',
              addedAt: '',
              addedByName: 'Host',
            },
          ],
        },
      })
    );

    renderRoomPage();

    const showPanelButtons = screen.getAllByRole('button', { name: 'Show panel' });
    fireEvent.click(showPanelButtons[showPanelButtons.length - 1]);
    fireEvent.click(screen.getByRole('button', { name: 'Clear queue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(sendMessage).toHaveBeenCalledWith({ type: 'clear_queue', payload: {} });
  });
});
