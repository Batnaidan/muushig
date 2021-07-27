const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http, {
  cors: {
    origin: 'https://localhost:8080',
  },
});

let playerCount = 0,
  rooms = [];
function shuffleCards() {
  const suits = ['C', 'D', 'H', 'S'];
  const values = ['7', '8', '9', '10', '11', '12', '13', '14'];
  let deck = [];
  for (let i = 0; i < suits.length; i++) {
    for (let x = 0; x < values.length; x++) {
      deck.push(`${values[x]}${suits[i]}`);
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * i);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

io.on('connection', function (socket) {
  playerCount++;
  console.log('A user connected: ' + JSON.stringify(socket.handshake.query));

  socket.on('joinRoom', () => {
    if (Array.isArray(rooms) && rooms.length) {
      rooms.push({ isPlaying: false, players: [socket.handshake.query] });
    } else {
      let roomId = Math.floor(playerCount / 5);
      socket.join(roomId);
      socket.emit('roomId', roomId);
      rooms[roomId].push(socket.handshake.query);
    }
  });
  socket.on('playerReady', (clientRoom) => {});
  socket.on('shuffleCards', () => {
    io.emit('deck', shuffleCards());
  });

  socket.on('disconnect', function (roomId) {
    playerCount--;
    // console.log('A user disconnected: ' + socket.id);
    // rooms[roomId] = rooms[roomId].filter((player) => player !== socket.id);
  });
});

http.listen(3000, function () {
  console.log('Server started!');
});
