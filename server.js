const http = require('http');
const WebSocket = require('ws');
const uuid = require('uuid/v4');
const { Socket, OPCodes } = require('./socket');

const server = http.createServer((req, res) => {
  res.end('boop teh snek');
});

const wss = new WebSocket.Server({ server });

const connections = new Map();

wss.on('connection', (c) => {
  const ws = new Socket(c);

  const state = {
    id: uuid(),
    boops: 0,
    connected: new Set(),
    send: ws.send.bind(ws),
    update() {
      log('UPDATING');
      ws.send(OPCodes.STATE, {
        connected: this.connected.site,
        boops: this.boops,
        id: this.id,
      });
    },
  };

  // eslint-disable-next-line no-console
  const log = (...args) => console.log(state.id, ...args);

  connections.set(state.id, state);
  c.on('close', () => {
    connections.delete(state.id);
  });

  ws.on('message', ({ op, d }) => {
    log(op, d);
    switch (op) {
      case OPCodes.BOOP:
        state.boops = d;
        for (const connected of state.connected)
          connected.send(OPCodes.BOOP, d);
        break;
      case OPCodes.CONNECT: {
        if (!d.secret)
          break;
        const connection = connections.get(d.secret);
        connection.connected.add(state);
        connection.update();
        c.on('close', () => {
          connection.connected.delete(state);
        });
        break;
      }
    }
  });

  ws.send(OPCodes.HELLO, { id: state.id });
});

server.listen(1337);
