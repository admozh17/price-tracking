const axios = require('axios');

class ScryfallAPI {
  constructor() {
    this.baseURL = 'https://api.scryfall.com';
    this.rateLimitDelay = 100; // 100ms delay between requests
  }

  async makeRequest(endpoint, params = {}) {
    try {
      await this.delay(this.rateLimitDelay);
      
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        params,
        headers: {
          'User-Agent': 'MTG-Price-Tracker/1.0',
          'Accept': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Scryfall API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.details || 'Failed to fetch from Scryfall API');
    }
  }

  async searchCards(query, page = 1) {
    const params = {
      q: query,
      page: page,
      order: 'name',
      unique: 'cards'
    };
    
    return await this.makeRequest('/cards/search', params);
  }

  async getCardById(id) {
    return await this.makeRequest(`/cards/${id}`);
  }

  async getCardByName(exact_name) {
    return await this.makeRequest('/cards/named', { exact: exact_name });
  }

  async getRandomCard() {
    return await this.makeRequest('/cards/random');
  }

  async getCardCollection(identifiers) {
    try {
      await this.delay(this.rateLimitDelay);
      
      const response = await axios.post(`${this.baseURL}/cards/collection`, {
        identifiers: identifiers
      }, {
        headers: {
          'User-Agent': 'MTG-Price-Tracker/1.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Scryfall Collection API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.details || 'Failed to fetch card collection');
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  extractCardPrices(card) {
    const prices = card.prices || {};
    return {
      usd: prices.usd ? parseFloat(prices.usd) : null,
      usd_foil: prices.usd_foil ? parseFloat(prices.usd_foil) : null,
      usd_etched: prices.usd_etched ? parseFloat(prices.usd_etched) : null,
      eur: prices.eur ? parseFloat(prices.eur) : null,
      eur_foil: prices.eur_foil ? parseFloat(prices.eur_foil) : null,
      tix: prices.tix ? parseFloat(prices.tix) : null
    };
  }

  extractCardData(card) {
    return {
      id: card.id,
      oracle_id: card.oracle_id,
      name: card.name,
      mana_cost: card.mana_cost || '',
      cmc: card.cmc || 0,
      type_line: card.type_line || '',
      oracle_text: card.oracle_text || '',
      set_code: card.set,
      set_name: card.set_name,
      rarity: card.rarity,
      image_uris: card.image_uris || {},
      scryfall_uri: card.scryfall_uri,
      purchase_uris: card.purchase_uris || {},
      prices: this.extractCardPrices(card),
      released_at: card.released_at
    };
  }
}

module.exports = new ScryfallAPI();