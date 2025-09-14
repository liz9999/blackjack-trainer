import React, { useState, useEffect } from 'react';
import { GameProvider, useGameState } from './context/GameContext';
import { HandDisplay } from './components/HandDisplay';
import { BettingControls } from './components/BettingControls';
import { GameControls } from './components/GameControls';
import { StatsDisplay } from './components/StatsDisplay';
import { RecentCards } from './components/RecentCards';
import { InsurancePanel } from './components/InsurancePanel';
import { gameStore } from './store.js';
import { Deck, Hand } from './game/index.js';
import './styles.scss';

const GameContent: React.FC = () => {
  const { gameState } = useGameState();
  const [deck] = useState(() => new Deck(6));
  const [playerHand] = useState(() => new Hand());
  const [dealerHand] = useState(() => new Hand());
  const [splitHand, setSplitHand] = useState<Hand | undefined>();
  const [currentHand, setCurrentHand] = useState<'main' | 'split'>('main');
  const [canSplit, setCanSplit] = useState(false);
  const [hasHit, setHasHit] = useState({ main: false, split: false });
  const [insuranceBet, setInsuranceBet] = useState(0);
  const [showInsurance, setShowInsurance] = useState(false);
  const [isEvenMoney, setIsEvenMoney] = useState(false);
  const [deckCount, setDeckCount] = useState(6);

  useEffect(() => {
    gameStore.setState({
      currentBet: 25,
      lastBet: 25,
      stats: {
        ...gameStore.getState().stats,
        cardsRemaining: deck.getCardsRemaining(),
        decksRemaining: deck.getDecksRemaining()
      }
    });
  }, [deck]);

  const dealHand = () => {
    const state = gameStore.getState();
    if (state.state !== 'betting' || state.currentBet === 0) {
      gameStore.setMessage('Please place a bet first!');
      return;
    }

    gameStore.setState({
      balance: state.balance - state.currentBet,
      state: 'playing'
    });

    playerHand.clear();
    dealerHand.clear();
    setSplitHand(undefined);
    setCurrentHand('main');
    setCanSplit(false);
    setHasHit({ main: false, split: false });
    setInsuranceBet(0);
    setShowInsurance(false);

    // Deal initial cards
    dealCardToPlayer();
    dealCardToDealer();
    dealCardToPlayer();
    dealCardToDealer(true);

    // Check for split possibility
    const playerCards = playerHand.getCards();
    if (playerCards.length === 2 && playerCards[0].rank === playerCards[1].rank) {
      setCanSplit(true);
    }

    updateGameDisplay();

    // Check for insurance
    const dealerUpCard = dealerHand.getCards()[0];
    if (dealerUpCard.rank === 'A') {
      offerInsurance();
      return;
    }

    checkForBlackjacks();
  };

  const dealCardToPlayer = () => {
    dealCardToHand(playerHand);
  };

  const dealCardToHand = (hand: Hand) => {
    const card = deck.dealCard();
    hand.addCard(card);
    updateRunningCount(card);
    gameStore.addToRecentCards(card.toData());
  };

  const dealCardToDealer = (faceDown = false) => {
    const card = deck.dealCard();
    dealerHand.addCard(card);

    if (!faceDown) {
      updateRunningCount(card);
      gameStore.addToRecentCards(card.toData());
    }
  };

  const updateRunningCount = (card: any) => {
    const state = gameStore.getState();
    const newRunningCount = state.stats.runningCount + card.hiLoValue;
    const decksRemaining = deck.getDecksRemaining();
    const trueCount = decksRemaining > 0 ? Math.round(newRunningCount / decksRemaining) : 0;

    gameStore.updateStats({
      runningCount: newRunningCount,
      trueCount,
      cardsRemaining: deck.getCardsRemaining(),
      decksRemaining
    });
  };

  const hit = () => {
    const state = gameStore.getState();
    if (state.state !== 'playing') return;

    const hand = currentHand === 'main' ? playerHand : splitHand;
    if (!hand) return;

    setHasHit(prev => ({ ...prev, [currentHand]: true }));
    dealCardToHand(hand);
    updateGameDisplay();

    if (hand.isBusted()) {
      if (splitHand && currentHand === 'main') {
        setCurrentHand('split');
        updateGameDisplay();
      } else {
        endGame('bust');
      }
    }
  };

  const stand = () => {
    const state = gameStore.getState();
    if (state.state !== 'playing') return;

    if (splitHand && currentHand === 'main') {
      setCurrentHand('split');
      updateGameDisplay();
    } else {
      gameStore.setState({ state: 'dealer-turn' });
      revealDealerCard();
      dealerPlay();
    }
  };

  const doubleDown = () => {
    const state = gameStore.getState();
    if (state.state !== 'playing' || state.balance < state.currentBet) return;

    gameStore.setState({
      balance: state.balance - state.currentBet,
      currentBet: state.currentBet * 2
    });

    const hand = currentHand === 'main' ? playerHand : splitHand;
    if (!hand) return;

    dealCardToHand(hand);
    updateGameDisplay();

    if (hand.isBusted()) {
      endGame('bust');
    } else {
      if (splitHand && currentHand === 'main') {
        setCurrentHand('split');
        updateGameDisplay();
      } else {
        gameStore.setState({ state: 'dealer-turn' });
        revealDealerCard();
        dealerPlay();
      }
    }
  };

  const split = () => {
    const state = gameStore.getState();
    if (!canSplit || state.state !== 'playing' || state.balance < state.currentBet) return;

    const newSplitHand = new Hand();
    const playerCards = playerHand.getCards();
    newSplitHand.addCard(playerCards[1]);

    const firstCard = playerCards[0];
    playerHand.clear();
    playerHand.addCard(firstCard);

    gameStore.setState({
      balance: state.balance - state.currentBet
    });

    dealCardToPlayer();
    dealCardToHand(newSplitHand);

    setSplitHand(newSplitHand);
    setCanSplit(false);
    updateGameDisplay();
  };

  const revealDealerCard = () => {
    const dealerCards = dealerHand.getCards();
    if (dealerCards.length >= 2) {
      const hiddenCard = dealerCards[1];
      updateRunningCount(hiddenCard);
      gameStore.addToRecentCards(hiddenCard.toData());
    }
  };

  const dealerPlay = () => {
    while (dealerHand.getValue() < 17) {
      dealCardToDealer();
    }
    determineWinner();
  };

  const determineWinner = () => {
    const dealerValue = dealerHand.getValue();
    const playerValue = playerHand.getValue();
    const splitValue = splitHand?.getValue() || 0;

    let result = 'lose';

    if (splitHand) {
      const mainWins = !playerHand.isBusted() && (dealerValue > 21 || playerValue > dealerValue);
      const mainPush = !playerHand.isBusted() && playerValue === dealerValue && dealerValue <= 21;
      const splitWins = !splitHand.isBusted() && (dealerValue > 21 || splitValue > dealerValue);
      const splitPush = !splitHand.isBusted() && splitValue === dealerValue && dealerValue <= 21;

      if (mainWins && splitWins) {
        result = 'win-both';
      } else if (mainWins || splitWins) {
        result = 'win-one';
      } else if (mainPush || splitPush) {
        result = 'push-split';
      } else {
        result = 'lose';
      }
    } else {
      if (playerHand.isBusted()) {
        result = 'bust';
      } else if (dealerValue > 21 || playerValue > dealerValue) {
        result = 'win';
      } else if (playerValue === dealerValue) {
        result = 'push';
      } else {
        result = 'lose';
      }
    }

    endGame(result);
  };

  const endGame = (result: string) => {
    const state = gameStore.getState();
    const newStats = { ...state.stats };
    newStats.totalHands++;

    let message = '';
    let balanceChange = 0;

    switch (result) {
      case 'win':
        balanceChange = state.currentBet * 2;
        newStats.handsWon++;
        message = 'You win!';
        break;
      case 'push':
        balanceChange = state.currentBet;
        message = 'Push!';
        break;
      case 'blackjack':
        balanceChange = Math.floor(state.currentBet * 2.5);
        newStats.handsWon++;
        message = 'Blackjack!';
        break;
      case 'bust':
        message = 'Bust! You lose!';
        break;
      default:
        message = 'You lose!';
    }

    newStats.winRate = newStats.totalHands > 0 ?
      Math.round((newStats.handsWon / newStats.totalHands) * 100) : 0;

    gameStore.setState({
      balance: state.balance + balanceChange,
      currentBet: state.lastBet,
      state: 'betting',
      stats: newStats
    });

    gameStore.setMessage(message);

    setCurrentHand('main');
    setCanSplit(false);

    if (deck.needsReshuffle()) {
      reshuffleDeck();
    }

    updateGameDisplay();
  };

  const reshuffleDeck = () => {
    deck.reset();
    const state = gameStore.getState();
    gameStore.setState({
      stats: {
        ...state.stats,
        runningCount: 0,
        cardsRemaining: deck.getCardsRemaining(),
        decksRemaining: deck.getDecksRemaining()
      }
    });
    gameStore.clearRecentCards();
    gameStore.setMessage('Deck reshuffled!', 2000);
  };

  const newGame = () => {
    deck.reset();
    playerHand.clear();
    dealerHand.clear();
    setSplitHand(undefined);
    setCurrentHand('main');
    setCanSplit(false);
    setHasHit({ main: false, split: false });
    setInsuranceBet(0);
    setShowInsurance(false);

    const state = gameStore.getState();
    gameStore.setState({
      balance: 1000,
      currentBet: state.lastBet,
      state: 'betting',
      stats: {
        ...state.stats,
        runningCount: 0,
        handsWon: 0,
        totalHands: 0,
        winRate: 0,
        cardsRemaining: deck.getCardsRemaining(),
        decksRemaining: deck.getDecksRemaining()
      }
    });

    gameStore.clearRecentCards();
    gameStore.setMessage('New game started!');
    updateGameDisplay();
  };

  const offerInsurance = () => {
    const playerHasBlackjack = playerHand.isBlackjack();
    setIsEvenMoney(playerHasBlackjack);
    setShowInsurance(true);
  };

  const takeInsurance = () => {
    const state = gameStore.getState();
    const playerHasBlackjack = playerHand.isBlackjack();

    if (playerHasBlackjack) {
      gameStore.setState({ balance: state.balance + state.currentBet });
      setShowInsurance(false);
      gameStore.setMessage('Even money taken! 1:1 payout.');

      setTimeout(() => {
        endGame('even-money');
      }, 1500);
      return;
    }

    const insuranceCost = Math.floor(state.currentBet / 2);

    if (state.balance < insuranceCost) {
      gameStore.setMessage('Insufficient funds for insurance!');
      declineInsurance();
      return;
    }

    setInsuranceBet(insuranceCost);
    gameStore.setState({ balance: state.balance - insuranceCost });
    setShowInsurance(false);
    checkForBlackjacks();
  };

  const declineInsurance = () => {
    setInsuranceBet(0);
    setShowInsurance(false);
    checkForBlackjacks();
  };

  const checkForBlackjacks = () => {
    const playerHasBlackjack = playerHand.isBlackjack();

    revealDealerCard();
    const dealerHasBlackjack = dealerHand.isBlackjack();

    if (insuranceBet > 0) {
      if (dealerHasBlackjack) {
        const state = gameStore.getState();
        gameStore.setState({ balance: state.balance + (insuranceBet * 3) });
        gameStore.setMessage('Insurance pays 2:1!', 2000);
      }
    }

    if (playerHasBlackjack && dealerHasBlackjack) {
      endGame('push');
    } else if (playerHasBlackjack) {
      endGame('blackjack');
    } else if (dealerHasBlackjack) {
      endGame('dealer-blackjack');
    }
  };

  const updateGameDisplay = () => {
    gameStore.setState({
      playerHand: playerHand.getCards().map(card => card.toData()),
      playerValue: playerHand.getValue(),
      dealerHand: dealerHand.getCards().map(card => card.toData()),
      dealerValue: dealerHand.getValue()
    });
  };

  const changeDeckCount = (count: number) => {
    deck.setNumDecks(count);
    setDeckCount(count);

    const state = gameStore.getState();
    gameStore.setState({
      deckCount: count,
      stats: {
        ...state.stats,
        runningCount: 0,
        cardsRemaining: deck.getCardsRemaining(),
        decksRemaining: deck.getDecksRemaining()
      }
    });

    gameStore.clearRecentCards();
    gameStore.setMessage(`Deck changed to ${count} deck${count > 1 ? 's' : ''}. Cards shuffled!`);
  };

  return (
    <div className="container">
      <header>
        <h1>🃏 Blackjack Card Counting Trainer</h1>
      </header>

      {/* Settings Menu */}
      <div className="settings-menu">
        <button className="burger-btn" aria-label="Settings">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="settings-dropdown hidden">
          <h4>Game Settings</h4>
          <div className="setting-group">
            <label htmlFor="deck-count">Number of Decks:</label>
            <select
              id="deck-count"
              className="deck-select"
              value={deckCount}
              onChange={(e) => changeDeckCount(parseInt(e.target.value))}
              disabled={gameState.state !== 'betting'}
            >
              <option value="1">1 Deck</option>
              <option value="2">2 Decks</option>
              <option value="4">4 Decks</option>
              <option value="6">6 Decks</option>
              <option value="8">8 Decks</option>
            </select>
          </div>
        </div>
      </div>

      <div className="game-area">
        <HandDisplay
          cards={gameState.dealerHand}
          value={gameState.state === 'playing' && gameState.dealerHand.length > 1
            ? gameState.dealerHand[0]?.value || '-'
            : gameState.dealerValue}
          showFaceDown={gameState.state === 'playing' && gameState.dealerHand.length > 1}
          title="Dealer"
        />

        <HandDisplay
          cards={gameState.playerHand}
          value={gameState.playerValue}
          isCurrent={gameState.state === 'playing' && currentHand === 'main'}
          title="Player"
          balance={gameState.balance}
          currentBet={gameState.currentBet}
        />

        {splitHand && (
          <HandDisplay
            cards={splitHand.getCards().map(card => card.toData())}
            value={splitHand.getValue()}
            isCurrent={gameState.state === 'playing' && currentHand === 'split'}
            title="Split Hand"
          />
        )}
      </div>

      <div className="controls-area">
        <BettingControls
          balance={gameState.balance}
          currentBet={gameState.currentBet}
          isBetting={gameState.state === 'betting'}
        />

        <GameControls
          gameState={gameState.state}
          balance={gameState.balance}
          currentBet={gameState.currentBet}
          canSplit={canSplit}
          hasHit={hasHit[currentHand]}
          onDealHand={dealHand}
          onHit={hit}
          onStand={stand}
          onDoubleDown={doubleDown}
          onSplit={split}
          onNewGame={newGame}
        />

        <div className="game-message">{gameState.message}</div>
      </div>

      <InsurancePanel
        isVisible={showInsurance}
        isEvenMoney={isEvenMoney}
        onTakeInsurance={takeInsurance}
        onDeclineInsurance={declineInsurance}
      />

      <StatsDisplay
        stats={gameState.stats}
        balance={gameState.balance}
        currentBet={gameState.currentBet}
      />

      <div className="info-section">
        <div className="counting-guide">
          <h3>Hi-Lo Counting System</h3>
          <div className="count-values">
            <div className="count-group positive">
              <span className="label">+1</span>
              <span className="cards">2, 3, 4, 5, 6</span>
            </div>
            <div className="count-group neutral">
              <span className="label">0</span>
              <span className="cards">7, 8, 9</span>
            </div>
            <div className="count-group negative">
              <span className="label">-1</span>
              <span className="cards">10, J, Q, K, A</span>
            </div>
          </div>
        </div>

        <RecentCards
          recentCards={gameState.recentCards}
          onClearRecent={() => gameStore.clearRecentCards()}
        />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
};

export default App;