import { useEffect, useReducer, useRef, useCallback } from "react";
import { NavigateFunction } from "react-router-dom";
import { RoomState, Video, Participant } from "@/types";
import { getApiUrl, getWsUrl } from "@/config";

const STORAGE_KEY = "chronos-session";
const FETCH_TIMEOUT_MS = 10000;
const KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000; // ping backend so Render free tier does not spin down while user is in room

type RoomNavigationState = {
  nickname?: string;
  participantId?: string;
  isHost?: boolean;
};

export type RoomSession = {
  participantId: string;
  nickname: string;
  isHost: boolean;
};

export type BootstrapPhase =
  | "initial"
  | "bootstrapping"
  | "ready"
  | "recovering"
  | "fatal";

const initialRoomState: RoomState = {
  currentVideo: null,
  currentTime: 0,
  playbackState: "unstarted",
  skipEpoch: 0,
  stateVersion: 0,
  queue: [],
  participantCount: 1,
  isPlaying: false,
  autoplay: false,
  loop: false,
};

type BootstrapState = {
  phase: BootstrapPhase;
  roomCode: string | null;
  session: RoomSession | null;
  roomState: RoomState;
  participants: Participant[];
  loadError: string;
  roomError: string;
  lastAppliedVersion: number;
};

type BootstrapAction =
  | { type: "BOOTSTRAP_START"; code?: string }
  | {
      type: "BOOTSTRAP_SUCCESS";
      code: string;
      session: RoomSession;
      roomState: RoomState;
      participants: Participant[];
    }
  | { type: "BOOTSTRAP_FATAL"; code?: string; error: string }
  | { type: "WS_CONNECTED" }
  | { type: "WS_DISCONNECTED"; error: string }
  | { type: "SET_ROOM_ERROR"; error: string }
  | { type: "CLEAR_ROOM_ERROR" }
  | { type: "SET_STATE_SYNC"; roomState: RoomState }
  | { type: "SET_PARTICIPANTS"; participants: Participant[] }
  | { type: "PARTICIPANT_JOINED"; participant: Participant }
  | { type: "PARTICIPANT_LEFT"; participantId: string }
  | { type: "SET_QUEUE"; queue: Video[] };

const initialBootstrapState: BootstrapState = {
  phase: "initial",
  roomCode: null,
  session: null,
  roomState: initialRoomState,
  participants: [],
  loadError: "",
  roomError: "",
  lastAppliedVersion: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeNumber(value: unknown, fallback = 0): number {
  if (
    typeof value !== "number" ||
    Number.isNaN(value) ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }
  return value;
}

function safeBool(value: unknown, fallback = false): boolean {
  if (typeof value !== "boolean") return fallback;
  return value;
}

function safeString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value;
}

function normalizeVideo(input: unknown): Video | null {
  if (!isRecord(input)) return null;
  const id = safeString(input.id);
  const title = safeString(input.title) || 'Video';
  if (!id) return null;

  return {
    id,
    title,
    thumbnail: safeString(input.thumbnail),
    duration: Math.max(0, Math.floor(safeNumber(input.duration, 0))),
    addedBy: safeString(input.addedBy),
    addedAt: safeString(input.addedAt),
    addedByName: safeString(input.addedByName),
  };
}

function normalizeParticipants(input: unknown): Participant[] {
  if (!Array.isArray(input)) return [];
  const participants: Participant[] = [];
  for (const candidate of input) {
    if (!isRecord(candidate)) continue;
    const id = safeString(candidate.id);
    const nickname = safeString(candidate.nickname);
    if (!id || !nickname) continue;

    participants.push({
      id,
      nickname,
      joinedAt: safeString(candidate.joinedAt),
      isHost: safeBool(candidate.isHost, false),
      isActive: safeBool(candidate.isActive, false),
      connected: safeBool(candidate.connected, false),
      quality:
        (safeString(candidate.quality, "unknown") as Participant["quality"]) ||
        "unknown",
      latencyMs: safeNumber(candidate.latencyMs, 0),
      lastPingAt: safeString(candidate.lastPingAt),
    });
  }
  return participants;
}

