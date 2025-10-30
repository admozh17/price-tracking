const express = require('express');
const router = express.Router();
const scryfallAPI = require('./scryfallAPI');
const { 
  saveCard, 
  savePriceHistory, 
  getCard, 
  searchCards, 
  getPriceHistory,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist 
} = require('../database/dbConnection');

// Search cards from Scryfall and save to local database
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // First try local database
    const localResults = await searchCards(q, 10);
    
    // Then search Scryfall for more comprehensive results
    const scryfallResults = await scryfallAPI.searchCards(q, page);
    
    // Save new cards to database
    if (scryfallResults.data && scryfallResults.data.length > 0) {
      for (const card of scryfallResults.data) {
        const cardData = scryfallAPI.extractCardData(card);
        await saveCard(cardData);
        await savePriceHistory(cardData.id, cardData.prices);
      }
    }

    res.json({
      local_results: localResults,
      scryfall_results: {
        total_cards: scryfallResults.total_cards || 0,
        has_more: scryfallResults.has_more || false,
        data: scryfallResults.data ? scryfallResults.data.map(card => 
          scryfallAPI.extractCardData(card)
        ) : []
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Failed to search cards', 
      message: error.message 
    });
  }
});

// Get specific card by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try local database first
    let card = await getCard(id);
    
    // If not found locally, fetch from Scryfall
    if (!card) {
      const scryfallCard = await scryfallAPI.getCardById(id);
      const cardData = scryfallAPI.extractCardData(scryfallCard);
      await saveCard(cardData);
      await savePriceHistory(cardData.id, cardData.prices);
      card = cardData;
    }
    
    // Get price history
    const priceHistory = await getPriceHistory(id, 30);
    
    res.json({
      card,
      price_history: priceHistory
    });
  } catch (error) {
    console.error('Card fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch card', 
      message: error.message 
    });
  }
});

// Get card by exact name
router.get('/named/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    const scryfallCard = await scryfallAPI.getCardByName(name);
    const cardData = scryfallAPI.extractCardData(scryfallCard);
    
    // Save to database
    await saveCard(cardData);
    await savePriceHistory(cardData.id, cardData.prices);
    
    // Get price history
    const priceHistory = await getPriceHistory(cardData.id, 30);
    
    res.json({
      card: cardData,
      price_history: priceHistory
    });
  } catch (error) {
    console.error('Named card fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch card by name', 
      message: error.message 
    });
  }
});

// Get random card (for discovery)
router.get('/random/card', async (req, res) => {
  try {
    const scryfallCard = await scryfallAPI.getRandomCard();
    const cardData = scryfallAPI.extractCardData(scryfallCard);
    
    // Save to database
    await saveCard(cardData);
    await savePriceHistory(cardData.id, cardData.prices);
    
    res.json({ card: cardData });
  } catch (error) {
    console.error('Random card fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch random card', 
      message: error.message 
    });
  }
});

// Get price history for a card
router.get('/:id/prices', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    
    const priceHistory = await getPriceHistory(id, parseInt(days));
    const card = await getCard(id);
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    res.json({
      card_name: card.name,
      price_history: priceHistory
    });
  } catch (error) {
    console.error('Price history error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch price history', 
      message: error.message 
    });
  }
});

// Watchlist routes
router.get('/watchlist/all', async (req, res) => {
  try {
    const watchlist = await getWatchlist();
    res.json({ watchlist });
  } catch (error) {
    console.error('Watchlist fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch watchlist', 
      message: error.message 
    });
  }
});

router.post('/watchlist/add', async (req, res) => {
  try {
    const { card_id, target_price, price_type = 'usd' } = req.body;
    
    if (!card_id || !target_price) {
      return res.status(400).json({ 
        error: 'card_id and target_price are required' 
      });
    }
    
    const result = await addToWatchlist(card_id, target_price, price_type);
    res.json({ 
      success: true, 
      message: 'Added to watchlist',
      id: result.id 
    });
  } catch (error) {
    console.error('Watchlist add error:', error);
    res.status(500).json({ 
      error: 'Failed to add to watchlist', 
      message: error.message 
    });
  }
});

router.delete('/watchlist/remove/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    const { price_type = 'usd' } = req.query;
    
    const result = await removeFromWatchlist(cardId, price_type);
    res.json({ 
      success: true, 
      message: 'Removed from watchlist',
      changes: result.changes
    });
  } catch (error) {
    console.error('Watchlist remove error:', error);
    res.status(500).json({ 
      error: 'Failed to remove from watchlist', 
      message: error.message 
    });
  }
});

// Update prices for cards in watchlist (can be run daily via cron)
router.post('/prices/update', async (req, res) => {
  try {
    const watchlist = await getWatchlist();
    const cardIds = [...new Set(watchlist.map(item => item.card_id))];
    
    let updatedCount = 0;
    
    for (const cardId of cardIds) {
      try {
        const scryfallCard = await scryfallAPI.getCardById(cardId);
        const cardData = scryfallAPI.extractCardData(scryfallCard);
        
        await saveCard(cardData);
        await savePriceHistory(cardData.id, cardData.prices);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update card ${cardId}:`, error.message);
      }
    }
    
    res.json({ 
      success: true, 
      updated_cards: updatedCount,
      total_cards: cardIds.length
    });
  } catch (error) {
    console.error('Price update error:', error);
    res.status(500).json({ 
      error: 'Failed to update prices', 
      message: error.message 
    });
  }
});

module.exports = router;