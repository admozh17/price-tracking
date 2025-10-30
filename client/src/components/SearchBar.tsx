import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { debounce } from '../utils/formatters';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  loading?: boolean;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onClear,
  loading = false,
  placeholder = "Search Magic: The Gathering cards..."
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      if (searchQuery.trim()) {
        onSearch(searchQuery.trim());
      }
    }, 300),
    [onSearch]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      onClear();
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className={`relative w-full max-w-2xl mx-auto transition-all duration-200 ${
      isFocused ? 'transform scale-105' : ''
    }`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-12 py-3 
            border border-gray-300 rounded-lg 
            bg-white shadow-sm
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            transition-all duration-200
            text-gray-900 placeholder-gray-500
            ${isFocused ? 'shadow-lg' : ''}
          `}
          disabled={loading}
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
      
      {/* Search suggestions or hints could go here */}
      {isFocused && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
          <p className="text-sm text-gray-600 mb-2">Search tips:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Try searching for card names like "Lightning Bolt"</li>
            <li>• Search by card type like "creature dragon"</li>
            <li>• Use set codes like "set:dom" for Dominaria</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;