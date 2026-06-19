import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";
import { cn } from "@/utils/helpers";
import { ChatMessage } from "@/types";

interface ChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
}

const nicknameColors = [
  "text-purple-400",
  "text-cyan-400",
  "text-amber-400",
  "text-blue-400",
  "text-pink-400",
  "text-teal-400",
];

function getNicknameColor(nickname: string): string {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  return nicknameColors[Math.abs(hash) % nicknameColors.length];
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  currentUserId,
  onSendMessage,
}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-theme-hover/80 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-theme-muted" />
            </div>
            <p className="text-theme-secondary font-medium text-sm">No messages yet</p>
            <p className="text-theme-secondary text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.messageId}
              className={cn(
                "animate-fade-in",
                msg.userId === currentUserId && "flex flex-col items-end"
              )}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    getNicknameColor(msg.nickname)
                  )}
                >
                  {msg.nickname}
                </span>
                <span className="text-xs text-theme-muted">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <p className="text-sm text-theme-secondary mt-0.5 break-words max-w-full">
                {msg.text}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t-2 border-theme">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 bg-theme-elevated border border-theme rounded-lg px-3 py-2 text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/50 focus:border-theme-accent"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              "p-2 rounded-lg transition-all duration-200",
              input.trim()
                ? "bg-theme-accent hover:bg-theme-accent text-on-accent"
                : "bg-theme-hover text-theme-muted cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
