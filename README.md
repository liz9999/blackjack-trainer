# Blackjack Card Counting Trainer

A modern web application for learning blackjack and card counting using the Hi-Lo system.

## Features

- **Full Blackjack Game**: Hit, stand, double down, and split functionality
- **Card Counting Practice**: Learn the Hi-Lo counting system
- **Split Hands**: Full support for splitting pairs
- **Professional UI**: Clean, responsive design with glassmorphism effects
- **Statistics Tracking**: Monitor your performance and counting accuracy
- **Multiple Deck Options**: Choose from 1-8 decks
- **Persistent Betting**: Remembers your preferred bet amounts

## Technologies Used

- **TypeScript**: Type-safe JavaScript with modern ES2020 features
- **Vite**: Fast development server and build tool
- **SCSS**: Advanced CSS with variables and mixins
- **Component Architecture**: Modular, maintainable code structure

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3001`

## How to Play

1. **Place Your Bet**: Use the betting buttons or enter a custom amount
2. **Deal Cards**: Click "Deal Hand" to start
3. **Make Decisions**: Hit, stand, double down, or split as appropriate
4. **Learn Counting**: Watch the running count and true count in the stats
5. **Track Progress**: Monitor your win rate and counting accuracy

## Hi-Lo Counting System

- **+1**: Cards 2, 3, 4, 5, 6
- **0**: Cards 7, 8, 9
- **-1**: Cards 10, J, Q, K, A

The running count tracks all cards dealt. The true count adjusts for remaining decks.

## Development

Built with modern web technologies and best practices:
- Component-based architecture
- State management with reactive updates
- Type-safe development with TypeScript
- Responsive design with SCSS

## License

MIT License - feel free to use and modify as needed.