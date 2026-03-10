// Monopoly Bot AI - Makes smart decisions
// Board data is accessed via the game instance, no direct import needed

class MonopolyBot {
  constructor(gameInstance, botPlayers) {
    this.game = gameInstance;
    this.bots = botPlayers;
  }

  getActions(botId) {
    const state = this.game.getState();
    const bot = state.players.find(p => p.id === botId);
    if (!bot || bot.isBankrupt) return [];

    const actions = [];
    const phase = state.phase;

    if (phase === 'roll') {
      // Optionally pay to get out of jail
      if (bot.inJail) {
        if (bot.money > 300 && bot.jailTurns >= 1) {
          actions.push({ action: 'pay-jail', data: {} });
        }
      }
      actions.push({ action: 'roll', data: {} });
    }

    if (phase === 'buy') {
      const square = this.game.getState ? null : null;
      const pos = bot.position;
      const boardSquare = this.game.getState().board.find(s => s.id === pos);
      
      if (boardSquare && boardSquare.price) {
        const shouldBuy = this.shouldBuyProperty(state, bot, pos, boardSquare);
        if (shouldBuy && bot.money >= boardSquare.price) {
          actions.push({ action: 'buy', data: {} });
        } else {
          actions.push({ action: 'decline-buy', data: {} });
        }
      } else {
        actions.push({ action: 'end-turn', data: {} });
      }
    }

    if (phase === 'action') {
      // Try to build houses if we have monopolies
      const buildActions = this.getBuildActions(state, bot);
      actions.push(...buildActions);
      actions.push({ action: 'end-turn', data: {} });
    }

    if (phase === 'auction') {
      const auctionAction = this.getAuctionAction(state, bot);
      if (auctionAction) actions.push(auctionAction);
    }

    return actions;
  }

  shouldBuyProperty(state, bot, pos, square) {
    // Always buy if can afford and have money buffer
    if (bot.money - square.price < 100) return false;
    if (bot.money - square.price < 200 && square.price > 200) return false;
    
    // Check if it's part of a color group we own or want
    const owned = state.ownership;
    const groupSquares = state.board.filter(s => s.group && s.group === square.group);
    const weOwnInGroup = groupSquares.filter(s => owned[s.id] === bot.id).length;
    
    // Strong buy: we own others in group (close to monopoly)
    if (weOwnInGroup > 0) return true;
    
    // Buy railroads and utilities if we have budget
    if (!square.group) return bot.money > square.price + 200;
    
    // Buy cheaply priced properties
    if (square.price <= 200) return true;
    
    // Spend more money on valuable groups
    if (['red','yellow','green','darkblue'].includes(square.group)) {
      return bot.money > square.price + 400;
    }
    
    return bot.money > square.price + 300;
  }

  getBuildActions(state, bot) {
    const actions = [];
    const owned = state.ownership;
    const board = state.board;
    
    // Find monopolies
    const groups = {};
    bot.properties.forEach(pos => {
      const sq = board.find(s => s.id === pos);
      if (sq && sq.group) {
        if (!groups[sq.group]) groups[sq.group] = [];
        groups[sq.group].push(pos);
      }
    });

    Object.entries(groups).forEach(([group, positions]) => {
      const allInGroup = board.filter(s => s.group === group);
      const hasMonopoly = allInGroup.every(s => owned[s.id] === bot.id);
      
      if (hasMonopoly && bot.money > 300) {
        // Try to build on lowest house count property
        const housesBySq = positions.map(pos => ({ pos, h: state.houses[pos] || 0 }));
        housesBySq.sort((a, b) => a.h - b.h);
        
        const sq = board.find(s => s.id === housesBySq[0].pos);
        if (sq && housesBySq[0].h < 5 && bot.money > (sq.houseCost || 100) + 200) {
          actions.push({ action: 'build-house', data: { squareId: housesBySq[0].pos } });
        }
      }
    });

    return actions;
  }

  getAuctionAction(state, bot) {
    if (!state.auctionState) return null;
    const { squareId, currentBid } = state.auctionState;
    const square = state.board.find(s => s.id === squareId);
    
    if (!square || !square.price) return { action: 'auction-pass', data: {} };
    
    // Bid up to 80% of property value if we want it
    const shouldBuy = this.shouldBuyProperty(state, bot, squareId, square);
    const maxBid = shouldBuy ? Math.floor(square.price * 0.85) : Math.floor(square.price * 0.4);
    
    if (currentBid < maxBid && bot.money > currentBid + 10) {
      const bid = Math.min(currentBid + Math.floor(Math.random() * 20) + 10, maxBid);
      if (bid <= bot.money - 100) {
        return { action: 'auction-bid', data: { amount: bid } };
      }
    }
    
    return { action: 'auction-pass', data: {} };
  }
}

module.exports = MonopolyBot;
