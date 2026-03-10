// Monopoly Game Engine
const BOARD = [
  { id: 0,  name: 'GO',                type: 'go' },
  { id: 1,  name: 'Mediterranean Ave', type: 'property', group: 'brown',    price: 60,  rent: [2,10,30,90,160,250],   houseCost: 50,  mortgage: 30 },
  { id: 2,  name: 'Community Chest',   type: 'community' },
  { id: 3,  name: 'Baltic Ave',        type: 'property', group: 'brown',    price: 60,  rent: [4,20,60,180,320,450],  houseCost: 50,  mortgage: 30 },
  { id: 4,  name: 'Income Tax',        type: 'tax',      amount: 200 },
  { id: 5,  name: 'Reading Railroad',  type: 'railroad', price: 200, mortgage: 100 },
  { id: 6,  name: 'Oriental Ave',      type: 'property', group: 'lightblue', price: 100, rent: [6,30,90,270,400,550], houseCost: 50, mortgage: 50 },
  { id: 7,  name: 'Chance',            type: 'chance' },
  { id: 8,  name: 'Vermont Ave',       type: 'property', group: 'lightblue', price: 100, rent: [6,30,90,270,400,550], houseCost: 50, mortgage: 50 },
  { id: 9,  name: 'Connecticut Ave',   type: 'property', group: 'lightblue', price: 120, rent: [8,40,100,300,450,600],houseCost: 50, mortgage: 60 },
  { id: 10, name: 'Jail / Just Visiting', type: 'jail' },
  { id: 11, name: 'St. Charles Place', type: 'property', group: 'pink',     price: 140, rent: [10,50,150,450,625,750],houseCost: 100, mortgage: 70 },
  { id: 12, name: 'Electric Company',  type: 'utility',  price: 150, mortgage: 75 },
  { id: 13, name: 'States Ave',        type: 'property', group: 'pink',     price: 140, rent: [10,50,150,450,625,750],houseCost: 100, mortgage: 70 },
  { id: 14, name: 'Virginia Ave',      type: 'property', group: 'pink',     price: 160, rent: [12,60,180,500,700,900],houseCost: 100, mortgage: 80 },
  { id: 15, name: 'Pennsylvania RR',   type: 'railroad', price: 200, mortgage: 100 },
  { id: 16, name: 'St. James Place',   type: 'property', group: 'orange',   price: 180, rent: [14,70,200,550,750,950],houseCost: 100, mortgage: 90 },
  { id: 17, name: 'Community Chest',   type: 'community' },
  { id: 18, name: 'Tennessee Ave',     type: 'property', group: 'orange',   price: 180, rent: [14,70,200,550,750,950],houseCost: 100, mortgage: 90 },
  { id: 19, name: 'New York Ave',      type: 'property', group: 'orange',   price: 200, rent: [16,80,220,600,800,1000],houseCost: 100, mortgage: 100 },
  { id: 20, name: 'Free Parking',      type: 'freeparking' },
  { id: 21, name: 'Kentucky Ave',      type: 'property', group: 'red',      price: 220, rent: [18,90,250,700,875,1050],houseCost: 150, mortgage: 110 },
  { id: 22, name: 'Chance',            type: 'chance' },
  { id: 23, name: 'Indiana Ave',       type: 'property', group: 'red',      price: 220, rent: [18,90,250,700,875,1050],houseCost: 150, mortgage: 110 },
  { id: 24, name: 'Illinois Ave',      type: 'property', group: 'red',      price: 240, rent: [20,100,300,750,925,1100],houseCost: 150, mortgage: 120 },
  { id: 25, name: 'B&O Railroad',      type: 'railroad', price: 200, mortgage: 100 },
  { id: 26, name: 'Atlantic Ave',      type: 'property', group: 'yellow',   price: 260, rent: [22,110,330,800,975,1150],houseCost: 150, mortgage: 130 },
  { id: 27, name: 'Ventnor Ave',       type: 'property', group: 'yellow',   price: 260, rent: [22,110,330,800,975,1150],houseCost: 150, mortgage: 130 },
  { id: 28, name: 'Water Works',       type: 'utility',  price: 150, mortgage: 75 },
  { id: 29, name: 'Marvin Gardens',    type: 'property', group: 'yellow',   price: 280, rent: [24,120,360,850,1025,1200],houseCost: 150, mortgage: 140 },
  { id: 30, name: 'Go To Jail',        type: 'gotojail' },
  { id: 31, name: 'Pacific Ave',       type: 'property', group: 'green',    price: 300, rent: [26,130,390,900,1100,1275],houseCost: 200, mortgage: 150 },
  { id: 32, name: 'North Carolina Ave',type: 'property', group: 'green',    price: 300, rent: [26,130,390,900,1100,1275],houseCost: 200, mortgage: 150 },
  { id: 33, name: 'Community Chest',   type: 'community' },
  { id: 34, name: 'Pennsylvania Ave',  type: 'property', group: 'green',    price: 320, rent: [28,150,450,1000,1200,1400],houseCost: 200, mortgage: 160 },
  { id: 35, name: 'Short Line RR',     type: 'railroad', price: 200, mortgage: 100 },
  { id: 36, name: 'Chance',            type: 'chance' },
  { id: 37, name: 'Park Place',        type: 'property', group: 'darkblue', price: 350, rent: [35,175,500,1100,1300,1500],houseCost: 200, mortgage: 175 },
  { id: 38, name: 'Luxury Tax',        type: 'tax',      amount: 100 },
  { id: 39, name: 'Boardwalk',         type: 'property', group: 'darkblue', price: 400, rent: [50,200,600,1400,1700,2000],houseCost: 200, mortgage: 200 },
];

