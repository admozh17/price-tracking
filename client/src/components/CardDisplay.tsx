import React, { useState } from 'react';
import { ExternalLink, Heart, HeartOff, TrendingUp, Eye } from 'lucide-react';
import { Card, PriceType } from '../types';
import {
  formatPrice,
  formatRarity,
  getRarityColor,
  formatManaCost,
  getImageUrl,
  formatDate,
  getPriceByType,
  formatPriceType
} from '../utils/formatters';

interface CardDisplayProps {
  card: Card;
  onAddToWatchlist?: (cardId: string, priceType: PriceType, targetPrice: number) => void;
  onRemoveFromWatchlist?: (cardId: string, priceType: PriceType) => void;
  onViewDetails?: (cardId: string) => void;
  isInWatchlist?: boolean;
  showWatchlistControls?: boolean;
  compact?: boolean;
}

const CardDisplay: React.FC<CardDisplayProps> = ({
  card,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onViewDetails,
  isInWatchlist = false,
  showWatchlistControls = true,
  compact = false
}) => {
  const [selectedPriceType, setSelectedPriceType] = useState<PriceType>('usd');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [showWatchlistForm, setShowWatchlistForm] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const availablePriceTypes: PriceType[] = ([
    'usd', 'usd_foil', 'usd_etched', 'eur', 'eur_foil', 'tix'
  ] as PriceType[]).filter(type => getPriceByType(card, type) !== null);

  const handleAddToWatchlist = () => {
    const price = getPriceByType(card, selectedPriceType);
    const target = parseFloat(targetPrice);
    
    if (price && target > 0 && onAddToWatchlist) {
      onAddToWatchlist(card.id, selectedPriceType, target);
      setShowWatchlistForm(false);
      setTargetPrice('');
    }
  };

  const handleRemoveFromWatchlist = () => {
    if (onRemoveFromWatchlist) {
      onRemoveFromWatchlist(card.id, selectedPriceType);
    }
  };

  const imageUrl = getImageUrl(card, compact ? 'small' : 'normal');

  if (compact) {
    return (
      <div className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
        <div className="flex-shrink-0 w-12 h-16 bg-gray-200 rounded overflow-hidden">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={card.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No Image
            </div>
          )}
        </div>
        
        <div className="ml-3 flex-grow min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">{card.name}</h3>
          <p className="text-xs text-gray-500">{card.set_name} ({card.set_code.toUpperCase()})</p>
          <div className="flex items-center space-x-2 mt-1">
            <span 
              className="px-2 py-1 text-xs rounded-full text-white"
              style={{ backgroundColor: getRarityColor(card.rarity) }}
            >
              {formatRarity(card.rarity)}
            </span>
            {getPriceByType(card, 'usd') && (
              <span className="text-sm font-semibold text-green-600">
                {formatPrice(getPriceByType(card, 'usd'))}
              </span>
            )}
          </div>
        </div>
        
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(card.id)}
            className="ml-2 p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="md:flex">
        {/* Card Image */}
        <div className="md:flex-shrink-0 relative">
          <div className="h-64 md:h-80 md:w-56 bg-gray-200 relative">
            {imageUrl && !imageError ? (
              <img
                src={imageUrl}
                alt={card.name}
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">🃏</div>
                  <div className="text-sm">No Image Available</div>
                </div>
              </div>
            )}
            
            {!imageLoaded && imageUrl && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
              </div>
            )}
          </div>
        </div>
        
        {/* Card Details */}
        <div className="p-6 flex-grow">
          <div className="flex items-start justify-between">
            <div className="flex-grow">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{card.name}</h2>
              <div className="flex items-center space-x-2 mb-2">
                {card.mana_cost && (
                  <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                    {formatManaCost(card.mana_cost)}
                  </span>
                )}
                <span className="text-sm text-gray-600">CMC: {card.cmc}</span>
              </div>
              
              <div className="flex items-center space-x-3 mb-3">
                <span 
                  className="px-3 py-1 text-sm rounded-full text-white font-medium"
                  style={{ backgroundColor: getRarityColor(card.rarity) }}
                >
                  {formatRarity(card.rarity)}
                </span>
                <span className="text-sm text-gray-600">
                  {card.set_name} ({card.set_code.toUpperCase()})
                </span>
              </div>
              
              <p className="text-sm font-medium text-gray-700 mb-2">{card.type_line}</p>
              
              {card.oracle_text && (
                <div className="text-sm text-gray-600 mb-4 max-w-md">
                  {card.oracle_text.split('\n').map((line, index) => (
                    <p key={index} className="mb-1">{line}</p>
                  ))}
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-2 ml-4">
              {onViewDetails && (
                <button
                  onClick={() => onViewDetails(card.id)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>View Charts</span>
                </button>
              )}
              
              <a
                href={card.scryfall_uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Scryfall</span>
              </a>
              
              {card.purchase_uris.tcgplayer && (
                <a
                  href={card.purchase_uris.tcgplayer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buy</span>
                </a>
              )}
            </div>
          </div>
          
          {/* Pricing Section */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Prices</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availablePriceTypes.map(priceType => {
                const price = getPriceByType(card, priceType);
                if (price === null) return null;
                
                return (
                  <div key={priceType} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">
                      {formatPriceType(priceType)}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatPrice(price, priceType.includes('eur') ? 'EUR' : priceType === 'tix' ? 'TIX' : 'USD')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Watchlist Controls */}
          {showWatchlistControls && availablePriceTypes.length > 0 && (
            <div className="mt-4 border-t pt-4">
              {!showWatchlistForm ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Add to watchlist</span>
                  <button
                    onClick={() => setShowWatchlistForm(true)}
                    className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    <span>Watch</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedPriceType}
                      onChange={(e) => setSelectedPriceType(e.target.value as PriceType)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {availablePriceTypes.map(type => (
                        <option key={type} value={type}>
                          {formatPriceType(type)} - {formatPrice(getPriceByType(card, type), 
                            type.includes('eur') ? 'EUR' : type === 'tix' ? 'TIX' : 'USD')}
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Target price"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleAddToWatchlist}
                      disabled={!targetPrice || parseFloat(targetPrice) <= 0}
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                    
                    <button
                      onClick={() => setShowWatchlistForm(false)}
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <span>Cancel</span>
                    </button>
                    
                    {isInWatchlist && (
                      <button
                        onClick={handleRemoveFromWatchlist}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <HeartOff className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-3 text-xs text-gray-500">
            Released: {formatDate(card.released_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDisplay;