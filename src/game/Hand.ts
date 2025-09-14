import { Card } from './Card.js';
import { CardData } from '../types/index.js';

export class Hand {
    private cards: Card[] = [];

    addCard = (card: Card): void => {
        this.cards.push(card);
    };

    getCards = (): Card[] => [...this.cards];

    getCardsData = (): CardData[] => this.cards.map(card => card.toData());

    getValue = (): number => {
        let value = 0;
        let aces = 0;

        this.cards.forEach(card => {
            if (card.rank === 'A') {
                aces++;
                value += 11;
            } else {
                value += card.value;
            }
        });

        // Handle aces
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }

        return value;
    };

    isBusted = (): boolean => this.getValue() > 21;

    isBlackjack = (): boolean => this.cards.length === 2 && this.getValue() === 21;

    clear = (): void => {
        this.cards = [];
    };

    isEmpty = (): boolean => this.cards.length === 0;
}