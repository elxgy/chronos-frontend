# chronos Frontend

A React + TypeScript frontend for the chronos synchronized YouTube watching experience.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Video**: react-youtube (YouTube IFrame API)
- **Icons**: Lucide React
- **State**: React Context + Hooks

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