function normalizeRoomSnapshot(
  input: unknown,
  participantCountFallback: number,
): RoomState {
  if (!isRecord(input)) {
    return {
      ...initialRoomState,
      participantCount: participantCountFallback,
    };
  }
  const currentVideo = normalizeVideo(input.currentVideo);
  const queueInput = Array.isArray(input.queue) ? input.queue : [];
  const queue = queueInput
    .map(normalizeVideo)
    .filter((video): video is Video => video !== null);
  const playback = safeString(
    input.playbackState,
    "unstarted",
  ) as RoomState["playbackState"];
  const currentTime = Math.max(0, safeNumber(input.currentTime, 0));
  const isPlaying = safeBool(input.isPlaying, playback === "playing");
  const skipEpoch = Math.max(0, Math.floor(safeNumber(input.skipEpoch, 0)));
  const stateVersion = Math.max(
    0,
    Math.floor(safeNumber(input.stateVersion, 0)),
  );
  const participantCount = Math.max(
    0,
    Math.floor(safeNumber(input.participantCount, participantCountFallback)),
  );
  const autoplay = safeBool(input.autoplay, false);
  const loop = safeBool(input.loop, false);

  return {
    currentVideo,
    currentTime,
    anchorPosition: Math.max(0, safeNumber(input.anchorPosition, currentTime)),
    anchorUpdatedAt: safeString(input.anchorUpdatedAt),
    playbackState: playback,
    skipEpoch,
    stateVersion,
    queue,
    participantCount,
    isPlaying,
    autoplay,
    loop,
  };
}

function bootstrapReducer(
  state: BootstrapState,
  action: BootstrapAction,
): BootstrapState {
  switch (action.type) {
    case "BOOTSTRAP_START": {
      const nextCode = action.code ?? null;
      if (
        state.phase === "ready" &&
        state.roomCode &&
        nextCode &&
        state.roomCode.toUpperCase() === nextCode.toUpperCase()
      ) {
        return state;
      }
      return {
        phase: "bootstrapping",
        roomCode: nextCode,
        session: null,
        roomState: initialRoomState,
        participants: [],
        loadError: "",
        roomError: "",
        lastAppliedVersion: 0,
      };
    }
    case "BOOTSTRAP_SUCCESS":
      return {
        ...state,
        phase: "ready",
        roomCode: action.code,
        session: action.session,
        roomState: action.roomState,
        participants: action.participants,
        loadError: "",
        roomError: "",
        lastAppliedVersion: action.roomState.stateVersion ?? 0,
      };
    case "BOOTSTRAP_FATAL":
      return {
        ...state,
        phase: "fatal",
        roomCode: action.code ?? state.roomCode,
        session: null,
        loadError: action.error,
        roomError: "",
      };
    case "WS_CONNECTED":
      return {
        ...state,
        phase: "ready",
        roomError: "",
      };
    case "WS_DISCONNECTED":
      return {
        ...state,
        phase: state.phase === "ready" ? "recovering" : state.phase,
        roomError: action.error,
      };
    case "SET_ROOM_ERROR":
      return { ...state, roomError: action.error };
    case "CLEAR_ROOM_ERROR":
      return { ...state, roomError: "" };
    case "SET_STATE_SYNC":
      if (action.roomState.stateVersion < state.lastAppliedVersion) {
        return state;
      }
      return {
        ...state,
        roomState: action.roomState,
        lastAppliedVersion: action.roomState.stateVersion,
      };
    case "SET_PARTICIPANTS":
      return {
        ...state,
        participants: action.participants,
        roomState: {
          ...state.roomState,
          participantCount: action.participants.length,
        },
        lastAppliedVersion: state.lastAppliedVersion,
      };
    case "PARTICIPANT_JOINED": {
      if (state.participants.some((p) => p.id === action.participant.id)) {
        return state;
      }
      const participants = [...state.participants, action.participant];
      return {
        ...state,
        participants,
        roomState: {
          ...state.roomState,
          participantCount: participants.length,
        },
        lastAppliedVersion: state.lastAppliedVersion,
      };
    }
    case "PARTICIPANT_LEFT": {
      const participants = state.participants.filter(
        (p) => p.id !== action.participantId,
      );
      return {
        ...state,
        participants,
        roomState: {
          ...state.roomState,
          participantCount: participants.length,
        },
        lastAppliedVersion: state.lastAppliedVersion,
      };
    }
    case "SET_QUEUE":
      return {
        ...state,
        roomState: {
          ...state.roomState,
          queue: action.queue,
        },
        lastAppliedVersion: state.lastAppliedVersion,
      };
    default:
      return state;
  }
}

function resolveSession(
  code: string,
  locationState: unknown,
): RoomSession | null {
  const routeState = (locationState ?? {}) as RoomNavigationState;
  let nickname = routeState.nickname || "";
  let participantId = routeState.participantId || "";
  let host = Boolean(routeState.isHost);

  if (!nickname || !participantId) {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          roomCode?: string;
          nickname?: string;
          participantId?: string;
          isHost?: boolean;
        };
        if ((parsed.roomCode || "").toUpperCase() === code.toUpperCase()) {
          nickname = parsed.nickname || "";
          participantId = parsed.participantId || "";
          host = Boolean(parsed.isHost);
        }
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  if (!nickname || !participantId) return null;

  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        roomCode: code.toUpperCase(),
        participantId,
        isHost: host,
        nickname,
      }),
    );
  } catch {
    return null;
  }

  return { participantId, nickname, isHost: host };
}

