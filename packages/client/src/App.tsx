import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import SingleSetup from './pages/SinglePlayer/SingleSetup';
import SingleGame from './pages/SinglePlayer/SingleGame';
import OnlineLobby from './pages/Online/OnlineLobby';
import OnlineGame from './pages/Online/OnlineGame';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/single/setup" element={<SingleSetup />} />
        <Route path="/single/game" element={<SingleGame />} />
        <Route path="/online" element={<OnlineLobby />} />
        <Route path="/online/game" element={<OnlineGame />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
