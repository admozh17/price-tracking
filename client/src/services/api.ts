import axios from 'axios';
import { SearchResult, CardDetailResponse, WatchlistItem, PriceType } from '../types';

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000,
});

export const cardAPI = {
  searchCards: async (query: string, page: number = 1): Promise<SearchResult> => {
    const response = await api.get(`/cards/search`, { 
      params: { q: query, page } 
    });
    return response.data;
  },

  getCardById: async (id: string): Promise<CardDetailResponse> => {
    const response = await api.get(`/cards/${id}`);
    return response.data;
  },

  getCardByName: async (name: string): Promise<CardDetailResponse> => {
    const response = await api.get(`/cards/named/${encodeURIComponent(name)}`);
    return response.data;
  },

  getRandomCard: async (): Promise<{ card: any }> => {
    const response = await api.get('/cards/random/card');
    return response.data;
  },

  getPriceHistory: async (cardId: string, days: number = 30) => {
    const response = await api.get(`/cards/${cardId}/prices`, { 
      params: { days } 
    });
    return response.data;
  },

  getWatchlist: async (): Promise<{ watchlist: WatchlistItem[] }> => {
    const response = await api.get('/cards/watchlist/all');
    return response.data;
  },

  addToWatchlist: async (
    cardId: string, 
    targetPrice: number, 
    priceType: PriceType = 'usd'
  ) => {
    const response = await api.post('/cards/watchlist/add', {
      card_id: cardId,
      target_price: targetPrice,
      price_type: priceType
    });
    return response.data;
  },

  removeFromWatchlist: async (cardId: string, priceType: PriceType = 'usd') => {
    const response = await api.delete(`/cards/watchlist/remove/${cardId}`, {
      params: { price_type: priceType }
    });
    return response.data;
  },

  updatePrices: async () => {
    const response = await api.post('/cards/prices/update');
    return response.data;
  },

  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

export default api;