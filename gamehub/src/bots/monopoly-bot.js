// Monopoly Bot AI — turn actions + trade intelligence

class MonopolyBot {
  constructor(gameInstance, botPlayers) {
    this.game = gameInstance;
    this.bots = botPlayers;
    // Track trades per group: groupKey -> { lastTurnProposed, declineCount }
    // Prevents spamming the same offer every single turn
    this.tradeCooldowns = {};
    this.currentTurn = 0;
  }

  // ─── TURN ACTIONS ────────────────────────────────────────────
  getActions(botId) {
    const state = this.game.getState();
    const bot = state.players.find(p => p.id === botId);
    if (!bot || bot.isBankrupt) return [];
    this.currentTurn = state.turnCount || 0;

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
      actions.push({ action: 'end-turn', data: {} });
    }

    if (phase === 'auction') {
      const auctionAction = this.getAuctionAction(state, bot);
      if (auctionAction) actions.push(auctionAction);
    }

    return actions;
  }

  // ─── TRADE INITIATION ────────────────────────────────────────
  getTradeProposal(botId) {
    const state = this.game.getState();
    const bot = state.players.find(p => p.id === botId);
    if (!bot || bot.isBankrupt || bot.money < 100) return null;

    const board = state.board;
    const groups = {};
    board.filter(s => s.group).forEach(sq => {
      if (!groups[sq.group]) groups[sq.group] = [];
      groups[sq.group].push(sq);
    });

    // Score each possible trade opportunity and pick the best one
    const opportunities = [];

    for (const [group, squares] of Object.entries(groups)) {
      const botOwns    = squares.filter(s => state.ownership[s.id] === botId);
      const allOwned   = squares.every(s => !!state.ownership[s.id]);
      const hasMonopoly = squares.every(s => state.ownership[s.id] === botId);

      if (hasMonopoly) continue;      // already have it
      if (!allOwned) continue;        // still buyable from bank
      if (botOwns.length === 0) continue; // we have no stake in this group

      // Check per-group cooldown: don't propose to same group within 4 turns,
      // and if they declined 2+ times, wait 8 turns
      const cooldownKey = `${botId}-${group}`;
      const cd = this.tradeCooldowns[cooldownKey];
      const now = this.currentTurn;
      if (cd) {
        const waitTurns = cd.declines >= 2 ? 8 : 4;
        if (now - cd.lastProposed < waitTurns) continue;
      }

      // Find who owns the missing pieces
      const missing = squares.filter(s => state.ownership[s.id] && state.ownership[s.id] !== botId);
      if (!missing.length) continue;

      // Group all missing by owner — only target a single player per trade
      const ownerCounts = {};
      missing.forEach(s => {
        ownerCounts[state.ownership[s.id]] = (ownerCounts[state.ownership[s.id]] || 0) + 1;
      });
      const [targetId] = Object.entries(ownerCounts).sort((a,b) => b[1]-a[1])[0];
      const targetPlayer = state.players.find(p => p.id === targetId);
      if (!targetPlayer || targetPlayer.isBankrupt) continue;

      // Don't offer to a player who already has a monopoly (they won't want to deal)
      const targetAlreadyHasMonopoly = Object.values(groups).some(sqs =>
        sqs.every(s => state.ownership[s.id] === targetId)
      );

      const wantProps = missing.filter(s => state.ownership[s.id] === targetId).map(s => s.id);
      const missingValue = wantProps.reduce((sum, pos) => {
        const s = board.find(sq => sq.id === pos); return sum + (s?.price || 0);
      }, 0);

      // How much is this monopoly worth to us? More squares we own = more urgent
      const monopolyUrgency = botOwns.length / squares.length; // 0.33 to 0.67+
      const premium = 1.0 + monopolyUrgency * 0.35; // up to 1.35× market
      const cashOffer = Math.min(
        Math.floor(missingValue * premium),
        bot.money - 200
      );
      if (cashOffer < missingValue * 0.6) continue;

      // Can we sweeten with a surplus prop?
      const surplusProp = this.getSurplusProp(state, bot, group, targetId);

      opportunities.push({
        group, targetId, wantProps, cashOffer, surplusProp,
        score: monopolyUrgency * missingValue, // higher = better deal for us
        cooldownKey,
      });
    }

    if (!opportunities.length) return null;

    // Pick highest-score opportunity
    opportunities.sort((a, b) => b.score - a.score);
    const best = opportunities[0];

    // Record this proposal in cooldowns
    const cd = this.tradeCooldowns[best.cooldownKey] || { declines: 0 };
    this.tradeCooldowns[best.cooldownKey] = { ...cd, lastProposed: this.currentTurn };

    return {
      from: botId,
      to: best.targetId,
      offerProps: best.surplusProp ? [best.surplusProp] : [],
      requestProps: best.wantProps,
      offerMoney: best.cashOffer,
      requestMoney: 0,
      id: Date.now().toString() + Math.random().toString(36).slice(2),
    };
  }

  // Called when a trade this bot proposed was declined — increase cooldown
  recordDecline(botId, group) {
    const key = `${botId}-${group}`;
    const cd = this.tradeCooldowns[key] || { lastProposed: 0 };
    this.tradeCooldowns[key] = { lastProposed: this.currentTurn, declines: (cd.declines || 0) + 1 };
  }

  // ─── TRADE RESPONSE ──────────────────────────────────────────
  shouldAcceptTrade(botId, trade) {
    const state = this.game.getState();
    const bot = state.players.find(p => p.id === botId);
    if (!bot || bot.isBankrupt) return false;

    const nwBefore = this.calcNetWorth(bot, state);

    // Simulate trade on a snapshot
    const simOwnership = { ...state.ownership };
    const simProps = [...bot.properties];
    let simMoney = bot.money;

    trade.requestProps.forEach(pos => {
      if (simOwnership[pos] !== botId) return;
      simOwnership[pos] = trade.from;
      const idx = simProps.indexOf(pos); if (idx >= 0) simProps.splice(idx, 1);
    });
    trade.offerProps.forEach(pos => {
      simOwnership[pos] = botId; simProps.push(pos);
    });
    simMoney -= (trade.requestMoney || 0);
    simMoney += (trade.offerMoney || 0);

    if (simMoney < 80) return false;

    const simBot = { ...bot, money: simMoney, properties: simProps };
    const simState = { ...state, ownership: simOwnership };
    const nwAfter = this.calcNetWorth(simBot, simState);

    // Refuse if this gives the proposer a monopoly and we gain less than 10% NW
    const proposerGetsMonopoly = this.tradeGivesOpponentMonopoly(trade, state, trade.from);
    const ourGainPct = (nwAfter - nwBefore) / Math.max(nwBefore, 1);
    if (proposerGetsMonopoly && ourGainPct < 0.10) return false;

    // Accept if net worth improves by at least -5%
    return nwAfter >= nwBefore * 0.95;
  }

  // ─── HELPERS ─────────────────────────────────────────────────
  calcNetWorth(player, state) {
    let w = player.money;
    player.properties.forEach(pos => {
      const sq = state.board ? state.board.find(s => s.id === pos) : null;
      if (!sq) return;
      const mortgaged = state.mortgaged && state.mortgaged[pos];
      w += mortgaged ? (sq.mortgage || Math.floor((sq.price || 0) / 2)) : (sq.price || 0);
      w += (state.houses?.[pos] || 0) * ((sq.houseCost || 0) / 2);
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
    return Object.values(groups).some(sqs => sqs.every(s => simOwnership[s.id] === opponentId));
  }

  getSurplusProp(state, bot, excludeGroup, targetId) {
    const board = state.board;
    // Find properties we own that are in groups where someone else owns everything else
    // (our piece is useless without completing, so it's good to trade away)
    for (const pos of bot.properties) {
      const sq = board.find(s => s.id === pos);
      if (!sq || !sq.group || sq.group === excludeGroup) continue;
      const groupSqs = board.filter(s => s.group === sq.group);
      const botOwnsInGroup = groupSqs.filter(s => state.ownership[s.id] === bot.id).length;
      if (botOwnsInGroup > 1) continue; // we own multiple — don't give up
      const othersOwn = groupSqs.some(s => state.ownership[s.id] && state.ownership[s.id] !== bot.id && state.ownership[s.id] !== targetId);
      if (!othersOwn) return pos; // only target owns the rest — our piece is worth trading
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
