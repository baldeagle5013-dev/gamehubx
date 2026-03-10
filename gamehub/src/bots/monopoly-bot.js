// Monopoly Bot AI — turn actions + trade intelligence

class MonopolyBot {
  constructor(gameInstance, botPlayers) {
    this.game = gameInstance;
    this.bots = botPlayers;
    // Track trades proposed this turn to avoid spamming
    this.proposedThisTurn = new Set();
  }

  // ─── TURN ACTIONS ────────────────────────────────────────────
  getActions(botId) {
    const state = this.game.getState();
    const bot = state.players.find(p => p.id === botId);
    if (!bot || bot.isBankrupt) return [];

    const actions = [];
    const phase = state.phase;

    if (phase === 'roll') {
      if (bot.inJail && bot.money > 300 && bot.jailTurns >= 1) {
        actions.push({ action: 'pay-jail', data: {} });
      }
      actions.push({ action: 'roll', data: {} });
    }

    if (phase === 'buy') {
      const pos = bot.position;
      const sq = state.board.find(s => s.id === pos);
      if (sq && sq.price) {
        if (this.shouldBuyProperty(state, bot, pos, sq) && bot.money >= sq.price) {
          actions.push({ action: 'buy', data: {} });
        } else {
          actions.push({ action: 'decline-buy', data: {} });
        }
      } else {
        actions.push({ action: 'end-turn', data: {} });
      }
    }

    if (phase === 'action') {
      const buildActions = this.getBuildActions(state, bot);
      actions.push(...buildActions);
      // Clear proposed trades at start of each action phase
      this.proposedThisTurn.clear();
      actions.push({ action: 'end-turn', data: {} });
    }

    if (phase === 'auction') {
      const auctionAction = this.getAuctionAction(state, bot);
      if (auctionAction) actions.push(auctionAction);
    }

    return actions;
  }

  // ─── TRADE INITIATION ────────────────────────────────────────
  // Returns a trade object if the bot wants to propose one, or null.
  // Called by the server after a bot's turn ends.
  getTradeProposal(botId) {
    const state = this.game.getState();
    const bot = state.players.find(p => p.id === botId);
    if (!bot || bot.isBankrupt || bot.money < 50) return null;

    // Look for groups where we own some but not all
    const board = state.board;
    const groups = {};
    board.filter(s => s.group).forEach(sq => {
      if (!groups[sq.group]) groups[sq.group] = [];
      groups[sq.group].push(sq);
    });

    for (const [group, squares] of Object.entries(groups)) {
      const botOwns    = squares.filter(s => state.ownership[s.id] === botId);
      const othersOwn  = squares.filter(s => state.ownership[s.id] && state.ownership[s.id] !== botId);
      const unowned    = squares.filter(s => !state.ownership[s.id]);

      // Skip if we already have the monopoly or nothing to gain
      if (botOwns.length === squares.length) continue;
      if (unowned.length > 0) continue; // can still buy from bank
      if (othersOwn.length === 0) continue;

      // We own at least 1, others own the rest — trade opportunity
      if (botOwns.length === 0) continue;

      // Find the player who owns the missing piece(s)
      const targetId = othersOwn[0] && state.ownership[othersOwn[0].id];
      if (!targetId) continue;
      const targetPlayer = state.players.find(p => p.id === targetId);
      if (!targetPlayer || targetPlayer.isBankrupt) continue;

      // Don't propose to same target twice this turn
      const key = `${botId}->${targetId}-${group}`;
      if (this.proposedThisTurn.has(key)) continue;

      // Build the offer: give cash, possibly give one of our less-valuable properties
      const wantProps = othersOwn.map(s => s.id);

      // Value the missing properties
      const missingValue = othersOwn.reduce((sum, s) => sum + (s.price || 0), 0);

      // Offer: cash at ~110% of market value (we really want this monopoly)
      const cashOffer = Math.min(
        Math.floor(missingValue * 1.1),
        bot.money - 200 // keep a buffer
      );
      if (cashOffer < missingValue * 0.7) continue; // can't afford a fair offer

      // Optionally sweeten with one of our cheap surplus properties
      const offerProps = this.getSurplusProp(state, bot, group);

      this.proposedThisTurn.add(key);

      return {
        from: botId,
        to: targetId,
        offerProps: offerProps ? [offerProps] : [],
        requestProps: wantProps,
        offerMoney: cashOffer,
        requestMoney: 0,
        id: Date.now().toString() + Math.random().toString(36).slice(2),
      };
    }

    return null;
  }