const CHANCE_CARDS = [
  { text: 'Advance to GO. Collect $200.', action: 'move', target: 0, collect: 200 },
  { text: 'Advance to Illinois Avenue.', action: 'move', target: 24 },
  { text: 'Advance to St. Charles Place.', action: 'move', target: 11 },
  { text: 'Advance to nearest Railroad.', action: 'nearest-railroad' },
  { text: 'Advance to nearest Utility.', action: 'nearest-utility' },
  { text: 'Bank pays you dividend of $50.', action: 'collect', amount: 50 },
  { text: 'Get Out of Jail Free.', action: 'jail-free' },
  { text: 'Go Back 3 Spaces.', action: 'move-back', amount: 3 },
  { text: 'Go to Jail.', action: 'go-to-jail' },
  { text: 'Make general repairs: $25 per house, $100 per hotel.', action: 'repairs', house: 25, hotel: 100 },
  { text: 'Pay poor tax of $15.', action: 'pay', amount: 15 },
  { text: 'Take a trip to Reading Railroad.', action: 'move', target: 5 },
  { text: 'Advance to Boardwalk.', action: 'move', target: 39 },
  { text: 'Elected Chairman: Pay each player $50.', action: 'pay-all', amount: 50 },
  { text: 'Building loan matures: Collect $150.', action: 'collect', amount: 150 },
  { text: 'You won a crossword competition. Collect $100.', action: 'collect', amount: 100 },
];

