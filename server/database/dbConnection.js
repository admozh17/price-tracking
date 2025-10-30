const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/mtg_prices.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error connecting to database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  async initializeDatabase() {
    if (!this.db) {
      await this.connect();
    }

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) {
          console.error('Error initializing database:', err.message);
          reject(err);
        } else {
          console.log('Database initialized successfully');
          resolve();
        }
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

const database = new Database();

// Card operations
const cardOperations = {
  async saveCard(cardData) {
    const sql = `
      INSERT OR REPLACE INTO cards 
      (id, oracle_id, name, mana_cost, cmc, type_line, oracle_text, 
       set_code, set_name, rarity, image_uris, scryfall_uri, 
       purchase_uris, released_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    const params = [
      cardData.id,
      cardData.oracle_id,
      cardData.name,
      cardData.mana_cost,
      cardData.cmc,
      cardData.type_line,
      cardData.oracle_text,
      cardData.set_code,
      cardData.set_name,
      cardData.rarity,
      JSON.stringify(cardData.image_uris),
      cardData.scryfall_uri,
      JSON.stringify(cardData.purchase_uris),
      cardData.released_at
    ];
    
    return await database.run(sql, params);
  },

  async savePriceHistory(cardId, prices, customDate = null) {
    const date = customDate || new Date().toISOString().split('T')[0];
    const sql = `
      INSERT OR REPLACE INTO price_history 
      (card_id, date, usd, usd_foil, usd_etched, eur, eur_foil, tix)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      cardId,
      date,
      prices.usd,
      prices.usd_foil,
      prices.usd_etched,
      prices.eur,
      prices.eur_foil,
      prices.tix
    ];
    
    return await database.run(sql, params);
  },

  async getCard(cardId) {
    const sql = 'SELECT * FROM cards WHERE id = ?';
    const card = await database.get(sql, [cardId]);
    
    if (card) {
      card.image_uris = JSON.parse(card.image_uris || '{}');
      card.purchase_uris = JSON.parse(card.purchase_uris || '{}');
      
      // Get latest prices for this card
      const latestPricesSql = `
        SELECT usd, usd_foil, usd_etched, eur, eur_foil, tix 
        FROM price_history 
        WHERE card_id = ? 
        ORDER BY date DESC 
        LIMIT 1
      `;
      const latestPrices = await database.get(latestPricesSql, [cardId]);
      
      card.prices = latestPrices || {
        usd: null,
        usd_foil: null,
        usd_etched: null,
        eur: null,
        eur_foil: null,
        tix: null
      };
    }
    
    return card;
  },

  async searchCards(query, limit = 20) {
    const sql = `
      SELECT c.*, ph.usd, ph.usd_foil, ph.usd_etched, ph.eur, ph.eur_foil, ph.tix
      FROM cards c
      LEFT JOIN (
        SELECT card_id, usd, usd_foil, usd_etched, eur, eur_foil, tix,
               ROW_NUMBER() OVER (PARTITION BY card_id ORDER BY date DESC) as rn
        FROM price_history
      ) ph ON c.id = ph.card_id AND ph.rn = 1
      WHERE c.name LIKE ? OR c.type_line LIKE ?
      ORDER BY c.name
      LIMIT ?
    `;
    const searchTerm = `%${query}%`;
    const cards = await database.all(sql, [searchTerm, searchTerm, limit]);
    
    return cards.map(card => {
      card.image_uris = JSON.parse(card.image_uris || '{}');
      card.purchase_uris = JSON.parse(card.purchase_uris || '{}');
      card.prices = {
        usd: card.usd || null,
        usd_foil: card.usd_foil || null,
        usd_etched: card.usd_etched || null,
        eur: card.eur || null,
        eur_foil: card.eur_foil || null,
        tix: card.tix || null
      };
      
      // Remove the price columns from the card object
      delete card.usd;
      delete card.usd_foil;
      delete card.usd_etched;
      delete card.eur;
      delete card.eur_foil;
      delete card.tix;
      delete card.rn;
      
      return card;
    });
  },

  async getPriceHistory(cardId, days = 30) {
    const sql = `
      SELECT * FROM price_history 
      WHERE card_id = ?
      ORDER BY date DESC
      LIMIT ?
    `;
    return await database.all(sql, [cardId, days]);
  },

  async getWatchlist() {
    const sql = `
      SELECT w.*, c.name, c.image_uris, c.scryfall_uri
      FROM watchlist w
      JOIN cards c ON w.card_id = c.id
      WHERE w.alert_enabled = 1
      ORDER BY w.created_at DESC
    `;
    const watchlist = await database.all(sql);
    
    return watchlist.map(item => {
      item.image_uris = JSON.parse(item.image_uris || '{}');
      return item;
    });
  },

  async addToWatchlist(cardId, targetPrice, priceType = 'usd') {
    const sql = `
      INSERT OR REPLACE INTO watchlist (card_id, target_price, price_type)
      VALUES (?, ?, ?)
    `;
    return await database.run(sql, [cardId, targetPrice, priceType]);
  },

  async removeFromWatchlist(cardId, priceType = 'usd') {
    const sql = 'DELETE FROM watchlist WHERE card_id = ? AND price_type = ?';
    return await database.run(sql, [cardId, priceType]);
  }
};

module.exports = {
  database,
  initializeDatabase: () => database.initializeDatabase(),
  ...cardOperations
};