import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Calendar } from 'lucide-react';
import { cardAPI } from '../services/api';
import { formatPrice, getRarityColor, formatRarity } from '../utils/formatters';

interface MarketData {
  timeframe_days: number;
  top_gainers: CardMover[];
  top_losers: CardMover[];
  total_cards_tracked: number;
}

interface CardMover {
  id: string;
  name: string;
  set_name: string;
  rarity: string;
  current_usd: number;
  previous_usd: number;
  change_percent: number;
}

interface MarketOverviewProps {
  className?: string;
  onCardSelect?: (cardId: string) => void;
}

const MarketOverview: React.FC<MarketOverviewProps> = ({ 
  className = '', 
  onCardSelect 
}) => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(7);

  const timeframeOptions = [
    { label: '24 Hours', value: 1 },
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 }
  ];

  useEffect(() => {
    loadMarketData();
  }, [selectedTimeframe]);

  const loadMarketData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cardAPI.getMarketOverview(selectedTimeframe);
      setMarketData(data);
    } catch (error) {
      console.error('Failed to load market overview:', error);
      setError('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const renderCardRow = (card: CardMover, index: number) => {
    const isGainer = card.change_percent > 0;
    const changeAmount = card.current_usd - card.previous_usd;

    return (
      <div
        key={card.id}
        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
          index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
        } hover:bg-blue-50`}
        onClick={() => onCardSelect?.(card.id)}
      >
        <div className="flex-grow min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
            <h4 className="font-medium text-gray-900 truncate">{card.name}</h4>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span 
              className="px-2 py-1 text-xs rounded-full text-white"
              style={{ backgroundColor: getRarityColor(card.rarity) }}
            >
              {formatRarity(card.rarity)}
            </span>
            <span className="text-xs text-gray-500 truncate">{card.set_name}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              {formatPrice(card.current_usd)}
            </div>
            <div className="text-xs text-gray-500">
              was {formatPrice(card.previous_usd)}
            </div>
          </div>
          
          <div className={`flex items-center space-x-1 font-semibold ${
            isGainer ? 'text-green-600' : 'text-red-600'
          }`}>
            {isGainer ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <div className="text-right">
              <div className="text-sm">
                {isGainer ? '+' : ''}{card.change_percent.toFixed(1)}%
              </div>
              <div className="text-xs">
                {isGainer ? '+' : ''}{formatPrice(changeAmount)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Market Overview</h3>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {timeframeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={loadMarketData}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {marketData && (
          <div className="text-sm text-gray-600">
            Showing price changes for {marketData.total_cards_tracked} cards over {marketData.timeframe_days} days
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : marketData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Gainers */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Top Gainers</h4>
              </div>
              
              <div className="space-y-2">
                {marketData.top_gainers.length > 0 ? (
                  marketData.top_gainers.map((card, index) => renderCardRow(card, index))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No gainers data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Losers */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-gray-900">Top Losers</h4>
              </div>
              
              <div className="space-y-2">
                {marketData.top_losers.length > 0 ? (
                  marketData.top_losers.map((card, index) => renderCardRow(card, index))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingDown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No losers data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Market data will appear here</p>
              <p className="text-sm">Price tracking builds up over time as cards are searched</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketOverview;