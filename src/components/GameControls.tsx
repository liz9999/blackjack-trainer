import React from 'react';
import { GameState } from '../types/index.js';

interface GameControlsProps {
  gameState: GameState;
  balance: number;
  currentBet: number;
  canSplit: boolean;
  hasHit: boolean;
  onDealHand: () => void;
  onHit: () => void;
  onStand: () => void;
  onDoubleDown: () => void;
  onSplit: () => void;
  onNewGame: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  balance,
  currentBet,
  canSplit,
  hasHit,
  onDealHand,
  onHit,
  onStand,
  onDoubleDown,
  onSplit,
  onNewGame
}) => {
  const isBetting = gameState === 'betting';
  const isPlaying = gameState === 'playing';

  return (
    <div className="game-controls">
      <div className="primary-actions">
        <button
          className="btn primary large"
          disabled={!isBetting || currentBet === 0}
          onClick={onDealHand}
        >
          Deal Hand
        </button>

        <button
          className="btn secondary"
          disabled={!isPlaying}
          onClick={onHit}
        >
          Hit
        </button>

        <button
          className="btn secondary"
          disabled={!isPlaying}
          onClick={onStand}
        >
          Stand
        </button>

        <button
          className="btn secondary"
          disabled={!isPlaying || balance < currentBet || hasHit}
          onClick={onDoubleDown}
        >
          Double Down
        </button>

        <button
          className="btn secondary"
          disabled={!canSplit || !isPlaying || balance < currentBet}
          onClick={onSplit}
        >
          Split
        </button>
      </div>

      <button
        className="btn secondary"
        onClick={onNewGame}
      >
        New Game
      </button>
    </div>
  );
};