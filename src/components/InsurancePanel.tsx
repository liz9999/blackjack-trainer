import React from 'react';

interface InsurancePanelProps {
  isVisible: boolean;
  isEvenMoney: boolean;
  onTakeInsurance: () => void;
  onDeclineInsurance: () => void;
}

export const InsurancePanel: React.FC<InsurancePanelProps> = ({
  isVisible,
  isEvenMoney,
  onTakeInsurance,
  onDeclineInsurance
}) => {
  if (!isVisible) return null;

  return (
    <div className="insurance-panel">
      <div className="insurance-content">
        <h3>{isEvenMoney ? 'Even Money?' : 'Insurance?'}</h3>
        <p>
          {isEvenMoney
            ? 'You have blackjack and dealer shows Ace. Take even money?'
            : 'Dealer shows an Ace. Take insurance?'}
        </p>
        <div className="insurance-buttons">
          <button className="btn primary" onClick={onTakeInsurance}>
            Yes
          </button>
          <button className="btn secondary" onClick={onDeclineInsurance}>
            No
          </button>
        </div>
      </div>
    </div>
  );
};