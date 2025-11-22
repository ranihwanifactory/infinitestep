import React from 'react';
import { GameContainer } from './components/GameContainer';

function App() {
  return (
    <div className="w-full min-h-screen bg-black text-slate-200 overflow-hidden select-none">
      <GameContainer />
    </div>
  );
}

export default App;