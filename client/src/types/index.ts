export interface Card {
  id: string;
  oracle_id: string;
  name: string;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  set_code: string;
  set_name: string;
  rarity: string;
  image_uris: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
    art_crop?: string;
    border_crop?: string;
  };
  scryfall_uri: string;
  purchase_uris: {
    tcgplayer?: string;
    cardmarket?: string;
    cardhoarder?: string;
  };
  prices?: CardPrices;
  released_at: string;
}

export interface CardPrices {
  usd?: number | null;
  usd_foil?: number | null;
  usd_etched?: number | null;
  eur?: number | null;
  eur_foil?: number | null;
  tix?: number | null;
}

export interface PriceHistory {
  id: number;
  card_id: string;
  date: string;
  usd?: number | null;
  usd_foil?: number | null;
  usd_etched?: number | null;
  eur?: number | null;
  eur_foil?: number | null;
  tix?: number | null;
  created_at: string;
}

export interface WatchlistItem {
  id: number;
  card_id: string;
  target_price: number;
  price_type: string;
  alert_enabled: boolean;
  created_at: string;
  name: string;
  image_uris: Card['image_uris'];
  scryfall_uri: string;
}

export interface SearchResult {
  local_results: Card[];
  scryfall_results: {
    total_cards: number;
    has_more: boolean;
    data: Card[];
  };
}

export interface CardDetailResponse {
  card: Card;
  price_history: PriceHistory[];
}

export type PriceType = 'usd' | 'usd_foil' | 'usd_etched' | 'eur' | 'eur_foil' | 'tix';