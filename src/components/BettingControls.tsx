import React, { useState } from 'react';
import { gameStore } from '../store.js';

interface BettingControlsProps {
  balance: number;
  currentBet: number;
  isBetting: boolean;
}

export const BettingControls: React.FC<BettingControlsProps> = ({
  balance,
  currentBet,
  isBetting
}) => {
  const [customBetInput, setCustomBetInput] = useState('');

  const placeBet = (amount: number) => {
    const state = gameStore.getState();
    if (state.state !== 'betting' || state.balance < amount) return;

    gameStore.setState({
      currentBet: amount,
      lastBet: amount
    });
  };

  const setCustomBet = () => {
    const state = gameStore.getState();
    if (state.state !== 'betting') return;

    const amount = parseInt(customBetInput);
    if (isNaN(amount) || amount < 1 || amount > state.balance) {
      gameStore.setMessage('Invalid bet amount!');
      return;
    }

    gameStore.setState({
      currentBet: amount,
      lastBet: amount
    });

    setCustomBetInput('');
  };

  const clearBet = () => {
    const state = gameStore.getState();
    if (state.state !== 'betting') return;

    gameStore.setState({ currentBet: 0 });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setCustomBet();
    }
  };

  const betAmounts = [25, 50, 100];

  return (
    <div className="betting-section">
      <h4>Betting</h4>
      <div className="betting-controls">
        <div className="bet-buttons">
          {betAmounts.map(amount => (
            <button
              key={amount}
              className={`btn bet-btn ${currentBet === amount ? 'selected' : ''}`}
              disabled={!isBetting || balance < amount}
              onClick={() => placeBet(amount)}
            >
              ${amount}
            </button>
          ))}
        </div>
        <div className="bet-input-row">
          <input
            type="number"
            className="custom-bet-input"
            min="1"
            max={balance}
            placeholder="Custom bet"
            value={customBetInput}
            onChange={(e) => setCustomBetInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isBetting}
          />
          <button
            className="btn secondary"
            onClick={setCustomBet}
            disabled={!isBetting}
          >
            Set
          </button>
        </div>
        <button
          className="btn secondary"
          onClick={clearBet}
          disabled={!isBetting}
        >
          Clear Bet
        </button>
      </div>
    </div>
  );
};