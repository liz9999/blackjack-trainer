import React from 'react';
import { GameStats } from '../types/index.js';

interface StatsDisplayProps {
  stats: GameStats;
  balance: number;
  currentBet: number;
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({
  stats,
  balance,
  currentBet
}) => {
  return (
    <div className="stats-section">
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Running Count</h4>
          <div className="stat-value">{stats.runningCount}</div>
        </div>
        <div className="stat-card">
          <h4>True Count</h4>
          <div className="stat-value">{stats.trueCount}</div>
        </div>
        <div className="stat-card">
          <h4>Decks Remaining</h4>
          <div className="stat-value">{stats.decksRemaining.toFixed(1)}</div>
        </div>
        <div className="stat-card">
          <h4>Cards Remaining</h4>
          <div className="stat-value">{stats.cardsRemaining}</div>
        </div>
        <div className="stat-card">
          <h4>Hands Won</h4>
          <div className="stat-value">{stats.handsWon}</div>
        </div>
        <div className="stat-card">
          <h4>Total Hands</h4>
          <div className="stat-value">{stats.totalHands}</div>
        </div>
        <div className="stat-card">
          <h4>Win Rate</h4>
          <div className="stat-value">{stats.winRate}%</div>
        </div>
      </div>
    </div>
  );
};