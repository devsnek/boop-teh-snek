const http = require('http');
const WebSocket = require('ws');
const socket = require('../socket');

const production = process.env.NODE_ENV === 'production';

const server = http.createServer((req, res) => {
  res.end('boop teh snek');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (c) => {
  socket(c, true);
});

server.listen(production ? '/tmp/boop_teh_snek.sock' : 1337);