const COMMUNITY_CARDS = [
  { text: 'Advance to GO. Collect $200.', action: 'move', target: 0, collect: 200 },
  { text: 'Bank error in your favor. Collect $200.', action: 'collect', amount: 200 },
  { text: 'Doctor\'s fees. Pay $50.', action: 'pay', amount: 50 },
  { text: 'From sale of stock you get $50.', action: 'collect', amount: 50 },
  { text: 'Get Out of Jail Free.', action: 'jail-free' },
  { text: 'Go to Jail.', action: 'go-to-jail' },
  { text: 'Grand Opera Night. Collect $50 from each player.', action: 'collect-all', amount: 50 },
  { text: 'Holiday Fund matures. Receive $100.', action: 'collect', amount: 100 },
  { text: 'Income tax refund. Collect $20.', action: 'collect', amount: 20 },
  { text: 'It is your birthday. Collect $10 from each player.', action: 'collect-all', amount: 10 },
  { text: 'Life insurance matures. Collect $100.', action: 'collect', amount: 100 },
  { text: 'Pay hospital fees of $100.', action: 'pay', amount: 100 },
  { text: 'Pay school fees of $150.', action: 'pay', amount: 150 },
  { text: 'Receive $25 consultancy fee.', action: 'collect', amount: 25 },
  { text: 'You are assessed for street repairs: $40 per house, $115 per hotel.', action: 'repairs', house: 40, hotel: 115 },
  { text: 'You have won second prize in a beauty contest. Collect $10.', action: 'collect', amount: 10 },
  { text: 'You inherit $100.', action: 'collect', amount: 100 },
];

