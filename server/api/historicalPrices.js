const axios = require('axios');
const fs = require('fs');
const path = require('path');

class HistoricalPriceService {
  constructor() {
    this.mtgjsonBaseUrl = 'https://mtgjson.com/api/v5';
    this.cacheDir = path.join(__dirname, '../data/cache');
    this.allPricesFile = path.join(this.cacheDir, 'AllPrices.json');
    this.cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async downloadAllPrices() {
    try {
      console.log('Downloading MTGJSON AllPrices file...');
      const response = await axios.get(`${this.mtgjsonBaseUrl}/AllPrices.json`, {
        timeout: 300000, // 5 minutes timeout for large file
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(this.allPricesFile);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log('AllPrices file downloaded successfully');
          resolve();
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Failed to download AllPrices file:', error.message);
      throw error;
    }
  }

  async isAllPricesCacheValid() {
    try {
      if (!fs.existsSync(this.allPricesFile)) {
        return false;
      }

      const stats = fs.statSync(this.allPricesFile);
      const age = Date.now() - stats.mtime.getTime();
      
      return age < this.cacheMaxAge;
    } catch (error) {
      return false;
    }
  }

  async ensureAllPricesData() {
    const isValid = await this.isAllPricesCacheValid();
    
    if (!isValid) {
      console.log('AllPrices cache is stale or missing, downloading fresh data...');
      await this.downloadAllPrices();
    } else {
      console.log('Using cached AllPrices data');
    }
  }

  async getCardHistoricalPrices(scryfallId) {
    try {
      await this.ensureAllPricesData();

      // First, we need to find the MTGJSON UUID for this Scryfall ID
      // We'll look it up from a separate mapping or try to get it from Scryfall API
      const cardUuid = await this.getScryfallToMTGJSONMapping(scryfallId);
      
      if (!cardUuid) {
        console.log(`No MTGJSON UUID mapping found for Scryfall ID: ${scryfallId}`);
        return [];
      }

      // Read the large JSON file efficiently
      const data = fs.readFileSync(this.allPricesFile, 'utf8');
      const allPrices = JSON.parse(data);

      const cardPrices = allPrices.data[cardUuid];
      
      if (!cardPrices) {
        console.log(`No price data found for card UUID: ${cardUuid}`);
        return [];
      }

      // Transform MTGJSON price format to our format
      const historicalPrices = [];
      
      // MTGJSON stores prices by date, with each date containing price data from different providers
      for (const [date, dateData] of Object.entries(cardPrices)) {
        // Skip metadata keys
        if (typeof dateData !== 'object' || !dateData) continue;

        // Extract prices from different providers (cardkingdom, tcgplayer, etc.)
        const consolidatedPrices = this.consolidatePriceProviders(dateData);
        
        if (consolidatedPrices.usd || consolidatedPrices.eur || consolidatedPrices.tix) {
          historicalPrices.push({
            date: date,
            ...consolidatedPrices
          });
        }
      }

      // Sort by date (newest first)
      historicalPrices.sort((a, b) => new Date(b.date) - new Date(a.date));

      return historicalPrices;
    } catch (error) {
      console.error('Error getting historical prices:', error.message);
      return [];
    }
  }

  async getScryfallToMTGJSONMapping(scryfallId) {
    try {
      // Try to get the card data from Scryfall which includes identifiers
      const scryfallAPI = require('./scryfallAPI');
      const cardData = await scryfallAPI.getCardById(scryfallId);
      
      // Scryfall cards have various identifiers including MTGJSON UUID
      if (cardData.identifiers && cardData.identifiers.mtgjsonV4Id) {
        return cardData.identifiers.mtgjsonV4Id;
      }
      
      // Fallback: use the card's own UUID if it matches MTGJSON format
      if (cardData.id) {
        return cardData.id;
      }
      
      return null;
    } catch (error) {
      console.error('Error mapping Scryfall ID to MTGJSON UUID:', error.message);
      return null;
    }
  }

  consolidatePriceProviders(dateData) {
    const consolidated = {
      usd: null,
      usd_foil: null,
      usd_etched: null,
      eur: null,
      eur_foil: null,
      tix: null
    };

    // Priority order for price sources
    const providers = ['tcgplayer', 'cardkingdom', 'cardmarket', 'cardhoarder'];
    
    for (const provider of providers) {
      const providerData = dateData[provider];
      if (!providerData) continue;

      // Extract retail/market prices preferentially over buy prices
      if (providerData.retail) {
        consolidated.usd = consolidated.usd || providerData.retail.normal || null;
        consolidated.usd_foil = consolidated.usd_foil || providerData.retail.foil || null;
      }
      
      if (providerData.market) {
        consolidated.usd = consolidated.usd || providerData.market.normal || null;
        consolidated.usd_foil = consolidated.usd_foil || providerData.market.foil || null;
      }

      // Handle EUR prices from cardmarket
      if (provider === 'cardmarket' && providerData.retail) {
        consolidated.eur = consolidated.eur || providerData.retail.normal || null;
        consolidated.eur_foil = consolidated.eur_foil || providerData.retail.foil || null;
      }

      // Handle MTGO prices from cardhoarder
      if (provider === 'cardhoarder' && providerData.retail) {
        consolidated.tix = consolidated.tix || providerData.retail.normal || null;
      }
    }

    return consolidated;
  }

  async bulkImportHistoricalPrices(cards) {
    const { savePriceHistory } = require('../database/dbConnection');
    const { getDemoHistoricalPrices } = require('./demoHistoricalData');
    
    let importedCount = 0;
    let skippedCount = 0;

    for (const card of cards) {
      try {
        console.log(`Importing historical prices for: ${card.name}`);
        
        // For demo/development purposes, use generated demo data
        // TODO: In production, uncomment the MTGJSON integration below
        console.log(`Generating demo historical data for ${card.name}`);
        const historicalPrices = await getDemoHistoricalPrices(card);
        
        /* 
        // Production MTGJSON integration (currently disabled for demo)
        let historicalPrices;
        
        try {
          // Try to get real MTGJSON data first
          historicalPrices = await this.getCardHistoricalPrices(card.id);
        } catch (error) {
          console.log(`MTGJSON lookup failed for ${card.name}, using demo data`);
          historicalPrices = [];
        }
        
        // If no real data found, use demo data for demonstration
        if (historicalPrices.length === 0) {
          console.log(`Generating demo historical data for ${card.name}`);
          historicalPrices = await getDemoHistoricalPrices(card);
        }
        */
        
        if (historicalPrices.length === 0) {
          console.log(`No historical data available for ${card.name}`);
          skippedCount++;
          continue;
        }

        // Import each historical price point
        let pointsImported = 0;
        for (const pricePoint of historicalPrices) {
          try {
            await savePriceHistory(card.id, {
              usd: pricePoint.usd,
              usd_foil: pricePoint.usd_foil,
              usd_etched: pricePoint.usd_etched,
              eur: pricePoint.eur,
              eur_foil: pricePoint.eur_foil,
              tix: pricePoint.tix
            }, pricePoint.date);
            pointsImported++;
          } catch (error) {
            // Skip if price already exists for this date (constraint error)
            if (!error.message.includes('UNIQUE constraint')) {
              throw error;
            }
          }
        }

        importedCount++;
        console.log(`✓ Imported ${pointsImported} price points for ${card.name}`);
        
      } catch (error) {
        console.error(`Failed to import prices for ${card.name}:`, error.message);
        skippedCount++;
      }

      // Add delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      imported: importedCount,
      skipped: skippedCount,
      total: cards.length
    };
  }
}

module.exports = new HistoricalPriceService();