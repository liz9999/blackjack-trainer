import { GameStateData, StateUpdateCallback, GameStats } from '../types/index.js';

export class GameStore {
    private state: GameStateData;
    private listeners: Set<StateUpdateCallback> = new Set();

    constructor() {
        this.state = this.getInitialState();
    }

    private getInitialState(): GameStateData {
        return {
            state: 'betting',
            balance: 1000,
            currentBet: 0,
            lastBet: 25,
            playerHand: [],
            playerValue: 0,
            dealerHand: [],
            dealerValue: 0,
            deckCount: 6,
            recentCards: [],
            stats: {
                runningCount: 0,
                trueCount: 0,
                cardsRemaining: 312,
                decksRemaining: 6.0,
                handsWon: 0,
                totalHands: 0,
                winRate: 0
            },
            countingPracticeEnabled: false,
            settingsOpen: false,
            message: ''
        };
    }

    // Subscribe to state changes
    subscribe = (callback: StateUpdateCallback): (() => void) => {
        this.listeners.add(callback);
        // Return unsubscribe function
        return () => this.listeners.delete(callback);
    };

    // Get current state (read-only)
    getState = (): Readonly<GameStateData> => {
        return { ...this.state };
    };

    // Update state and notify listeners
    setState = (updates: Partial<GameStateData>): void => {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
    };

    // Update nested state properties
    updateStats = (updates: Partial<GameStats>): void => {
        this.state = {
            ...this.state,
            stats: { ...this.state.stats, ...updates }
        };
        this.notifyListeners();
    };

    // Reset to initial state
    reset = (): void => {
        this.state = this.getInitialState();
        this.notifyListeners();
    };

    // Helper methods for common operations
    addToRecentCards = (card: any): void => {
        const recentCards = [...this.state.recentCards, card];
        // Keep only last 20 cards
        if (recentCards.length > 20) {
            recentCards.shift();
        }
        this.setState({ recentCards });
    };

    clearRecentCards = (): void => {
        this.setState({ recentCards: [] });
    };

    setMessage = (message: string, duration: number = 3000): void => {
        this.setState({ message });
        if (duration > 0) {
            setTimeout(() => {
                if (this.state.message === message) {
                    this.setState({ message: '' });
                }
            }, duration);
        }
    };

    private notifyListeners = (): void => {
        this.listeners.forEach(callback => callback(this.state));
    };
}

// Create global store instance
export const gameStore = new GameStore();