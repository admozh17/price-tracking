-- Cards table to store basic card information
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  oracle_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mana_cost TEXT,
  cmc INTEGER DEFAULT 0,
  type_line TEXT,
  oracle_text TEXT,
  set_code TEXT,
  set_name TEXT,
  rarity TEXT,
  image_uris TEXT, -- JSON string
  scryfall_uri TEXT,
  purchase_uris TEXT, -- JSON string
  released_at TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Price history table to track daily prices
CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  date DATE NOT NULL,
  usd REAL,
  usd_foil REAL,
  usd_etched REAL,
  eur REAL,
  eur_foil REAL,
  tix REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards (id),
  UNIQUE(card_id, date)
);

-- Watchlist table for tracking favorite cards
CREATE TABLE IF NOT EXISTS watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  target_price REAL,
  price_type TEXT DEFAULT 'usd', -- usd, usd_foil, eur, etc.
  alert_enabled BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards (id),
  UNIQUE(card_id, price_type)
);

-- Price alerts table to log when alerts are triggered
CREATE TABLE IF NOT EXISTS price_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  watchlist_id INTEGER NOT NULL,
  current_price REAL NOT NULL,
  target_price REAL NOT NULL,
  price_type TEXT NOT NULL,
  triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards (id),
  FOREIGN KEY (watchlist_id) REFERENCES watchlist (id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards (name);
CREATE INDEX IF NOT EXISTS idx_cards_oracle_id ON cards (oracle_id);
CREATE INDEX IF NOT EXISTS idx_price_history_card_date ON price_history (card_id, date);
CREATE INDEX IF NOT EXISTS idx_watchlist_card ON watchlist (card_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_triggered ON price_alerts (triggered_at);