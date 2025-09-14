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

interface HandInfo {
  hand: Hand;
  hasHit: boolean;
  isCompleted: boolean;
}

const GameContent: React.FC = () => {
  const { gameState } = useGameState();
  const [deck] = useState(() => new Deck(6));
  const [dealerHand] = useState(() => new Hand());
  const [hands, setHands] = useState<HandInfo[]>([]);
  const [currentHandIndex, setCurrentHandIndex] = useState(0);
  const [insuranceBet, setInsuranceBet] = useState(0);
  const [showInsurance, setShowInsurance] = useState(false);
  const [isEvenMoney, setIsEvenMoney] = useState(false);
  const [deckCount, setDeckCount] = useState(6);
  const [endGameTimeoutId, setEndGameTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [dealerCardRevealed, setDealerCardRevealed] = useState(false);

  useEffect(() => {
    gameStore.setState({
      state: 'betting', // Ensure we start in betting state
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

    // Clear any existing end game timeout
    if (endGameTimeoutId) {
      clearTimeout(endGameTimeoutId);
      setEndGameTimeoutId(null);
    }

    // Clear previous game display
    gameStore.setState({
      balance: state.balance - state.currentBet,
      state: 'playing',
      playerHand: [],
      playerValue: 0,
      dealerHand: [],
      dealerValue: 0
    });

    // Initialize with one hand
    const initialHand = new Hand();
    dealerHand.clear();
    setHands([{ hand: initialHand, hasHit: false, isCompleted: false }]);
    setCurrentHandIndex(0);
    setInsuranceBet(0);
    setShowInsurance(false);
    setDealerCardRevealed(false); // Reset dealer card reveal flag

    // Deal initial cards
    dealCardToHand(initialHand);
    dealCardToDealer();
    dealCardToHand(initialHand);
    dealCardToDealer(true);

    updateGameDisplay();

    // Check for player blackjack first using the newly dealt hand
    const playerHasBlackjack = initialHand.isBlackjack();
    const dealerUpCard = dealerHand.getCards()[0];

    if (playerHasBlackjack && dealerUpCard.rank === 'A') {
      // Player has blackjack, dealer shows Ace - offer even money
      offerInsurance();
      return;
    } else if (playerHasBlackjack && dealerUpCard.rank !== 'A') {
      // Player has blackjack, dealer doesn't show Ace - auto win
      revealDealerCard();
      updateGameDisplay();

      const dealerHasBlackjack = dealerHand.isBlackjack();
      if (dealerHasBlackjack) {
        endGame(gameState.currentBet, 0, 'Push - Both blackjack', true, true);
      } else {
        endGame(Math.floor(gameState.currentBet * 2.5), 1, 'Blackjack!', true, false);
      }
      return;
    } else if (dealerUpCard.rank === 'A') {
      // No player blackjack, dealer shows Ace - offer insurance
      offerInsurance();
      return;
    }

    // No blackjacks or insurance needed - game continues normally
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

  const canCurrentHandSplit = (): boolean => {
    if (hands.length >= 4) return false; // Max 4 hands
    const currentHand = hands[currentHandIndex];
    if (!currentHand || currentHand.hasHit) return false;

    const cards = currentHand.hand.getCards();
    return cards.length === 2 && cards[0].rank === cards[1].rank;
  };

  const hit = () => {
    const state = gameStore.getState();
    if (state.state !== 'playing' || currentHandIndex >= hands.length) return;

    const currentHandInfo = hands[currentHandIndex];
    if (!currentHandInfo || currentHandInfo.isCompleted) return;

    // Mark as having hit
    const updatedHands = [...hands];
    updatedHands[currentHandIndex] = {
      ...currentHandInfo,
      hasHit: true
    };
    setHands(updatedHands);

    dealCardToHand(currentHandInfo.hand);
    updateGameDisplay();

    if (currentHandInfo.hand.isBusted()) {
      // Complete current hand and move to next
      updatedHands[currentHandIndex] = {
        ...updatedHands[currentHandIndex],
        isCompleted: true
      };
      setHands(updatedHands);

      // If this is the only hand or last hand, end the game immediately
      if (hands.length === 1 || currentHandIndex === hands.length - 1) {
        setTimeout(() => {
          determineWinner();
        }, 1000); // Small delay to show the bust
      } else {
        moveToNextHand();
      }
    } else if (currentHandInfo.hand.getValue() === 21) {
      // Auto-stand on 21 and reveal dealer card
      updatedHands[currentHandIndex] = {
        ...updatedHands[currentHandIndex],
        isCompleted: true
      };
      setHands(updatedHands);

      // Reveal dealer's hole card when player gets 21
      revealDealerCard();
      updateGameDisplay();

      moveToNextHand();
    }
  };

  const stand = () => {
    const state = gameStore.getState();
    if (state.state !== 'playing') return;

    // Complete current hand
    const updatedHands = [...hands];
    updatedHands[currentHandIndex] = {
      ...updatedHands[currentHandIndex],
      isCompleted: true
    };
    setHands(updatedHands);

    moveToNextHand();
  };

  const moveToNextHand = () => {
    const nextIndex = currentHandIndex + 1;
    if (nextIndex < hands.length) {
      setCurrentHandIndex(nextIndex);
      updateGameDisplay();
    } else {
      // All hands complete, dealer plays
      gameStore.setState({ state: 'dealer-turn' });
      revealDealerCard();
      dealerPlay();
    }
  };

  const doubleDown = () => {
    const state = gameStore.getState();
    if (state.state !== 'playing' || state.balance < state.currentBet) return;

    const currentHandInfo = hands[currentHandIndex];
    if (!currentHandInfo || currentHandInfo.hasHit) return;

    gameStore.setState({
      balance: state.balance - state.currentBet,
      currentBet: state.currentBet * 2
    });

    dealCardToHand(currentHandInfo.hand);
    updateGameDisplay();

    // Complete hand after double down
    const updatedHands = [...hands];
    updatedHands[currentHandIndex] = {
      ...currentHandInfo,
      hasHit: true,
      isCompleted: true
    };
    setHands(updatedHands);

    if (currentHandInfo.hand.isBusted()) {
      moveToNextHand();
    } else {
      moveToNextHand();
    }
  };

  const split = () => {
    const state = gameStore.getState();
    if (!canCurrentHandSplit() || state.balance < state.currentBet) return;

    const currentHandInfo = hands[currentHandIndex];
    const cards = currentHandInfo.hand.getCards();

    // Create new hand with second card
    const newHand = new Hand();
    newHand.addCard(cards[1]);

    // Keep first card in current hand
    currentHandInfo.hand.clear();
    currentHandInfo.hand.addCard(cards[0]);

    // Deduct bet for split
    gameStore.setState({
      balance: state.balance - state.currentBet
    });

    // Deal new cards to both hands
    dealCardToHand(currentHandInfo.hand);
    dealCardToHand(newHand);

    // Insert new hand after current hand
    const updatedHands = [...hands];
    updatedHands.splice(currentHandIndex + 1, 0, {
      hand: newHand,
      hasHit: false,
      isCompleted: false
    });
    setHands(updatedHands);

    updateGameDisplay();
  };

  const revealDealerCard = () => {
    if (dealerCardRevealed) return; // Already revealed

    const dealerCards = dealerHand.getCards();
    if (dealerCards.length >= 2) {
      const hiddenCard = dealerCards[1];
      updateRunningCount(hiddenCard);
      gameStore.addToRecentCards(hiddenCard.toData());
      setDealerCardRevealed(true);
    }
  };

  const dealerPlay = () => {
    while (dealerHand.getValue() < 17) {
      dealCardToDealer();
    }
    updateGameDisplay(); // Ensure display is updated after dealer finishes
    determineWinner();
  };

  const determineWinner = () => {
    const dealerValue = dealerHand.getValue();
    const state = gameStore.getState();
    let totalWinnings = 0;
    let handsWon = 0;
    const messages: string[] = [];

    hands.forEach((handInfo, index) => {
      const handValue = handInfo.hand.getValue();
      let handWinnings = 0;

      if (handInfo.hand.isBusted()) {
        messages.push(`Hand ${index + 1}: Bust!`);
      } else if (dealerValue > 21 || handValue > dealerValue) {
        handWinnings = state.currentBet / hands.length * 2; // Win
        handsWon++;
        messages.push(`Hand ${index + 1}: Win!`);
      } else if (handValue === dealerValue) {
        handWinnings = state.currentBet / hands.length; // Push
        messages.push(`Hand ${index + 1}: Push`);
      } else {
        messages.push(`Hand ${index + 1}: Lose`);
      }

      totalWinnings += handWinnings;
    });

    endGame(totalWinnings, handsWon, messages.join(' | '));
  };

  const endGame = (winnings: number, handsWon: number, message: string, playerBlackjack = false, dealerBlackjack = false) => {
    const state = gameStore.getState();
    const newStats = { ...state.stats };
    newStats.totalHands++;

    if (handsWon > 0) {
      newStats.handsWon++;
    }

    if (playerBlackjack) {
      newStats.playerBlackjacks++;
    }

    if (dealerBlackjack) {
      newStats.dealerBlackjacks++;
    }

    newStats.winRate = newStats.totalHands > 0 ?
      Math.round((newStats.handsWon / newStats.totalHands) * 100) : 0;

    gameStore.setState({
      balance: state.balance + winnings,
      currentBet: state.lastBet,
      state: 'betting',
      stats: newStats
    });

    gameStore.setMessage(message);

    setCurrentHandIndex(0);

    if (deck.needsReshuffle()) {
      reshuffleDeck();
    }

    updateGameDisplay();

    // Cards will stay visible until next hand is dealt
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
    dealerHand.clear();
    setHands([]);
    setCurrentHandIndex(0);
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
        playerBlackjacks: 0,
        dealerBlackjacks: 0,
        cardsRemaining: deck.getCardsRemaining(),
        decksRemaining: deck.getDecksRemaining()
      }
    });

    gameStore.clearRecentCards();
    gameStore.setMessage('New game started!');
    updateGameDisplay();
  };

  const offerInsurance = () => {
    const playerHasBlackjack = hands.length > 0 ? hands[0].hand.isBlackjack() : false;
    setIsEvenMoney(playerHasBlackjack);
    setShowInsurance(true);
  };

  const takeInsurance = () => {
    const state = gameStore.getState();
    const playerHasBlackjack = hands.length > 0 ? hands[0].hand.isBlackjack() : false;

    if (playerHasBlackjack) {
      gameStore.setState({ balance: state.balance + state.currentBet });
      setShowInsurance(false);
      gameStore.setMessage('Even money taken! 1:1 payout.');

      // Update display before ending game
      updateGameDisplay();

      setTimeout(() => {
        endGame(state.currentBet, 1, 'Even money', true, false);
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
    const playerHasBlackjack = hands.length > 0 ? hands[0].hand.isBlackjack() : false;

    revealDealerCard();
    const dealerHasBlackjack = dealerHand.isBlackjack();

    // Update display to show revealed dealer card
    updateGameDisplay();

    if (insuranceBet > 0 && dealerHasBlackjack) {
      const state = gameStore.getState();
      gameStore.setState({ balance: state.balance + (insuranceBet * 3) });
      gameStore.setMessage('Insurance pays 2:1!', 2000);
    }

    if (playerHasBlackjack && dealerHasBlackjack) {
      endGame(gameState.currentBet, 0, 'Push - Both blackjack', true, true);
    } else if (playerHasBlackjack) {
      endGame(Math.floor(gameState.currentBet * 2.5), 1, 'Blackjack!', true, false);
    } else if (dealerHasBlackjack) {
      endGame(0, 0, 'Dealer blackjack', false, true);
    }
  };

  const updateGameDisplay = () => {
    gameStore.setState({
      playerHand: hands[0]?.hand.getCards().map(card => card.toData()) || [],
      playerValue: hands[0]?.hand.getValue() || 0,
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

        {hands.length > 0 ? (
          hands.map((handInfo, index) => (
            <HandDisplay
              key={index}
              cards={handInfo.hand.getCards().map(card => card.toData())}
              value={handInfo.hand.getValue()}
              isCurrent={gameState.state === 'playing' && index === currentHandIndex && !handInfo.isCompleted}
              title={index === 0 ? "Player" : `Split Hand ${index}`}
              balance={index === 0 ? gameState.balance : undefined}
              currentBet={index === 0 ? gameState.currentBet : undefined}
            />
          ))
        ) : (
          <HandDisplay
            cards={[]}
            value={0}
            title="Player"
            balance={gameState.balance}
            currentBet={gameState.currentBet}
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
          canSplit={canCurrentHandSplit()}
          hasHit={hands[currentHandIndex]?.hasHit || false}
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