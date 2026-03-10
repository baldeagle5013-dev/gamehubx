const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Game room storage
const rooms = {};

// Import game logic
const MonopolyGame = require('./src/games/monopoly');
const MonopolyBot = require('./src/bots/monopoly-bot');

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/games/monopoly', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'monopoly.html'));
});

// Room management API
app.post('/api/rooms/create', (req, res) => {
  const { game, playerName, maxPlayers, withBots, botCount } = req.body;
  const roomId = uuidv4().substring(0, 6).toUpperCase();
  
  rooms[roomId] = {
    id: roomId,
    game,
    players: [],
    maxPlayers: maxPlayers || 4,
    withBots: withBots || false,
    botCount: botCount || 0,
    state: 'waiting',
    gameInstance: null
  };
  
  res.json({ roomId });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms[req.params.roomId];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({
    id: room.id,
    game: room.game,
    playerCount: room.players.length,
    maxPlayers: room.maxPlayers,
    state: room.state
  });
});

// Socket.io handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', ({ roomId, playerName }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    if (room.players.length >= room.maxPlayers) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    const player = {
      id: socket.id,
      name: playerName || `Player ${room.players.length + 1}`,
      isBot: false,
      ready: false
    };

    room.players.push(player);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerName = player.name;

    io.to(roomId).emit('room-update', sanitizeRoom(room));
    socket.emit('joined-room', { player, roomId });
  });

  socket.on('player-ready', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = true;
      io.to(roomId).emit('room-update', sanitizeRoom(room));
    }

    // Check if all players ready, start game
    const humanPlayers = room.players.filter(p => !p.isBot);
    const allReady = humanPlayers.length > 0 && humanPlayers.every(p => p.ready);
    
    if (allReady && room.state === 'waiting') {
      startGame(room, roomId);
    }
  });

  socket.on('game-action', ({ roomId, action, data }) => {
    const room = rooms[roomId];
    if (!room || !room.gameInstance) return;
    
    handleGameAction(room, roomId, socket.id, action, data);
  });

  socket.on('trade-propose', ({ roomId, trade }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (!room.pendingTrades) room.pendingTrades = {};
    room.pendingTrades[trade.id] = trade;
    // Pause the game timer for human recipient
    const target = room.players && room.players.find(p => p.id === trade.to);
    if (target && !target.isBot) {
      room.tradePaused = true;
      io.to(trade.to).emit('trade-offer', trade);
    } else {
      io.to(trade.to).emit('trade-offer', trade);
    }
  });

  socket.on('trade-respond', ({ roomId, tradeId, accept }) => {
    const room = rooms[roomId];
    if (!room || !room.gameInstance) return;
    if (!room.pendingTrades || !room.pendingTrades[tradeId]) return;
    const trade = room.pendingTrades[tradeId];
    delete room.pendingTrades[tradeId];
    room.tradePaused = false;
    if (accept) {
      room.gameInstance.executeTrade(trade);
      broadcastGameState(room, roomId);
      io.to(roomId).emit('trade-result', { accepted: true, tradeId });
    } else {
      // Tell the proposer it was declined
      io.to(trade.from).emit('trade-result', { accepted: false, tradeId });
      // If the proposer is a bot, record the decline so it backs off
      if (room.botHandler) {
        const fromPlayer = room.players.find(p => p.id === trade.from);
        if (fromPlayer && fromPlayer.isBot && trade._group) {
          room.botHandler.recordDecline(trade.from, trade._group);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      room.players = room.players.filter(p => p.id !== socket.id);
      
      if (room.players.length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit('room-update', sanitizeRoom(room));
        io.to(roomId).emit('player-left', { playerName: socket.playerName });
        
        // If game started and player leaves, handle it
        if (room.gameInstance && room.state === 'playing') {
          room.gameInstance.removePlayer(socket.id);
          broadcastGameState(room, roomId);
        }
      }
    }
  });
});

function startGame(room, roomId) {
  room.state = 'playing';

  // Add bots if needed
  if (room.withBots) {
    const botsToAdd = Math.min(room.botCount, room.maxPlayers - room.players.length);
    const botNames = ['Magnus Bot', 'Aria AI', 'Nexus', 'Cipher'];
    for (let i = 0; i < botsToAdd; i++) {
      room.players.push({
        id: `bot-${uuidv4()}`,
        name: botNames[i] || `Bot ${i+1}`,
        isBot: true,
        ready: true
      });
    }
  }

  if (room.game === 'monopoly') {
    room.gameInstance = new MonopolyGame(room.players);
    room.botHandler = new MonopolyBot(room.gameInstance, room.players.filter(p => p.isBot));
  }

  io.to(roomId).emit('game-started', { game: room.game });
  broadcastGameState(room, roomId);

  // Trigger bot turn if first player is bot
  scheduleBotTurn(room, roomId);
}

