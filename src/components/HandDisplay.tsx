import React from 'react';
import { Card } from './Card';
import { CardData } from '../types/index.js';

interface HandDisplayProps {
  cards: CardData[];
  value: number | string;
  showFaceDown?: boolean;
  isCurrent?: boolean;
  title: string;
  balance?: number;
  currentBet?: number;
}

export const HandDisplay: React.FC<HandDisplayProps> = ({
  cards,
  value,
  showFaceDown = false,
  isCurrent = false,
  title,
  balance,
  currentBet
}) => {
  return (
    <div className={`player-section ${isCurrent ? 'current-hand' : ''}`}>
      <h3>{title}</h3>
      <div className="player-info">
        <span>Hand Value: <span>{value}</span></span>
        {balance !== undefined && <span>Balance: $<span>{balance}</span></span>}
        {currentBet !== undefined && <span>Current Bet: $<span>{currentBet}</span></span>}
      </div>
      <div className="hand-cards">
        {cards.map((card, index) => {
          const faceDown = showFaceDown && index === 1;
          return (
            <Card
              key={`${card.suit}-${card.rank}-${index}`}
              card={card}
              faceDown={faceDown}
            />
          );
        })}
      </div>
    </div>
  );
};