const TOKENS = ['🎩', '🚗', '🐕', '🚢', '✈️', '🏆', '👠', '🎸'];
const GROUP_COUNTS = { brown: 2, lightblue: 3, pink: 3, orange: 3, red: 3, yellow: 3, green: 3, darkblue: 2 };

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class MonopolyGame {
  constructor(players) {
    this.players = players.map((p, i) => ({
      id: p.id,
      name: p.name,
      isBot: p.isBot,
      token: TOKENS[i],
      position: 0,
      money: 1500,
      properties: [],
      inJail: false,
      jailTurns: 0,
      jailFreeCards: 0,
      isBankrupt: false,
      doublesCount: 0,
    }));
    
    this.currentPlayerIndex = 0;
    this.phase = 'roll'; // roll, action, buy, trade, auction
    this.dice = [0, 0];
    this.lastDoubles = false;
    this.ownership = {}; // squareId -> playerId
    this.houses = {};    // squareId -> houseCount (5 = hotel)
    this.mortgaged = {}; // squareId -> bool
    this.chanceCards = shuffle(CHANCE_CARDS);
    this.communityCards = shuffle(COMMUNITY_CARDS);
    this.chanceIndex = 0;
    this.communityIndex = 0;
    this.freeParkingPool = 0;
    this.auctionState = null;
    this.tradeState = null;
    this.pendingActions = []; // queued events
    this.log = [];
    this.turnCount = 0;
  }

  rollDice() {
    return [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  getActivePlayers() {
    return this.players.filter(p => !p.isBankrupt);
  }

  addLog(msg) {
    this.log.unshift({ msg, time: Date.now() });
    if (this.log.length > 50) this.log.pop();
  }

  handleAction(playerId, action, data = {}) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;

    const current = this.getCurrentPlayer();
    const isCurrentPlayer = current && current.id === playerId;

    let event = null;

    switch (action) {
      case 'roll':
        if (!isCurrentPlayer || this.phase !== 'roll') return null;
        event = this.doRoll(player);
        break;
      case 'buy':
        if (!isCurrentPlayer || this.phase !== 'buy') return null;
        event = this.doBuy(player);
        break;
      case 'decline-buy':
        if (!isCurrentPlayer || this.phase !== 'buy') return null;
        event = this.doAuction(player, data);
        break;
      case 'end-turn':
        if (!isCurrentPlayer || this.phase !== 'action') return null;
        event = this.doEndTurn();
        break;
      case 'build-house':
        if (!isCurrentPlayer) return null;
        event = this.doBuildHouse(player, data.squareId);
        break;
      case 'sell-house':
        if (!isCurrentPlayer) return null;
        event = this.doSellHouse(player, data.squareId);
        break;
      case 'mortgage':
        if (!isCurrentPlayer) return null;
        event = this.doMortgage(player, data.squareId);
        break;
      case 'unmortgage':
        if (!isCurrentPlayer) return null;
        event = this.doUnmortgage(player, data.squareId);
        break;
      case 'pay-jail':
        if (!isCurrentPlayer) return null;
        event = this.doPayJail(player);
        break;
      case 'use-jail-card':
        if (!isCurrentPlayer) return null;
        event = this.doUseJailCard(player);
        break;
      case 'auction-bid':
        if (this.phase !== 'auction' || !this.auctionState) return null;
        event = this.doAuctionBid(player, data.amount);
        break;
      case 'auction-pass':
        if (this.phase !== 'auction' || !this.auctionState) return null;
        event = this.doAuctionPass(player);
        break;
      case 'declare-bankruptcy':
        if (!isCurrentPlayer) return null;
        event = this.doBankruptcy(player);
        break;
    }

    return event;
  }

  doRoll(player) {
    const dice = this.rollDice();
    this.dice = dice;
    const total = dice[0] + dice[1];
    const isDoubles = dice[0] === dice[1];
    this.lastDoubles = isDoubles;

    let events = [];

    if (player.inJail) {
      if (isDoubles) {
        player.inJail = false;
        player.jailTurns = 0;
        player.doublesCount = 0;
        this.addLog(`${player.name} rolled doubles and got out of jail!`);
        events.push({ type: 'jail-escape', player: player.name });
        this.movePlayer(player, total, events);
      } else {
        player.jailTurns++;
        if (player.jailTurns >= 3) {
          // Must pay fine
          this.chargeMoney(player, 50, events);
          player.inJail = false;
          player.jailTurns = 0;
          this.addLog(`${player.name} paid $50 jail fine.`);
          this.movePlayer(player, total, events);
        } else {
          this.addLog(`${player.name} is stuck in jail (turn ${player.jailTurns}).`);
          this.phase = 'action';
          events.push({ type: 'stay-jail', player: player.name });
        }
      }
    } else {
      if (isDoubles) {
        player.doublesCount++;
        if (player.doublesCount >= 3) {
          // Go to jail for 3 doubles
          this.sendToJail(player, events);
          this.phase = 'action';
          return { type: 'multi-event', events, dice };
        }
      } else {
        player.doublesCount = 0;
      }
      this.movePlayer(player, total, events);
    }

    // After move, if doubles and not in jail, stay in roll phase
    if (isDoubles && !player.inJail && this.phase === 'action') {
      // Keep in action phase but note doubles for next roll
    }

    return { type: 'multi-event', events, dice };
  }

  movePlayer(player, steps, events) {
    const oldPos = player.position;
    const newPos = (player.position + steps) % 40;
    
    // Passed GO
    if (newPos < oldPos && newPos !== 0) {
      player.money += 200;
      this.addLog(`${player.name} passed GO and collected $200.`);
      events.push({ type: 'passed-go', player: player.name });
    }
    
    player.position = newPos;
    events.push({ type: 'move', player: player.name, from: oldPos, to: newPos });
    this.addLog(`${player.name} moved to ${BOARD[newPos].name}.`);

    this.landOnSquare(player, newPos, events);
  }

  teleportPlayer(player, targetPos, events) {
    const oldPos = player.position;
    if (targetPos < oldPos) {
      player.money += 200;
      events.push({ type: 'passed-go', player: player.name });
    }
    player.position = targetPos;
    events.push({ type: 'move', player: player.name, from: oldPos, to: targetPos });
    this.landOnSquare(player, targetPos, events);
  }

  landOnSquare(player, pos, events) {
    const square = BOARD[pos];
    
    switch (square.type) {
      case 'go':
        player.money += 200; // Extra $200 for landing exactly on GO
        events.push({ type: 'collect', player: player.name, amount: 200, reason: 'Landed on GO' });
        this.phase = 'action';
        break;
      
      case 'property':
      case 'railroad':
      case 'utility':
        if (!this.ownership[pos]) {
          this.phase = 'buy';
          events.push({ type: 'can-buy', player: player.name, square: square.name, price: square.price });
        } else if (this.ownership[pos] !== player.id) {
          const owner = this.players.find(p => p.id === this.ownership[pos]);
          if (!this.mortgaged[pos] && owner && !owner.isBankrupt) {
            const rent = this.calculateRent(pos, player);
            this.chargeMoney(player, rent, events);
            owner.money += rent;
            events.push({ type: 'rent', payer: player.name, owner: owner.name, amount: rent, square: square.name });
            this.addLog(`${player.name} paid $${rent} rent to ${owner.name} for ${square.name}.`);
          }
          this.phase = 'action';
        } else {
          this.phase = 'action';
        }
        break;

      case 'tax':
        this.chargeMoney(player, square.amount, events);
        events.push({ type: 'tax', player: player.name, amount: square.amount });
        this.addLog(`${player.name} paid $${square.amount} tax.`);
        this.phase = 'action';
        break;

      case 'gotojail':
        this.sendToJail(player, events);
        this.phase = 'action';
        break;

      case 'jail':
        this.phase = 'action';
        break;

      case 'freeparking':
        if (this.freeParkingPool > 0) {
          player.money += this.freeParkingPool;
          events.push({ type: 'freeparking', player: player.name, amount: this.freeParkingPool });
          this.addLog(`${player.name} collected $${this.freeParkingPool} from Free Parking!`);
          this.freeParkingPool = 0;
        }
        this.phase = 'action';
        break;

      case 'chance':
        this.drawChance(player, events);
        break;

      case 'community':
        this.drawCommunity(player, events);
        break;

      default:
        this.phase = 'action';
    }
  }

  calculateRent(pos, player) {
    const square = BOARD[pos];
    const ownerId = this.ownership[pos];
    const houses = this.houses[pos] || 0;

    if (square.type === 'railroad') {
      const railroads = [5, 15, 25, 35];
      const owned = railroads.filter(r => this.ownership[r] === ownerId).length;
      return [25, 50, 100, 200][owned - 1];
    }

    if (square.type === 'utility') {
      const utilities = [12, 28];
      const owned = utilities.filter(u => this.ownership[u] === ownerId).length;
      const diceTotal = this.dice[0] + this.dice[1];
      return owned === 1 ? diceTotal * 4 : diceTotal * 10;
    }

    // Property
    if (houses > 0) {
      return square.rent[houses]; // index 1-5 for 1-4 houses + hotel
    }

    // Check for monopoly (doubles rent)
    const groupSquares = BOARD.filter(s => s.group === square.group).map(s => s.id);
    const hasMonopoly = groupSquares.every(id => this.ownership[id] === ownerId);
    return hasMonopoly ? square.rent[0] * 2 : square.rent[0];
  }

  sendToJail(player, events) {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    player.doublesCount = 0;
    events.push({ type: 'go-to-jail', player: player.name });
    this.addLog(`${player.name} was sent to Jail!`);
  }

  drawChance(player, events) {
    const card = this.chanceCards[this.chanceIndex % this.chanceCards.length];
    this.chanceIndex++;
    events.push({ type: 'card', cardType: 'chance', text: card.text });
    this.addLog(`${player.name} drew Chance: "${card.text}"`);
    this.applyCard(player, card, events);
  }

  drawCommunity(player, events) {
    const card = this.communityCards[this.communityIndex % this.communityCards.length];
    this.communityIndex++;
    events.push({ type: 'card', cardType: 'community', text: card.text });
    this.addLog(`${player.name} drew Community Chest: "${card.text}"`);
    this.applyCard(player, card, events);
  }

  applyCard(player, card, events) {
    switch (card.action) {
      case 'move':
        const wasAhead = card.target > player.position;
        if (!wasAhead) { player.money += 200; events.push({ type: 'passed-go', player: player.name }); }
        if (card.collect) player.money += card.collect;
        player.position = card.target;
        events.push({ type: 'move', player: player.name, to: card.target });
        this.landOnSquare(player, card.target, events);
        break;
      case 'move-back':
        player.position = Math.max(0, player.position - card.amount);
        events.push({ type: 'move', player: player.name, to: player.position });
        this.landOnSquare(player, player.position, events);
        break;
      case 'collect':
        player.money += card.amount;
        events.push({ type: 'collect', player: player.name, amount: card.amount });
        this.phase = 'action';
        break;
      case 'pay':
        this.chargeMoney(player, card.amount, events);
        events.push({ type: 'pay', player: player.name, amount: card.amount });
        this.phase = 'action';
        break;
      case 'jail-free':
        player.jailFreeCards++;
        events.push({ type: 'jail-free-card', player: player.name });
        this.phase = 'action';
        break;
      case 'go-to-jail':
        this.sendToJail(player, events);
        this.phase = 'action';
        break;
      case 'collect-all':
        this.getActivePlayers().forEach(p => {
          if (p.id !== player.id) {
            this.chargeMoney(p, card.amount, events);
            player.money += card.amount;
          }
        });
        events.push({ type: 'collect-all', player: player.name, amount: card.amount });
        this.phase = 'action';
        break;
      case 'pay-all':
        this.getActivePlayers().forEach(p => {
          if (p.id !== player.id) {
            p.money += card.amount;
            this.chargeMoney(player, card.amount, events);
          }
        });
        this.phase = 'action';
        break;
      case 'repairs':
        let total = 0;
        player.properties.forEach(id => {
          const h = this.houses[id] || 0;
          total += h === 5 ? card.hotel : h * card.house;
        });
        this.chargeMoney(player, total, events);
        events.push({ type: 'pay', player: player.name, amount: total, reason: 'Repairs' });
        this.phase = 'action';
        break;
      case 'nearest-railroad': {
        const rrs = [5, 15, 25, 35];
        const next = rrs.find(r => r > player.position) || rrs[0];
        this.teleportPlayer(player, next, events);
        break;
      }
      case 'nearest-utility': {
        const utils = [12, 28];
        const next = utils.find(u => u > player.position) || utils[0];
        this.teleportPlayer(player, next, events);
        break;
      }
      default:
        this.phase = 'action';
    }
  }

  chargeMoney(player, amount, events) {
    player.money -= amount;
    this.freeParkingPool += Math.floor(amount * 0.1); // 10% to free parking
    if (player.money < 0) {
      events.push({ type: 'bankrupt-warning', player: player.name, debt: -player.money });
    }
  }

  doBuy(player) {
    const square = BOARD[player.position];
    if (player.money < square.price) {
      this.phase = 'action';
      return { type: 'cant-afford', player: player.name };
    }
    player.money -= square.price;
    this.ownership[player.position] = player.id;
    player.properties.push(player.position);
    this.addLog(`${player.name} bought ${square.name} for $${square.price}.`);
    this.phase = 'action';
    return { type: 'bought', player: player.name, square: square.name, price: square.price };
  }

  doAuction(player, data) {
    const square = BOARD[player.position];
    this.phase = 'auction';
    const activePlayers = this.getActivePlayers();
    this.auctionState = {
      squareId: player.position,
      square: square.name,
      currentBid: 0,
      currentBidder: null,
      passedPlayers: new Set(),
      startingPlayer: player.id,
      bidOrder: activePlayers.map(p => p.id),
      bidIndex: 0,
    };
    this.addLog(`Auction started for ${square.name}.`);
    return { type: 'auction-start', square: square.name, auctionState: this.getAuctionState() };
  }

  doAuctionBid(player, amount) {
    if (!this.auctionState) return null;
    if (amount <= this.auctionState.currentBid) return { type: 'invalid-bid' };
    if (player.money < amount) return { type: 'cant-afford', player: player.name };
    
    this.auctionState.currentBid = amount;
    this.auctionState.currentBidder = player.id;
    this.addLog(`${player.name} bid $${amount}.`);
    return { type: 'auction-bid', player: player.name, amount, auctionState: this.getAuctionState() };
  }

  doAuctionPass(player) {
    if (!this.auctionState) return null;
    this.auctionState.passedPlayers.add(player.id);
    this.addLog(`${player.name} passed on the auction.`);
    
    const active = this.getActivePlayers().filter(p => !this.auctionState.passedPlayers.has(p.id));
    
    if (active.length <= 1) {
      // Auction over
      if (this.auctionState.currentBidder) {
        const winner = this.players.find(p => p.id === this.auctionState.currentBidder);
        winner.money -= this.auctionState.currentBid;
        this.ownership[this.auctionState.squareId] = winner.id;
        winner.properties.push(this.auctionState.squareId);
        this.addLog(`${winner.name} won the auction for ${this.auctionState.square} at $${this.auctionState.currentBid}.`);
        const result = { type: 'auction-end', winner: winner.name, amount: this.auctionState.currentBid, square: this.auctionState.square };
        this.auctionState = null;
        this.phase = 'action';
        return result;
      } else {
        // No bids, property stays unowned
        this.auctionState = null;
        this.phase = 'action';
        return { type: 'auction-end', winner: null, square: this.auctionState ? this.auctionState.square : '' };
      }
    }
    
    return { type: 'auction-pass', player: player.name, auctionState: this.getAuctionState() };
  }

  getAuctionState() {
    if (!this.auctionState) return null;
    return {
      squareId: this.auctionState.squareId,
      square: this.auctionState.square,
      currentBid: this.auctionState.currentBid,
      currentBidder: this.auctionState.currentBidder,
      passedPlayers: [...this.auctionState.passedPlayers],
    };
  }

  doBuildHouse(player, squareId) {
    const square = BOARD[squareId];
    if (!square || square.type !== 'property') return null;
    if (this.ownership[squareId] !== player.id) return null;
    if (this.mortgaged[squareId]) return null;
    
    // Check monopoly
    const groupSquares = BOARD.filter(s => s.group === square.group).map(s => s.id);
    if (!groupSquares.every(id => this.ownership[id] === player.id)) return { type: 'no-monopoly' };
    
    const currentHouses = this.houses[squareId] || 0;
    if (currentHouses >= 5) return { type: 'max-houses' };
    
    // Balanced building rule
    const minHouses = Math.min(...groupSquares.map(id => this.houses[id] || 0));
    if (currentHouses > minHouses) return { type: 'must-build-evenly' };
    
    const cost = square.houseCost;
    if (player.money < cost) return { type: 'cant-afford' };
    
    player.money -= cost;
    this.houses[squareId] = currentHouses + 1;
    const label = currentHouses + 1 === 5 ? 'hotel' : 'house';
    this.addLog(`${player.name} built a ${label} on ${square.name}.`);
    return { type: 'built', player: player.name, square: square.name, houses: this.houses[squareId] };
  }

  doSellHouse(player, squareId) {
    const square = BOARD[squareId];
    if (!square || this.ownership[squareId] !== player.id) return null;
    const currentHouses = this.houses[squareId] || 0;
    if (currentHouses === 0) return { type: 'no-houses' };
    
    const refund = Math.floor(square.houseCost / 2);
    player.money += refund;
    this.houses[squareId] = currentHouses - 1;
    this.addLog(`${player.name} sold a house on ${square.name} for $${refund}.`);
    return { type: 'sold-house', player: player.name, square: square.name, refund };
  }

  doMortgage(player, squareId) {
    if (this.ownership[squareId] !== player.id) return null;
    if (this.mortgaged[squareId]) return null;
    if ((this.houses[squareId] || 0) > 0) return { type: 'must-sell-houses-first' };
    
    const square = BOARD[squareId];
    const value = square.mortgage || Math.floor(square.price / 2);
    player.money += value;
    this.mortgaged[squareId] = true;
    this.addLog(`${player.name} mortgaged ${square.name} for $${value}.`);
    return { type: 'mortgaged', player: player.name, square: square.name, amount: value };
  }

  doUnmortgage(player, squareId) {
    if (this.ownership[squareId] !== player.id) return null;
    if (!this.mortgaged[squareId]) return null;
    
    const square = BOARD[squareId];
    const cost = Math.floor((square.mortgage || Math.floor(square.price / 2)) * 1.1);
    if (player.money < cost) return { type: 'cant-afford' };
    
    player.money -= cost;
    this.mortgaged[squareId] = false;
    this.addLog(`${player.name} unmortgaged ${square.name} for $${cost}.`);
    return { type: 'unmortgaged', player: player.name, square: square.name, cost };
  }

  doPayJail(player) {
    if (!player.inJail) return null;
    if (player.money < 50) return { type: 'cant-afford' };
    player.money -= 50;
    player.inJail = false;
    player.jailTurns = 0;
    this.addLog(`${player.name} paid $50 to get out of jail.`);
    return { type: 'paid-jail', player: player.name };
  }

  doUseJailCard(player) {
    if (!player.inJail || player.jailFreeCards === 0) return null;
    player.jailFreeCards--;
    player.inJail = false;
    player.jailTurns = 0;
    this.addLog(`${player.name} used a Get Out of Jail Free card.`);
    return { type: 'used-jail-card', player: player.name };
  }

  doBankruptcy(player) {
    player.isBankrupt = true;
    // Return all properties to bank
    player.properties.forEach(id => {
      delete this.ownership[id];
      delete this.houses[id];
      delete this.mortgaged[id];
    });
    player.properties = [];
    player.money = 0;
    this.addLog(`${player.name} declared bankruptcy!`);
    
    // Check if game over
    const active = this.getActivePlayers();
    if (active.length === 1) {
      return { type: 'game-over', winner: active[0].name };
    }
    
    // Move to next player
    this.advanceTurn();
    return { type: 'bankruptcy', player: player.name };
  }

  doEndTurn() {
    if (this.lastDoubles && !this.getCurrentPlayer().inJail) {
      this.phase = 'roll';
      return { type: 'doubles-again', player: this.getCurrentPlayer().name };
    }
    this.advanceTurn();
    return { type: 'end-turn' };
  }

  advanceTurn() {
    this.turnCount++;
    const active = this.getActivePlayers();
    if (active.length === 0) return;
    
    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
    while (this.players[nextIndex].isBankrupt) {
      nextIndex = (nextIndex + 1) % this.players.length;
    }
    this.currentPlayerIndex = nextIndex;
    this.phase = 'roll';
    this.lastDoubles = false;
    this.addLog(`--- ${this.getCurrentPlayer().name}'s turn ---`);
  }

  removePlayer(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (player) this.doBankruptcy(player);
  }

  isOver() {
    return this.getActivePlayers().length <= 1;
  }

  getWinner() {
    const active = this.getActivePlayers();
    return active.length === 1 ? active[0] : null;
  }

  getState() {
    return {
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        isBot: p.isBot,
        token: p.token,
        position: p.position,
        money: p.money,
        properties: p.properties,
        inJail: p.inJail,
        jailTurns: p.jailTurns,
        jailFreeCards: p.jailFreeCards,
        isBankrupt: p.isBankrupt,
        doublesCount: p.doublesCount,
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      phase: this.phase,
      dice: this.dice,
      ownership: this.ownership,
      houses: this.houses,
      mortgaged: this.mortgaged,
      freeParkingPool: this.freeParkingPool,
      auctionState: this.getAuctionState(),
      log: this.log.slice(0, 20),
      turnCount: this.turnCount,
      board: BOARD.map(s => ({ id: s.id, name: s.name, type: s.type, group: s.group, price: s.price })),
    };
  }
}

module.exports = MonopolyGame;
