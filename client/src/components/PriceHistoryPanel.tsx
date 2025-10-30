import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, BarChart3, Filter } from 'lucide-react';
import PriceChart from './PriceChart';
import { cardAPI } from '../services/api';
import { PriceHistory, Card, PriceType } from '../types';
import { formatPrice, formatDate, formatPriceType } from '../utils/formatters';

interface PriceHistoryPanelProps {
  card: Card;
  className?: string;
}

const PriceHistoryPanel: React.FC<PriceHistoryPanelProps> = ({ card, className = '' }) => {
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(30);
  const [selectedPriceTypes, setSelectedPriceTypes] = useState<PriceType[]>(['usd', 'usd_foil']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [view, setView] = useState<'chart' | 'table'>('chart');

  const timeframeOptions = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
    { label: '6 Months', value: 180 },
    { label: '1 Year', value: 365 },
    { label: 'All Time', value: 9999 }
  ];

  const availablePriceTypes: PriceType[] = [
    'usd', 'usd_foil', 'usd_etched', 'eur', 'eur_foil', 'tix'
  ];

  useEffect(() => {
    loadPriceHistory();
  }, [card.id, selectedTimeframe]);

  const loadPriceHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await cardAPI.getPriceHistory(card.id, selectedTimeframe);
      setPriceHistory(response.price_history || []);
    } catch (error) {
      console.error('Failed to load price history:', error);
      setError('Failed to load price history');
    } finally {
      setLoading(false);
    }
  };

  const togglePriceType = (priceType: PriceType) => {
    setSelectedPriceTypes(prev => 
      prev.includes(priceType) 
        ? prev.filter(t => t !== priceType)
        : [...prev, priceType]
    );
  };

  const getStatistics = (priceType: PriceType) => {
    const prices = priceHistory
      .map(entry => entry[priceType])
      .filter(price => price !== null && price !== undefined) as number[];
    
    if (prices.length === 0) return null;

    const current = prices[0]; // Most recent (first in DESC order)
    const oldest = prices[prices.length - 1];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const change = current - oldest;
    const changePercent = oldest !== 0 ? (change / oldest) * 100 : 0;

    return {
      current,
      min,
      max,
      avg,
      change,
      changePercent,
      isPositive: change >= 0
    };
  };

  const exportToCsv = () => {
    const headers = ['Date', ...selectedPriceTypes.map(formatPriceType)];
    const csvContent = [
      headers.join(','),
      ...priceHistory.map(entry => [
        entry.date,
        ...selectedPriceTypes.map(type => entry[type] || '')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.name.replace(/[^a-z0-9]/gi, '_')}_price_history.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Price History - {card.name}</span>
          </h3>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
              className={`p-2 rounded-lg transition-colors ${
                view === 'chart' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            
            <button
              onClick={exportToCsv}
              disabled={priceHistory.length === 0}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Timeframe Selector */}
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

          {/* Price Type Filters */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex flex-wrap gap-1">
              {availablePriceTypes.map(priceType => {
                const hasData = priceHistory.some(entry => 
                  entry[priceType] !== null && entry[priceType] !== undefined
                );
                if (!hasData) return null;

                const isSelected = selectedPriceTypes.includes(priceType);
                return (
                  <button
                    key={priceType}
                    onClick={() => togglePriceType(priceType)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {formatPriceType(priceType)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
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
        ) : priceHistory.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No price history available</p>
              <p className="text-sm">Prices will be tracked as the card is searched and viewed</p>
            </div>
          </div>
        ) : view === 'chart' ? (
          <PriceChart
            data={priceHistory}
            cardName={card.name}
            selectedPriceTypes={selectedPriceTypes}
            height={400}
          />
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                  {selectedPriceTypes.map(priceType => (
                    <th key={priceType} className="px-3 py-2 text-right font-medium text-gray-700">
                      {formatPriceType(priceType)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {priceHistory.slice(0, 50).map((entry, index) => (
                  <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 font-mono">{formatDate(entry.date)}</td>
                    {selectedPriceTypes.map(priceType => {
                      const price = entry[priceType];
                      const prevPrice = index < priceHistory.length - 1 ? priceHistory[index + 1][priceType] : null;
                      const isUp = price && prevPrice && price > prevPrice;
                      const isDown = price && prevPrice && price < prevPrice;
                      
                      return (
                        <td key={priceType} className="px-3 py-2 text-right font-mono">
                          {price ? (
                            <div className="flex items-center justify-end space-x-1">
                              <span>{formatPrice(price, 
                                priceType.includes('eur') ? 'EUR' : priceType === 'tix' ? 'TIX' : 'USD'
                              )}</span>
                              {isUp && <TrendingUp className="w-3 h-3 text-green-500" />}
                              {isDown && <TrendingDown className="w-3 h-3 text-red-500" />}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Statistics */}
        {priceHistory.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedPriceTypes.map(priceType => {
              const stats = getStatistics(priceType);
              if (!stats) return null;

              const currency = priceType.includes('eur') ? 'EUR' : priceType === 'tix' ? 'TIX' : 'USD';

              return (
                <div key={priceType} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{formatPriceType(priceType)}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current:</span>
                      <span className="font-semibold">{formatPrice(stats.current, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">High:</span>
                      <span className="text-green-600">{formatPrice(stats.max, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Low:</span>
                      <span className="text-red-600">{formatPrice(stats.min, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average:</span>
                      <span>{formatPrice(stats.avg, currency)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-gray-600">Change:</span>
                      <div className={`flex items-center space-x-1 font-semibold ${
                        stats.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stats.isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {stats.isPositive ? '+' : ''}{formatPrice(stats.change, currency)} 
                          ({stats.changePercent > 0 ? '+' : ''}{stats.changePercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceHistoryPanel;