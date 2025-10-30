import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { PriceHistory, PriceType } from '../types';
import { formatPrice, formatDate, formatPriceType } from '../utils/formatters';

interface PriceChartProps {
  data: PriceHistory[];
  cardName: string;
  selectedPriceTypes?: PriceType[];
  height?: number;
  showLegend?: boolean;
}

const PriceChart: React.FC<PriceChartProps> = ({
  data,
  cardName,
  selectedPriceTypes = ['usd', 'usd_foil'],
  height = 300,
  showLegend = true
}) => {
  // Transform data for recharts
  const chartData = data
    .map(entry => ({
      date: entry.date,
      formattedDate: formatDate(entry.date),
      usd: entry.usd,
      usd_foil: entry.usd_foil,
      usd_etched: entry.usd_etched,
      eur: entry.eur,
      eur_foil: entry.eur_foil,
      tix: entry.tix
    }))
    .reverse(); // Reverse to show oldest to newest

  // Colors for different price types
  const priceTypeColors: Record<PriceType, string> = {
    usd: '#3b82f6',
    usd_foil: '#f59e0b',
    usd_etched: '#8b5cf6',
    eur: '#10b981',
    eur_foil: '#f97316',
    tix: '#ef4444'
  };

  // Filter selected price types that have data
  const visiblePriceTypes = selectedPriceTypes.filter(priceType =>
    chartData.some(entry => entry[priceType] !== null && entry[priceType] !== undefined)
  );

  if (chartData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Price History - {cardName}
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No price history data available
        </div>
      </div>
    );
  }

  const formatTooltipValue = (value: any, name: string) => {
    if (value === null || value === undefined) return ['N/A', name];
    
    const currency = name.includes('eur') ? 'EUR' : name === 'tix' ? 'TIX' : 'USD';
    return [formatPrice(value, currency), formatPriceType(name as PriceType)];
  };

  const formatTooltipLabel = (label: string) => {
    return `Date: ${label}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Price History - {cardName}
      </h3>
      
      {visiblePriceTypes.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No price data available for selected types
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="formattedDate"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={formatTooltipValue}
              labelFormatter={formatTooltipLabel}
            />
            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => formatPriceType(value as PriceType)}
              />
            )}
            
            {visiblePriceTypes.map(priceType => (
              <Line
                key={priceType}
                type="monotone"
                dataKey={priceType}
                stroke={priceTypeColors[priceType]}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                activeDot={{
                  r: 4,
                  fill: priceTypeColors[priceType],
                  stroke: 'white',
                  strokeWidth: 2
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
      
      {/* Price Type Selector */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(['usd', 'usd_foil', 'usd_etched', 'eur', 'eur_foil', 'tix'] as PriceType[]).map(priceType => {
          const hasData = chartData.some(entry => entry[priceType] !== null && entry[priceType] !== undefined);
          if (!hasData) return null;
          
          const isSelected = selectedPriceTypes.includes(priceType);
          
          return (
            <button
              key={priceType}
              className={`
                px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${isSelected
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
              style={{
                backgroundColor: isSelected ? priceTypeColors[priceType] : undefined
              }}
              onClick={() => {
                // This would typically be handled by parent component
                console.log(`Toggle ${priceType}`);
              }}
            >
              {formatPriceType(priceType)}
            </button>
          );
        })}
      </div>
      
      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {visiblePriceTypes.map(priceType => {
          const prices = chartData
            .map(entry => entry[priceType])
            .filter(price => price !== null && price !== undefined) as number[];
          
          if (prices.length === 0) return null;
          
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const current = prices[prices.length - 1];
          const previous = prices.length > 1 ? prices[prices.length - 2] : current;
          const change = current - previous;
          const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
          
          const currency = priceType.includes('eur') ? 'EUR' : priceType === 'tix' ? 'TIX' : 'USD';
          
          return (
            <div key={priceType} className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">
                {formatPriceType(priceType)}
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Current: {formatPrice(current, currency)}</div>
                <div>High: {formatPrice(max, currency)}</div>
                <div>Low: {formatPrice(min, currency)}</div>
                <div className={`font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Change: {change >= 0 ? '+' : ''}{formatPrice(change, currency)} ({changePercent.toFixed(1)}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PriceChart;