  // ─── TRADE RESPONSE ──────────────────────────────────────────
  // Called when an incoming trade is aimed at this bot.
  // Returns true to accept, false to decline.
  shouldAcceptTrade(botId, trade) {
    const state = this.game.getState();
    const bot = state.players.find(p => p.id === botId);
    if (!bot || bot.isBankrupt) return false;

    const netWorthBefore = this.calcNetWorth(bot, state);

    // Simulate the trade on a lightweight snapshot
    const simBot = {
      id: bot.id,
      money: bot.money,
      properties: [...bot.properties],
    };
    const simOwnership = { ...state.ownership };
    const simHouses = { ...state.houses };

    // Apply trade to sim
    // We give away requestProps and offerMoney, receive offerProps and requestMoney
    trade.requestProps.forEach(pos => {
      if (simOwnership[pos] !== botId) return;
      simOwnership[pos] = trade.from;
      simBot.properties = simBot.properties.filter(p => p !== pos);
    });
    trade.offerProps.forEach(pos => {
      simOwnership[pos] = botId;
      simBot.properties.push(pos);
    });
    simBot.money -= (trade.requestMoney || 0);
    simBot.money += (trade.offerMoney || 0);

    if (simBot.money < 50) return false; // refuse if it leaves us broke

    // Build a fake state for net worth calc
    const simState = { ...state, ownership: simOwnership, houses: simHouses };
    const netWorthAfter = this.calcNetWorth(simBot, simState);

    // Accept if net worth improves or stays within 5% (might still be strategically good)
    const worthwhile = netWorthAfter >= netWorthBefore * 0.95;

    // Extra: refuse if the trade gives opponent a monopoly and we get nothing special
    const opponentGetsMonopoly = this.tradeGivesOpponentMonopoly(trade, state, trade.from);
    if (opponentGetsMonopoly && !worthwhile) return false;

    return worthwhile;
  }

  // ─── HELPERS ─────────────────────────────────────────────────
  calcNetWorth(player, state) {
    let w = player.money;
    player.properties.forEach(pos => {
      const sq = state.board ? state.board.find(s => s.id === pos) : null;
      if (!sq) return;
      const mortgaged = state.mortgaged && state.mortgaged[pos];
      w += mortgaged ? (sq.mortgage || Math.floor((sq.price || 0) / 2)) : (sq.price || 0);
      const h = state.houses && state.houses[pos] || 0;
      w += h * ((sq.houseCost || 0) / 2);
    });
    return w;
  }

  tradeGivesOpponentMonopoly(trade, state, opponentId) {
    const board = state.board;
    const simOwnership = { ...state.ownership };
    trade.requestProps.forEach(pos => { simOwnership[pos] = opponentId; });
    trade.offerProps.forEach(pos => { delete simOwnership[pos]; });

    const groups = {};
    board.filter(s => s.group).forEach(sq => {
      if (!groups[sq.group]) groups[sq.group] = [];
      groups[sq.group].push(sq);
    });

    for (const squares of Object.values(groups)) {
      if (squares.every(s => simOwnership[s.id] === opponentId)) return true;
    }
    return false;
  }

  // Find a surplus property we own that isn't part of a near-monopoly group
  getSurplusProp(state, bot, excludeGroup) {
    const board = state.board;
    const groups = {};
    bot.properties.forEach(pos => {
      const sq = board.find(s => s.id === pos);
      if (sq && sq.group) {
        if (!groups[sq.group]) groups[sq.group] = [];
        groups[sq.group].push(pos);
      }
    });

    // Find groups we only own 1 of (surplus, not near-monopoly) and not the current target group
    for (const [group, positions] of Object.entries(groups)) {
      if (group === excludeGroup) continue;
      const allInGroup = board.filter(s => s.group === group);
      const othersOwn = allInGroup.some(s => state.ownership[s.id] && state.ownership[s.id] !== bot.id);
      // Only offer if others also own in this group (making our piece useless alone)
      if (positions.length === 1 && othersOwn) {
        return positions[0];
      }
    }
    return null;
  }

  shouldBuyProperty(state, bot, pos, square) {
    if (bot.money - square.price < 100) return false;
    if (bot.money - square.price < 200 && square.price > 200) return false;
    const owned = state.ownership;
    const groupSquares = state.board.filter(s => s.group && s.group === square.group);
    const weOwnInGroup = groupSquares.filter(s => owned[s.id] === bot.id).length;
    if (weOwnInGroup > 0) return true;
    if (!square.group) return bot.money > square.price + 200;
    if (square.price <= 200) return true;
    if (['red','yellow','green','darkblue'].includes(square.group)) return bot.money > square.price + 400;
    return bot.money > square.price + 300;
  }

  getBuildActions(state, bot) {
    const actions = [];
    const owned = state.ownership;
    const board = state.board;
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
    const shouldBuy = this.shouldBuyProperty(state, bot, squareId, square);
    const maxBid = shouldBuy ? Math.floor(square.price * 0.85) : Math.floor(square.price * 0.4);
    if (currentBid < maxBid && bot.money > currentBid + 10) {
      const bid = Math.min(currentBid + Math.floor(Math.random() * 20) + 10, maxBid);
      if (bid <= bot.money - 100) return { action: 'auction-bid', data: { amount: bid } };
    }
    return { action: 'auction-pass', data: {} };
  }
}

module.exports = MonopolyBot;
