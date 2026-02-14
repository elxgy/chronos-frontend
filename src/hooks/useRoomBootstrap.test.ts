import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRoomBootstrap } from './useRoomBootstrap';

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.CONNECTING;
  onopen: ((this: WebSocket, ev: Event) => unknown) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => unknown) | null = null;
  onerror: ((this: WebSocket, ev: Event) => unknown) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => unknown) | null = null;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.call(this as unknown as WebSocket, {} as CloseEvent);
  });

  constructor(_url: string) {
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.call(this as unknown as WebSocket, new Event('open'));
    });
  }
}

describe('useRoomBootstrap', () => {
  beforeEach(() => {
    sessionStorage.clear();
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('bootstraps to ready for valid session and room payload', async () => {
    const navigate = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          state: {
            currentVideo: null,
            currentTime: 12,
            playbackState: 'paused',
            queue: [],
            participantCount: 1,
            isPlaying: false,
          },
          participants: [
            {
              id: 'p1',
              nickname: 'Host',
              joinedAt: new Date().toISOString(),
              isHost: true,
              isActive: true,
              connected: true,
              quality: 'unknown',
              latencyMs: 0,
              lastPingAt: new Date().toISOString(),
            },
          ],
        }),
      })
    );

    const { result } = renderHook(() =>
      useRoomBootstrap('ABC123', { participantId: 'p1', nickname: 'Host', isHost: true }, navigate)
    );

    await waitFor(() => {
      expect(result.current.phase).toBe('ready');
    });

    expect(result.current.session?.participantId).toBe('p1');
    expect(result.current.participants).toHaveLength(1);
    expect(result.current.roomState.currentTime).toBe(12);
    expect(fetch).toHaveBeenCalledWith('/api/rooms/ABC123', expect.any(Object));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('fails fast when session is missing and navigates home', async () => {
    const navigate = vi.fn();
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useRoomBootstrap('ABC123', null, navigate));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/');
    });

    expect(result.current.phase).toBe('fatal');
    expect(result.current.loadError).toContain('Session not found');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('normalizes malformed room payload into safe defaults', async () => {
    const navigate = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          state: {
            currentVideo: { id: 1 },
            currentTime: 'bad',
            playbackState: 42,
            queue: [{ id: 'only-id' }],
            participantCount: 'x',
            isPlaying: 'true',
          },
          participants: [{ foo: 'bar' }, { id: 'p2', nickname: 'Joiner' }],
        }),
      })
    );

    const { result } = renderHook(() =>
      useRoomBootstrap('ZZ9999', { participantId: 'p2', nickname: 'Joiner', isHost: false }, navigate)
    );

    await waitFor(() => {
      expect(result.current.phase).toBe('ready');
    });

    expect(result.current.participants).toHaveLength(1);
    expect(result.current.roomState.queue).toHaveLength(0);
    expect(result.current.roomState.currentTime).toBe(0);
    expect(result.current.roomState.participantCount).toBe(1);
  });

  it('ignores stale state_sync updates using stateVersion', async () => {
    const navigate = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          state: {
            currentVideo: null,
            currentTime: 5,
            playbackState: 'paused',
            skipEpoch: 0,
            stateVersion: 2,
            queue: [],
            participantCount: 1,
            isPlaying: false,
          },
          participants: [
            {
              id: 'p1',
              nickname: 'Host',
            },
          ],
        }),
      })
    );

    const { result } = renderHook(() =>
      useRoomBootstrap('ABC123', { participantId: 'p1', nickname: 'Host', isHost: true }, navigate)
    );

    await waitFor(() => {
      expect(result.current.phase).toBe('ready');
      expect(MockWebSocket.instances.length).toBeGreaterThan(0);
    });

    const socket = MockWebSocket.instances[0];
    socket.onmessage?.call(socket as unknown as WebSocket, {
      data: JSON.stringify({
        type: 'state_sync',
        currentVideo: null,
        currentTime: 30,
        playbackState: 'paused',
        skipEpoch: 0,
        stateVersion: 5,
        queue: [],
        participantCount: 1,
        isPlaying: false,
      }),
    } as MessageEvent);

    await waitFor(() => {
      expect(result.current.roomState.currentTime).toBe(30);
      expect(result.current.roomState.stateVersion).toBe(5);
    });

    socket.onmessage?.call(socket as unknown as WebSocket, {
      data: JSON.stringify({
        type: 'state_sync',
        currentVideo: null,
        currentTime: 10,
        playbackState: 'paused',
        skipEpoch: 0,
        stateVersion: 4,
        queue: [],
        participantCount: 1,
        isPlaying: false,
      }),
    } as MessageEvent);

    await waitFor(() => {
      expect(result.current.roomState.currentTime).toBe(30);
      expect(result.current.roomState.stateVersion).toBe(5);
    });
  });
});
