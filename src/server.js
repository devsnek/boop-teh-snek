'use strict';

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
    if (!stream) {
      return;
    }
    for (const sub of stream) {
      sub.send(data);
    }
  },
  subscribe(channel, sub) {
    console.log('SUB', channel);
    if (!this.streams.has(channel)) {
      this.streams.set(channel, new Set());
    }

    this.streams.get(channel).add(sub);
  },
  unsubscribe(channel, sub) {
    console.log('UNSUB', channel);
    if (!this.streams.has(channel)) {
      return;
    }

    this.streams.get(channel).delete(sub);
  },
};

const connections = new Map();

wss.on('connection', (c) => {
  const ws = new Socket(c);

  const id = uuid();

  // eslint-disable-next-line no-console
  const log = (...args) => console.log(id, ...args);

  const pubsend = (d) => ws.send(OPCodes.PUBLISH, d);
  const finish = () => ws.send(OPCodes.DISCONNECT);
  const pubinfo = { send: pubsend, finish };

  connections.set(id, pubinfo);

  log('CONNECT');

  ws.on('close', () => {
    connections.delete(id);
  });

  ws.on('message', ({ op, d }) => {
    log(op, d);
    switch (op) {
      case OPCodes.SUBSCRIBE:
        pubsub.subscribe(d, pubinfo);
        break;
      case OPCodes.UNSUBSCRIBE:
        pubsub.unsubscribe(d, pubinfo);
        break;
      case OPCodes.PUBLISH:
        pubsub.publish(id, d);
        break;
      case OPCodes.BROADCAST:
        connections.get(d.target).send(d);
      default:
        break;
    }
  });

  ws.send(OPCodes.HELLO, { id });
});

server.listen(1337);
