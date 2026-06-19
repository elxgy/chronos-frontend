import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { Button, Input, Card } from "@/components/common";
import { AuthLayout } from "@/components/layout";
import { getApiUrl } from "@/config";

export const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState(code || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("Please enter a nickname");
      return;
    }
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        getApiUrl(`/api/rooms/${roomCode.toUpperCase()}/join`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nickname }),
        },
      );

      if (!response.ok) {
        let errorMessage = "Failed to join room";
        try {
          const data = await response.json();
          if (data?.error) errorMessage = data.error;
        } catch {
          if (response.status >= 500) {
            errorMessage = "Server unavailable. Please try again later.";
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const normalizedCode = roomCode.toUpperCase();
      sessionStorage.setItem(
        "chronos-session",
        JSON.stringify({
          roomCode: normalizedCode,
          participantId: data.participantId,
          isHost: false,
          nickname,
        }),
      );
      navigate(`/room/${normalizedCode}`, {
        state: {
          participantId: data.participantId,
          isHost: false,
          nickname,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-theme-hover hover:brightness-125 active:scale-90 text-theme-muted hover:text-theme-secondary transition-all duration-150"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-theme-primary">Join Room</h1>
            <p className="text-sm text-theme-secondary">Enter the room code to join</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Room Code"
            placeholder="ABC123"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(e.target.value.toUpperCase().slice(0, 6))
            }
            className="font-mono text-center tracking-widest text-lg min-h-[48px]"
            maxLength={6}
            error={error && !nickname ? "" : error}
          />

          <Input
            label="Your Nickname"
            placeholder="Enter your nickname"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError("");
            }}
            error={nickname ? error : ""}
            leftIcon={<User className="w-5 h-5" />}
            maxLength={20}
            className="min-h-[48px]"
          />

          <div className="flex gap-3 sm:gap-4">
            <Button
              variant="secondary"
              onClick={() => navigate("/")}
              className="flex-1 min-h-[48px] touch-manipulation"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={!roomCode || !nickname}
              className="flex-1 min-h-[48px] touch-manipulation"
            >
              Join Room
            </Button>
          </div>
        </form>
      </Card>
    </AuthLayout>
  );
};
