import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/Home';
import { CreateRoomPage } from './pages/CreateRoom';
import { JoinRoomPage } from './pages/JoinRoom';
import { RoomPage } from './pages/Room';

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('chronos-theme') || 'dark-blue';
    document.documentElement.className = `dark theme-${theme}`;
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateRoomPage />} />
        <Route path="/join/:code" element={<JoinRoomPage />} />
        <Route path="/room/:code" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
