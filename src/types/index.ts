export type RoomCode = string;
export type UserID = string;
export type VideoID = string;

export interface Video {
  id: VideoID;
  title: string;
  thumbnail: string;
  duration: number;
  addedBy: UserID;
  addedAt: string;
  addedByName: string;
}

export interface Participant {
  id: UserID;
  nickname: string;
  joinedAt: string;
  isHost: boolean;
  isActive: boolean;
  connected: boolean;
  quality: ConnectionQuality;
  latencyMs: number;
  lastPingAt: string;
}

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export type PlaybackState = 'unstarted' | 'playing' | 'paused' | 'ended';

export interface RoomState {
  currentVideo: Video | null;
  currentTime: number;
  anchorPosition?: number;
  anchorUpdatedAt?: string;
  playbackState: PlaybackState;
  skipEpoch: number;
  stateVersion: number;
  queue: Video[];
  participantCount: number;
  isPlaying: boolean;
}

export interface ClientQuality {
  userId: UserID;
  nickname: string;
  latencyMs: number;
  jitterMs: number;
  packetLossPercent: number;
  quality: ConnectionQuality;
  lastPingAt: string;
  isConnected: boolean;
}

export interface RoomQualityMessage {
  type: 'room_quality';
  roomCode: RoomCode;
  participants: ClientQuality[];
  averageLatencyMs: number;
}

export interface CreateRoomRequest {
  nickname: string;
}

export interface CreateRoomResponse {
  roomCode: RoomCode;
  participantId: UserID;
  isHost: boolean;
}

export interface JoinRoomRequest {
  roomCode: RoomCode;
  nickname: string;
}

export interface JoinRoomResponse {
  success: boolean;
  roomCode: RoomCode;
  participantId: UserID;
  currentState: RoomState;
  participants: Participant[];
  error?: string;
}

export interface ControlMessage {
  type: ControlType;
  userId: UserID;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export type ControlType = 'play' | 'pause' | 'seek' | 'skip' | 'add_video' | 'remove_video' | 'reorder';

export interface WSMessage {
  type: string;
  payload?: Record<string, unknown>;
}

export interface SyncStateMessage {
  type: 'state_sync';
  currentVideo: Video | null;
  currentTime: number;
  isPlaying: boolean;
  playbackState: PlaybackState;
  skipEpoch: number;
  stateVersion: number;
  timestamp: string;
  queue: Video[];
}

export interface AddVideoPayload {
  videoId: VideoID;
}

export interface SeekPayload {
  targetTime: number;
}

export interface ReorderPayload {
  fromIndex: number;
  toIndex: number;
}

export interface ErrorMessage {
  type: 'error';
  code: string;
  message: string;
}

export interface ParticipantEvent {
  type: 'participant_joined' | 'participant_left';
  participant: Participant;
}

export interface QueueUpdateEvent {
  type: 'queue_updated';
  queue: Video[];
}
