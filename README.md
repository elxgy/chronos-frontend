# chronos Frontend

A React + TypeScript frontend for the chronos synchronized YouTube watching experience.

## Features

- Dark theme with glassmorphism effects
- YouTube video embedding with custom controls
- Real-time synchronization via WebSocket
- Participant management with quality indicators
- Video queue with drag-and-drop reordering
- Clear queue (host-only, with confirmation)
- Autoplay toggle in queue (next video starts automatically when current ends)
- Loop button (replay current video when it ends)
- Responsive design

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Video**: react-youtube (YouTube IFrame API)
- **Icons**: Lucide React
- **State**: React Context + Hooks

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

## Project Structure

```
src/
├── assets/          # Static assets
├── components/      # Reusable components
│   ├── common/      # Button, Input, Card, Modal, ConfirmModal
│   ├── layout/      # Header, MainLayout
│   └── room/        # VideoPlayer, Queue, RoomControls, ParticipantList
├── hooks/           # Custom React hooks (useRoomBootstrap)
├── pages/           # Page components
├── styles/          # Global styles
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest tests

## API Integration

The frontend expects a backend server running at the configured API URL:

- `GET /api/rooms/:code` - Get room state and participants
- `POST /api/rooms` - Create a new room
- `POST /api/rooms/:code/join` - Join an existing room
- `GET /api/rooms/:code/quality` - Get room connection quality

WebSocket at `/ws?roomCode=:code&participantId=:id` for real-time sync. Supports control messages (`play`, `pause`, `seek`, `skip`, `set_autoplay`, `set_loop`), `add_video`, `add_playlist`, `remove_video`, `reorder_queue`, `clear_queue`, and `leave_room`.
