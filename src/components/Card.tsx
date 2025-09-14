import React from 'react';
import { CardData } from '../types/index.js';

interface CardProps {
  card: CardData;
  faceDown?: boolean;
  small?: boolean;
}

export const Card: React.FC<CardProps> = ({ card, faceDown = false, small = false }) => {
  const colorClass = card.isRed ? 'red' : 'black';
  const sizeClass = small ? 'small' : '';

  if (faceDown) {
    return (
      <div className={`card face-down ${sizeClass}`}>
        <div className="card-content">🂠</div>
      </div>
    );
  }

  return (
    <div className={`card ${colorClass} ${sizeClass}`}>
      <div className="card-content">
        <div className="card-rank">{card.rank}</div>
        <div className="card-suit">{card.suit}</div>
      </div>
    </div>
  );
};