function handleGameAction(room, roomId, playerId, action, data) {
  if (room.game === 'monopoly') {
    const result = room.gameInstance.handleAction(playerId, action, data);
    if (result) {
      broadcastGameState(room, roomId);
      io.to(roomId).emit('game-event', result);
      
      // Check if game over
      if (room.gameInstance.isOver()) {
        room.state = 'finished';
        io.to(roomId).emit('game-over', { winner: room.gameInstance.getWinner() });
        return;
      }

      // Schedule bot turn if next player is bot
      scheduleBotTurn(room, roomId);
    }
  }
}

function scheduleBotTurn(room, roomId) {
  if (!room.gameInstance || !room.botHandler) return;

  const currentPlayer = room.gameInstance.getCurrentPlayer();
  if (currentPlayer && currentPlayer.isBot) {
    setTimeout(() => {
      if (!rooms[roomId] || room.state !== 'playing') return;

      const actions = room.botHandler.getActions(currentPlayer.id);
      actions.forEach((act, i) => {
        setTimeout(() => {
          if (!rooms[roomId] || room.state !== 'playing') return;
          const result = room.gameInstance.handleAction(currentPlayer.id, act.action, act.data);
          if (result) {
            broadcastGameState(room, roomId);
            io.to(roomId).emit('game-event', result);
          }
          // After the last action (end-turn), try to propose a trade
          if (i === actions.length - 1) {
            scheduleBotTrade(room, roomId, currentPlayer.id, () => {
              scheduleBotTurn(room, roomId);
            });
          }
        }, i * 1200);
      });
    }, 1500);
  }
}

function scheduleBotTrade(room, roomId, botId, done) {
  if (!room.gameInstance || !room.botHandler) return done();
  // Don't propose if a trade is already pending human response
  if (room.tradePaused) return done();

  setTimeout(() => {
    if (!rooms[roomId] || room.state !== 'playing') return done();
    if (room.tradePaused) return done();

    const proposal = room.botHandler.getTradeProposal(botId);
    if (!proposal) return done();

    if (!room.pendingTrades) room.pendingTrades = {};
    room.pendingTrades[proposal.id] = proposal;

    const state = room.gameInstance.getState();
    const target = state.players.find(p => p.id === proposal.to);
    if (!target) return done();

    if (target.isBot) {
      // Bot-to-bot: resolve immediately
      const accepts = room.botHandler.shouldAcceptTrade(proposal.to, proposal);
      if (accepts) {
        room.gameInstance.executeTrade(proposal);
        broadcastGameState(room, roomId);
        const fromName = state.players.find(p => p.id === proposal.from)?.name || 'Bot';
        io.to(roomId).emit('game-event', {
          type: 'multi-event',
          events: [{ type: 'trade-complete', from: fromName, to: target.name }]
        });
      } else {
        // Record the decline so the bot cools down
        if (proposal._group) room.botHandler.recordDecline(proposal.from, proposal._group);
      }
      delete room.pendingTrades[proposal.id];
      done();
    } else {
      // Target is human: pause game, show offer, wait for response
      room.tradePaused = true;
      io.to(proposal.to).emit('trade-offer', proposal);
      addRoomLog(room, `🤝 ${state.players.find(p=>p.id===proposal.from)?.name||'Bot'} proposed a trade to ${target.name}.`);

      // Auto-expire after 45 seconds — resume game even if human ignores
      setTimeout(() => {
        if (room.pendingTrades && room.pendingTrades[proposal.id]) {
          delete room.pendingTrades[proposal.id];
          room.tradePaused = false;
          io.to(proposal.to).emit('trade-result', { accepted: false, tradeId: proposal.id });
          addRoomLog(room, `⏱ Trade offer expired.`);
        }
      }, 45000);

      done(); // don't block next bot turn on human response
    }
  }, 800);
}

function addRoomLog(room, msg) {
  if (room.gameInstance) room.gameInstance.addLog(msg);
}

function broadcastGameState(room, roomId) {
  if (!room.gameInstance) return;
  const state = room.gameInstance.getState();
  io.to(roomId).emit('game-state', state);
}

function sanitizeRoom(room) {
  return {
    id: room.id,
    game: room.game,
    players: room.players.map(p => ({ id: p.id, name: p.name, isBot: p.isBot, ready: p.ready })),
    maxPlayers: room.maxPlayers,
    state: room.state
  };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎮 GameHub running on http://localhost:${PORT}`);
});
