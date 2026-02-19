import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, ArrowLeft, Sparkles } from "lucide-react";
import { Button, Input, Card } from "@/components/common";
import { AuthLayout } from "@/components/layout";
import { getApiUrl } from "@/config";

export const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("Please enter a nickname");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(getApiUrl("/api/rooms"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create room";
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
      const normalizedCode = String(data.roomCode || "").toUpperCase();
      sessionStorage.setItem(
        "chronos-session",
        JSON.stringify({
          roomCode: normalizedCode,
          participantId: data.participantId,
          isHost: true,
          nickname,
        }),
      );
      navigate(`/room/${normalizedCode}`, {
        state: {
          participantId: data.participantId,
          isHost: true,
          nickname,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-dark-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-dark-100">Create Room</h1>
            <p className="text-sm text-dark-400">
              Set up your profile to get started
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>

          <Input
            label="Your Nickname"
            placeholder="Enter a fun nickname"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError("");
            }}
            error={error}
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
              className="flex-1 min-h-[48px] touch-manipulation"
            >
              Create & Join
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-dark-700">
          <div className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <span className="text-primary-400 font-semibold">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-dark-200">Room Host</p>
              <p className="text-xs text-dark-400">
                You'll control playback for everyone
              </p>
            </div>
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
};