export type UseRoomBootstrapResult = {
  phase: BootstrapPhase;
  session: RoomSession | null;
  roomState: RoomState;
  participants: Participant[];
  loadError: string;
  roomError: string;
  sendMessage: (message: Record<string, unknown>) => void;
  handleLeave: () => void;
  wsRef: React.MutableRefObject<WebSocket | null>;
  shouldReconnectRef: React.MutableRefObject<boolean>;
};

export function useRoomBootstrap(
  code: string | undefined,
  locationState: unknown,
  navigate: NavigateFunction,
): UseRoomBootstrapResult {
  const [state, dispatchRaw] = useReducer(
    bootstrapReducer,
    initialBootstrapState,
  );
  const locationStateRef = useRef(locationState);
  locationStateRef.current = locationState;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);
  const connectionSeqRef = useRef(0);
  const reconnectDelayRef = useRef(1000);
  const participantsCountRef = useRef(0);
  const redirectGuardRef = useRef(false);
  const transitionSourceRef = useRef<string>("init");
  const prevStateRef = useRef(state);

  const dispatch = useCallback((action: BootstrapAction, source: string) => {
    transitionSourceRef.current = source;
    dispatchRaw(action);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || import.meta.env.MODE === "test") return;
    const prev = prevStateRef.current;
    const next = state;
    if (prev.phase !== next.phase) {
      console.debug("[room_bootstrap_transition]", {
        source: transitionSourceRef.current,
        prev: prev.phase,
        next: next.phase,
        code: next.roomCode,
      });
    }
    prevStateRef.current = next;
  }, [state]);

  useEffect(() => {
    participantsCountRef.current = state.participants.length;
  }, [state.participants.length]);

  useEffect(() => {
    if (state.phase !== "ready") return;
    const id = window.setInterval(() => {
      fetch(getApiUrl("/health")).catch(() => {}); // keep backend awake on Render free tier
    }, KEEP_ALIVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [state.phase]);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    redirectGuardRef.current = false;
    dispatch({ type: "BOOTSTRAP_START", code }, "bootstrap_start");

    if (!code) {
      if (!redirectGuardRef.current) {
        redirectGuardRef.current = true;
        dispatch(
          { type: "BOOTSTRAP_FATAL", error: "Missing room code" },
          "missing_code",
        );
        navigateRef.current("/");
      }
      return;
    }

    const resolved = resolveSession(code, locationStateRef.current);
    if (!resolved) {
      if (!redirectGuardRef.current) {
        redirectGuardRef.current = true;
        dispatch(
          {
            type: "BOOTSTRAP_FATAL",
            code,
            error: "Session not found. Please join the room again.",
          },
          "session_missing",
        );
        navigateRef.current("/");
      }
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      FETCH_TIMEOUT_MS,
    );

    fetch(getApiUrl(`/api/rooms/${code}`), { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) {
          let errorMessage = "Failed to load room";
          try {
            const body = await r.json();
            if (body?.error) errorMessage = body.error;
          } catch {
            if (r.status >= 500) errorMessage = "Server unavailable. Please try again later.";
          }
          throw new Error(errorMessage);
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const nextParticipants = normalizeParticipants(data.participants);
        const nextState = normalizeRoomSnapshot(
          data.state,
          nextParticipants.length,
        );
        dispatch(
          {
            type: "BOOTSTRAP_SUCCESS",
            code,
            session: resolved,
            roomState: nextState,
            participants: nextParticipants,
          },
          "fetch_ok",
        );
      })
      .catch((err) => {
        if (cancelled) return;
        let message = "Failed to load room";
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            message = "Room startup timed out. Please try rejoining.";
          } else {
            message = err.message;
          }
        }
        dispatch(
          { type: "BOOTSTRAP_FATAL", code, error: message },
          "fetch_fail",
        );
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [code, dispatch]);

  useEffect(() => {
    if (
      (state.phase !== "ready" && state.phase !== "recovering") ||
      !state.session ||
      !code
    )
      return;

    const handleMessage = (message: Record<string, unknown>) => {
      switch (message.type) {
        case "state_sync": {
          const sync = normalizeRoomSnapshot(
            message,
            participantsCountRef.current,
          );
          dispatch(
            { type: "SET_STATE_SYNC", roomState: sync },
            "ws_state_sync",
          );
          break;
        }

        case "participant_joined": {
          const payload = isRecord(message) ? message.participant : null;
          const participant = normalizeParticipants(
            payload ? [payload] : [],
          )[0];
          if (participant) {
            dispatch(
              { type: "PARTICIPANT_JOINED", participant },
              "ws_participant_joined",
            );
          }
          break;
        }
        case "participant_left": {
          const payload = isRecord(message) ? message.participant : null;
          const participantId = isRecord(payload) ? safeString(payload.id) : "";
          if (participantId) {
            dispatch(
              { type: "PARTICIPANT_LEFT", participantId },
              "ws_participant_left",
            );
          }
          break;
        }

        case "queue_updated": {
          const queuePayload = isRecord(message) ? message.queue : [];
          const queue = Array.isArray(queuePayload)
            ? queuePayload
                .map(normalizeVideo)
                .filter((video): video is Video => video !== null)
            : [];
          dispatch({ type: "SET_QUEUE", queue }, "ws_queue_updated");
          break;
        }

        case "error": {
          const err = message as { code?: string; message?: string };
          dispatch(
            {
              type: "SET_ROOM_ERROR",
              error: err.message || err.code || "Unexpected room error",
            },
            "ws_error",
          );
          break;
        }

        case "ws_connected": {
          const payload = message as {
            participants?: unknown;
            currentState?: unknown;
          };
          if (payload.participants) {
            const nextParticipants = normalizeParticipants(
              payload.participants,
            );
            dispatch(
              { type: "SET_PARTICIPANTS", participants: nextParticipants },
              "ws_connected_participants",
            );
          }
          if (payload.currentState) {
            const nextRoomState = normalizeRoomSnapshot(
              payload.currentState,
              participantsCountRef.current,
            );
            dispatch(
              { type: "SET_STATE_SYNC", roomState: nextRoomState },
              "ws_connected_state",
            );
          }
          dispatch({ type: "WS_CONNECTED" }, "ws_connected");
          break;
        }
      }
    };

    const activeSession = state.session;
    if (!activeSession) return;

    shouldReconnectRef.current = true;
    reconnectDelayRef.current = 1000;

    const connect = () => {
      if (!shouldReconnectRef.current) return;
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      const seq = ++connectionSeqRef.current;
      const wsUrl = getWsUrl("/ws", {
        roomCode: code,
        participantId: activeSession.participantId,
      });
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (seq !== connectionSeqRef.current) return;
        reconnectDelayRef.current = 1000;
        dispatch({ type: "WS_CONNECTED" }, "ws_open");
        socket.send(JSON.stringify({ type: "get_state", payload: {} }));
      };

      socket.onmessage = (event) => {
        if (seq !== connectionSeqRef.current) return;
        try {
          if (!event.data || typeof event.data !== "string") return;
          const message = JSON.parse(event.data) as Record<string, unknown>;
          if (message.type === "error") {
            const err = message as { code?: string; message?: string };
            dispatch(
              {
                type: "SET_ROOM_ERROR",
                error: err.message || err.code || "Unexpected room error",
              },
              "ws_message_error",
            );
            return;
          }
          handleMessage(message);
        } catch {
          dispatch(
            {
              type: "SET_ROOM_ERROR",
              error: "Invalid realtime message received",
            },
            "ws_parse_error",
          );
        }
      };

      socket.onerror = () => {
        if (seq !== connectionSeqRef.current) return;
        dispatch(
          { type: "WS_DISCONNECTED", error: "Realtime connection error" },
          "ws_error_event",
        );
      };

      socket.onclose = () => {
        if (seq !== connectionSeqRef.current) return;
        if (wsRef.current === socket) wsRef.current = null;
        if (!shouldReconnectRef.current) return;
        dispatch(
          {
            type: "WS_DISCONNECTED",
            error: "Realtime disconnected, reconnecting...",
          },
          "ws_close",
        );
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectDelayRef.current = Math.min(
            reconnectDelayRef.current * 2,
            8000,
          );
          connect();
        }, reconnectDelayRef.current);
      };

      wsRef.current = socket;
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;
      connectionSeqRef.current += 1;
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (
        wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, [state.phase, state.session, code, dispatch]);

  const handleLeave = useCallback(() => {
    shouldReconnectRef.current = false;
    sendMessage({ type: "leave_room" });
    sessionStorage.removeItem(STORAGE_KEY);
    wsRef.current?.close();
    navigateRef.current("/");
  }, [sendMessage]);

  return {
    phase: state.phase,
    session: state.session,
    roomState: state.roomState,
    participants: state.participants,
    loadError: state.loadError,
    roomError: state.roomError,
    sendMessage,
    handleLeave,
    wsRef,
    shouldReconnectRef,
  };
}
