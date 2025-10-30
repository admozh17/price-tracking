// Demo historical data generator for testing purposes
// In production, this would be replaced with actual MTGJSON data

function generateDemoHistoricalPrices(cardName, currentPrice) {
  const historicalPrices = [];
  const endDate = new Date();
  
  // Generate 90 days of demo data
  for (let i = 0; i < 90; i++) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    
    // Create realistic price fluctuations
    const daysSinceStart = i;
    const trend = Math.sin(daysSinceStart / 30) * 0.1; // 30-day cycles
    const volatility = (Math.random() - 0.5) * 0.15; // ±15% random variation
    const priceMultiplier = 1 + trend + volatility;
    
    const basePrice = currentPrice || 5.0; // Default to $5 if no current price
    const historicalPrice = Math.max(0.01, basePrice * priceMultiplier);
    const foilPrice = historicalPrice * (1.5 + Math.random() * 0.5); // Foils 1.5-2x normal
    
    historicalPrices.push({
      date: date.toISOString().split('T')[0],
      usd: parseFloat(historicalPrice.toFixed(2)),
      usd_foil: parseFloat(foilPrice.toFixed(2)),
      usd_etched: null,
      eur: parseFloat((historicalPrice * 0.92).toFixed(2)), // Rough EUR conversion
      eur_foil: parseFloat((foilPrice * 0.92).toFixed(2)),
      tix: parseFloat((historicalPrice * 0.8).toFixed(2)) // MTGO prices usually lower
    });
  }
  
  return historicalPrices;
}

function generatePopularCardPrices() {
  // Some popular cards with realistic price ranges for demo
  const popularCards = {
    'Lightning Bolt': 2.5,
    'Black Lotus': 15000,
    'Tarmogoyf': 45,
    'Snapcaster Mage': 25,
    'Brainstorm': 8,
    'Force of Will': 120,
    'Mana Crypt': 180,
    'Sol Ring': 3,
    'Counterspell': 4,
    'Swords to Plowshares': 6
  };
  
  return popularCards;
}

async function getDemoHistoricalPrices(card) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const popularPrices = generatePopularCardPrices();
  const currentPrice = card.prices?.usd || popularPrices[card.name] || Math.random() * 20 + 1;
  
  return generateDemoHistoricalPrices(card.name, currentPrice);
}

module.exports = {
  generateDemoHistoricalPrices,
  generatePopularCardPrices,
  getDemoHistoricalPrices
};