import { Card } from './Card.js';
import { Suit, Rank } from '../types/index.js';

export class Deck {
    private cards: Card[] = [];
    private dealtCards: Card[] = [];
    private numDecks: number;

    constructor(numDecks: number = 6) {
        this.numDecks = numDecks;
        this.reset();
    }

    setNumDecks = (numDecks: number): void => {
        this.numDecks = numDecks;
        this.reset();
    };

    reset = (): void => {
        this.cards = [];
        this.dealtCards = [];
        const suits: Suit[] = ['♠', '♥', '♦', '♣'];
        const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        for (let deck = 0; deck < this.numDecks; deck++) {
            suits.forEach(suit => {
                ranks.forEach(rank => {
                    this.cards.push(new Card(suit, rank));
                });
            });
        }
        this.shuffle();
    };

    private shuffle = (): void => {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    };

    dealCard = (): Card => {
        if (this.cards.length === 0) {
            throw new Error('Deck is empty');
        }
        const card = this.cards.pop()!;
        this.dealtCards.push(card);
        return card;
    };

    getCardsRemaining = (): number => this.cards.length;

    getDecksRemaining = (): number => this.cards.length / 52;

    getNumDecks = (): number => this.numDecks;

    needsReshuffle = (): boolean => this.cards.length < 52;
}