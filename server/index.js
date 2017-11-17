const http = require('http');
const WebSocket = require('ws');
const socket = require('../socket');

const server = http.createServer((req, res) => {
  res.end('boop teh snek');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (c) => {
  const ws = socket(c, true);
});

server.listen(1337);
