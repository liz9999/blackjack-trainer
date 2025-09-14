import { Suit, Rank, CardData } from '../types/index.js';

export class Card {
    public readonly suit: Suit;
    public readonly rank: Rank;
    public readonly value: number;
    public readonly hiLoValue: number;
    public readonly isRed: boolean;

    constructor(suit: Suit, rank: Rank) {
        this.suit = suit;
        this.rank = rank;
        this.value = this.getCardValue();
        this.hiLoValue = this.getHiLoValue();
        this.isRed = suit === '♥' || suit === '♦';
    }

    private getCardValue = (): number => {
        if (this.rank === 'A') return 11;
        if (['J', 'Q', 'K'].includes(this.rank)) return 10;
        return parseInt(this.rank);
    };

    private getHiLoValue = (): number => {
        if (['2', '3', '4', '5', '6'].includes(this.rank)) return 1;
        if (['7', '8', '9'].includes(this.rank)) return 0;
        if (['10', 'J', 'Q', 'K', 'A'].includes(this.rank)) return -1;
        return 0;
    };

    toString = (): string => `${this.rank}${this.suit}`;

    toData = (): CardData => ({
        suit: this.suit,
        rank: this.rank,
        value: this.value,
        hiLoValue: this.hiLoValue,
        isRed: this.isRed
    });
}