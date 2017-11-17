const http = require('http');
const WebSocket = require('ws');
const uuid = require('uuid/v4');
const { Socket, OPCodes } = require('./socket');

const server = http.createServer((req, res) => {
  res.end('boop teh snek');
});

const wss = new WebSocket.Server({ server });

const pubsub = {
  streams: new Map(),
  publish(channel, data) {
    console.log('PUB', channel, data);
    const stream = this.streams.get(channel);
    if (!stream)
      return;
    for (const sub of stream)
      sub(data);
  },
  subscribe(channel, send) {
    console.log('SUB', channel);
    if (!this.streams.has(channel))
      this.streams.set(channel, new WeakSet());

    this.streams.get(channel).add(send);
  },
  unsubscribe(channel, send) {
    console.log('UNSUB', channel);
    if (!this.streams.has(channel))
      return;

    this.streams.get(channel).delete(send);
  },
};

wss.on('connection', (c) => {
  const ws = new Socket(c);

  const id = uuid();

  log('CONNECT');

  // eslint-disable-next-line no-console
  const log = (...args) => console.log(id, ...args);

  const pubsend = (d) => ws.send(OPCodes.EVENT, d);

  ws.on('message', ({ op, d }) => {
    log(op, d);
    switch (op) {
      case OPCodes.SUBSCRIBE:
        pubsub.subscribe(d.id, pubsend);
        break;
      case OPCodes.UNSUBSCRIBE:
        pubsub.unsubscribe(d.id, pubsend);
        break;
      case OPCodes.PUBLISH:
        pubsub.publish(id, d);
        break;
    }
  });

  ws.send(OPCodes.HELLO, { id });
});

server.listen(1337);
