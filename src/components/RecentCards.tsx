import React from 'react';
import { Card } from './Card';
import { CardData } from '../types/index.js';

interface RecentCardsProps {
  recentCards: CardData[];
  onClearRecent: () => void;
}

export const RecentCards: React.FC<RecentCardsProps> = ({
  recentCards,
  onClearRecent
}) => {
  return (
    <div className="recent-cards-section">
      <h3>Recently Played Cards</h3>
      <div className="recent-cards-container">
        {recentCards.map((card, index) => (
          <Card
            key={`recent-${card.suit}-${card.rank}-${index}`}
            card={card}
            small={true}
          />
        ))}
      </div>
      <button className="btn secondary small" onClick={onClearRecent}>
        Clear
      </button>
    </div>
  );
};