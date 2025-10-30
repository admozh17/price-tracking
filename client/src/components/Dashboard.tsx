import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, Search, RefreshCw, AlertCircle } from 'lucide-react';
import SearchBar from './SearchBar';
import CardDisplay from './CardDisplay';
import PriceChart from './PriceChart';
import { cardAPI } from '../services/api';
import { Card, SearchResult, WatchlistItem, CardDetailResponse, PriceType } from '../types';

interface DashboardProps {
  className?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardDetailResponse | null>(null);
  const [loading, setLoading] = useState({
    search: false,
    watchlist: false,
    cardDetail: false,
    priceUpdate: false
  });
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'search' | 'watchlist' | 'detail'>('search');

  // Load watchlist on component mount
  useEffect(() => {
    loadWatchlist();
    checkAPIHealth();
  }, []);

  const checkAPIHealth = async () => {
    try {
      await cardAPI.healthCheck();
    } catch (error) {
      setError('Unable to connect to the API. Please make sure the server is running.');
    }
  };

  const loadWatchlist = async () => {
    setLoading(prev => ({ ...prev, watchlist: true }));
    try {
      const response = await cardAPI.getWatchlist();
      setWatchlist(response.watchlist);
      setError('');
    } catch (error) {
      console.error('Failed to load watchlist:', error);
      setError('Failed to load watchlist');
    } finally {
      setLoading(prev => ({ ...prev, watchlist: false }));
    }
  };

  const handleSearch = async (query: string) => {
    setLoading(prev => ({ ...prev, search: true }));
    setError('');
    
    try {
      const results = await cardAPI.searchCards(query);
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      console.error('Search failed:', error);
      setError('Search failed. Please try again.');
      setSearchResults(null);
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

  const handleClearSearch = () => {
    setSearchResults(null);
    setError('');
  };

  const handleViewCardDetails = async (cardId: string) => {
    setLoading(prev => ({ ...prev, cardDetail: true }));
    setError('');
    
    try {
      const cardDetail = await cardAPI.getCardById(cardId);
      setSelectedCard(cardDetail);
      setActiveTab('detail');
    } catch (error) {
      console.error('Failed to load card details:', error);
      setError('Failed to load card details');
    } finally {
      setLoading(prev => ({ ...prev, cardDetail: false }));
    }
  };

  const handleAddToWatchlist = async (cardId: string, priceType: PriceType, targetPrice: number) => {
    try {
      await cardAPI.addToWatchlist(cardId, targetPrice, priceType);
      await loadWatchlist();
      setError('');
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      setError('Failed to add to watchlist');
    }
  };

  const handleRemoveFromWatchlist = async (cardId: string, priceType: PriceType) => {
    try {
      await cardAPI.removeFromWatchlist(cardId, priceType);
      await loadWatchlist();
      setError('');
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      setError('Failed to remove from watchlist');
    }
  };

  const handleUpdatePrices = async () => {
    setLoading(prev => ({ ...prev, priceUpdate: true }));
    setError('');
    
    try {
      const result = await cardAPI.updatePrices();
      await loadWatchlist();
      setError('');
      // Show success message
      alert(`Successfully updated ${result.updated_cards} of ${result.total_cards} cards`);
    } catch (error) {
      console.error('Failed to update prices:', error);
      setError('Failed to update prices');
    } finally {
      setLoading(prev => ({ ...prev, priceUpdate: false }));
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                MTG Price Tracker
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleUpdatePrices}
                disabled={loading.priceUpdate}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading.priceUpdate ? 'animate-spin' : ''}`} />
                <span>Update Prices</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Search Cards</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'watchlist'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>Watchlist ({watchlist.length})</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <SearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              loading={loading.search}
            />
            
            {searchResults && (
              <div className="space-y-6">
                {/* Local Results */}
                {searchResults.local_results.length > 0 && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Local Results ({searchResults.local_results.length})
                    </h2>
                    <div className="space-y-4">
                      {searchResults.local_results.map(card => (
                        <CardDisplay
                          key={`local-${card.id}`}
                          card={card}
                          onAddToWatchlist={handleAddToWatchlist}
                          onViewDetails={handleViewCardDetails}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Scryfall Results */}
                {searchResults.scryfall_results.data.length > 0 && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Scryfall Results ({searchResults.scryfall_results.total_cards} total)
                    </h2>
                    <div className="space-y-6">
                      {searchResults.scryfall_results.data.map(card => (
                        <CardDisplay
                          key={`scryfall-${card.id}`}
                          card={card}
                          onAddToWatchlist={handleAddToWatchlist}
                          onViewDetails={handleViewCardDetails}
                          isInWatchlist={watchlist.some(item => item.card_id === card.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {searchResults.local_results.length === 0 && 
                 searchResults.scryfall_results.data.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No cards found. Try a different search term.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Your Watchlist ({watchlist.length} items)
              </h2>
              <button
                onClick={loadWatchlist}
                disabled={loading.watchlist}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading.watchlist ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
            
            {loading.watchlist ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : watchlist.length > 0 ? (
              <div className="grid gap-4">
                {watchlist.map(item => (
                  <div key={`${item.card_id}-${item.price_type}`} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          {item.image_uris.small ? (
                            <img
                              src={item.image_uris.small}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500">
                            Target: ${item.target_price.toFixed(2)} ({item.price_type.toUpperCase()})
                          </p>
                          <p className="text-xs text-gray-400">
                            Added: {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewCardDetails(item.card_id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveFromWatchlist(item.card_id, item.price_type as PriceType)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No cards in your watchlist yet.</p>
                <p className="text-sm">Search for cards and add them to track their prices.</p>
              </div>
            )}
          </div>
        )}

        {/* Card Detail Tab */}
        {activeTab === 'detail' && selectedCard && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('search')}
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>← Back to search</span>
              </button>
            </div>
            
            <CardDisplay
              card={selectedCard.card}
              onAddToWatchlist={handleAddToWatchlist}
              onRemoveFromWatchlist={handleRemoveFromWatchlist}
              isInWatchlist={watchlist.some(item => item.card_id === selectedCard.card.id)}
            />
            
            {selectedCard.price_history.length > 0 && (
              <PriceChart
                data={selectedCard.price_history}
                cardName={selectedCard.card.name}
                height={400}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;