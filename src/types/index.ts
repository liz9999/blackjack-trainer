export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type GameState = 'betting' | 'playing' | 'dealer-turn' | 'game-over';

export interface CardData {
    suit: Suit;
    rank: Rank;
    value: number;
    hiLoValue: number;
    isRed: boolean;
}

export interface GameStats {
    runningCount: number;
    trueCount: number;
    cardsRemaining: number;
    decksRemaining: number;
    handsWon: number;
    totalHands: number;
    winRate: number;
}

export interface GameStateData {
    // Game state
    state: GameState;

    // Player data
    balance: number;
    currentBet: number;
    lastBet: number;
    playerHand: CardData[];
    playerValue: number;

    // Dealer data
    dealerHand: CardData[];
    dealerValue: number;

    // Deck and counting
    deckCount: number;
    recentCards: CardData[];
    stats: GameStats;

    // UI state
    countingPracticeEnabled: boolean;
    settingsOpen: boolean;
    message: string;
}

export type StateUpdateCallback = (state: GameStateData) => void;