# MTG Price Tracker

A comprehensive Magic: The Gathering price tracking application with real-time data from Scryfall API, featuring a modern dashboard for monitoring card prices, trends, and managing your watchlist.

## Features

### 🔍 Card Search
- Search Magic: The Gathering cards by name, type, or set
- Auto-complete suggestions and search tips
- Results from both local database and live Scryfall API

### 📊 Price Tracking
- Real-time price data for USD, EUR, and MTGO Tix
- Support for regular, foil, and etched card variants  
- Historical price charts with trend analysis
- Price change indicators and statistics

### ❤️ Watchlist Management
- Add cards to your personal watchlist
- Set target prices for price alerts
- Track multiple price types per card
- Easy watchlist management interface

### 🎯 Interactive Dashboard
- Modern, responsive React interface
- Card image display with fallback handling
- Direct links to Scryfall and marketplace listings
- Tabbed navigation between search, watchlist, and details

### 📈 Price History & Analytics
- Interactive charts using Recharts
- 30-day price history by default
- Multiple price type comparison
- Statistical summaries (high, low, current, change)

## Technology Stack

### Backend
- **Node.js** with Express server
- **SQLite** database for local data persistence
- **Scryfall API** integration for card data
- RESTful API design with proper error handling

### Frontend  
- **React 18** with TypeScript
- **Tailwind CSS** for responsive styling
- **Recharts** for interactive price charts
- **Lucide React** for icons
- **Axios** for API communication

## Installation

### Prerequisites
- Node.js 16+ and npm
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/admozh17/price-tracking.git
   cd price-tracking
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Backend server on http://localhost:3001
   - React frontend on http://localhost:3000

### Production Build

```bash
# Build the React frontend
npm run build

# Start production server
npm start
```

## API Documentation

### Endpoints

#### Card Search
- `GET /api/cards/search?q={query}&page={page}` - Search cards
- `GET /api/cards/{id}` - Get card by ID
- `GET /api/cards/named/{name}` - Get card by exact name
- `GET /api/cards/random/card` - Get random card

#### Price Data
- `GET /api/cards/{id}/prices?days={days}` - Get price history
- `POST /api/cards/prices/update` - Update all watchlist card prices

#### Watchlist
- `GET /api/cards/watchlist/all` - Get user watchlist
- `POST /api/cards/watchlist/add` - Add card to watchlist
- `DELETE /api/cards/watchlist/remove/{cardId}` - Remove from watchlist

#### Health Check
- `GET /api/health` - API status check

### Rate Limiting
The application respects Scryfall's rate limit of 50-100ms between requests.

## Usage Guide

### Searching for Cards
1. Enter card name, type, or set in the search bar
2. View results from both local database and Scryfall
3. Click "View Charts" to see detailed price history
4. Use "Watch" button to add cards to your watchlist

### Managing Your Watchlist
1. Switch to the "Watchlist" tab
2. Set target prices for price alerts
3. Remove cards you no longer want to track
4. Use "Update Prices" to refresh all data

### Understanding Price Data
- **USD/EUR/TIX**: Different currency formats
- **Foil/Etched**: Premium card variants
- **Charts**: Interactive price trends over time
- **Statistics**: Current, high, low prices with change percentages

## Project Structure

```
price-tracking/
├── server/                 # Backend Express application
│   ├── api/               # API routes and Scryfall integration
│   ├── database/          # SQLite database and schema
│   └── utils/             # Utility functions
├── client/                # React frontend application
│   ├── public/            # Static files
│   └── src/
│       ├── components/    # React components
│       ├── services/      # API service layer
│       ├── types/         # TypeScript type definitions
│       └── utils/         # Helper functions
├── data/                  # SQLite database files
└── README.md
```

## Database Schema

### Tables
- **cards** - Card information and metadata
- **price_history** - Historical daily price data
- **watchlist** - User's tracked cards with target prices
- **price_alerts** - Triggered price alert history

## Development

### Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run server:dev` - Start only the backend server
- `npm run client:dev` - Start only the React frontend
- `npm run build` - Build React app for production
- `npm run install:all` - Install all dependencies

### API Integration
The application integrates with the Scryfall API following their usage guidelines:
- Proper User-Agent headers
- Rate limiting (100ms between requests)
- Error handling and retry logic
- Caching to reduce API calls

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Scryfall](https://scryfall.com/) for providing the comprehensive MTG card database and API
- [Magic: The Gathering](https://magic.wizards.com/) by Wizards of the Coast
- React and Node.js communities for excellent documentation and tools

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/admozh17/price-tracking/issues) on GitHub.