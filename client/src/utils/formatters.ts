import { Card, PriceType } from '../types';

export const formatPrice = (price: number | null | undefined, currency: string = 'USD'): string => {
  if (price === null || price === undefined) {
    return 'N/A';
  }

  if (currency === 'TIX') {
    return `${price.toFixed(2)} TIX`;
  }

  const currencySymbol = currency === 'EUR' ? '€' : '$';
  return `${currencySymbol}${price.toFixed(2)}`;
};

export const getPriceByType = (card: Card, priceType: PriceType): number | null => {
  if (!card || !card.prices) {
    return null;
  }
  return card.prices[priceType] || null;
};

export const formatPriceType = (priceType: PriceType): string => {
  const typeMap: Record<PriceType, string> = {
    usd: 'USD',
    usd_foil: 'USD Foil',
    usd_etched: 'USD Etched',
    eur: 'EUR',
    eur_foil: 'EUR Foil',
    tix: 'MTGO Tix'
  };
  return typeMap[priceType] || priceType;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRarity = (rarity: string): string => {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
};

export const getRarityColor = (rarity: string): string => {
  const rarityColors: Record<string, string> = {
    common: '#1a1a1a',
    uncommon: '#c0c0c0',
    rare: '#ffb500',
    mythic: '#ff6b00',
    special: '#ff1744',
    bonus: '#9c27b0'
  };
  return rarityColors[rarity.toLowerCase()] || '#666666';
};

export const formatManaCost = (manaCost: string): string => {
  if (!manaCost) return '';
  
  // Replace mana symbols with readable text
  return manaCost
    .replace(/{([^}]+)}/g, '($1)')
    .replace(/([0-9]+)/g, '($1)');
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getImageUrl = (card: Card, size: 'small' | 'normal' | 'large' = 'normal'): string => {
  return card.image_uris[size] || card.image_uris.normal || '';
};

export const formatPriceChange = (
  currentPrice: number | null, 
  previousPrice: number | null
): { change: number; percentage: number; isPositive: boolean } => {
  if (!currentPrice || !previousPrice) {
    return { change: 0, percentage: 0, isPositive: true };
  }

  const change = currentPrice - previousPrice;
  const percentage = (change / previousPrice) * 100;
  
  return {
    change,
    percentage,
    isPositive: change >= 0
  };
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};