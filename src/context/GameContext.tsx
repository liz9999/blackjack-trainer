import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { GameStateData } from '../types/index.js';
import { gameStore } from '../store.js';

interface GameContextType {
  gameState: GameStateData;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameState = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, setGameState] = useState<GameStateData>(gameStore.getState());

  useEffect(() => {
    const unsubscribe = gameStore.subscribe((state) => {
      setGameState(state);
    });

    return unsubscribe;
  }, []);

  const value: GameContextType = {
    gameState
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};