const uuid = require('uuid/v4');

const OPCodes = {
  HELLO: 0,
  ACTIVITY: 1,
  BOOP: 2,
};

const connections = new Map();

function socket(ws, server = false) {
  if (typeof ws === 'function') {
    var callback = ws;
    ws = new WebSocket('ws://localhost:1337');
  }

  const send = (op, d) => ws.send(JSON.stringify({ op, d }));

  const state = {
    boops: undefined,
    id: server ? uuid() : undefined,
    connected: server ? new Set() : undefined,
  };

  // eslint-disable-next-line no-console
  const log = (...args) => console.log(server ? 'SERVER' : 'CLIENT', state.id, ...args);

  ws.onmessage = ({ data }) => {
    data = JSON.parse(data);
    switch (data.op) {
      case OPCodes.HELLO:
        state.id = data.d.id;
        log('HELLO');
        if (callback)
          return callback(state);
        break;
      case OPCodes.ACTIVITY:
        log('ACTIVITY', data);
        switch (data.type) {
          case 'JOIN':
          case 'SPECTATE': {
            const c = connections.get(data.secret);
            if (!c)
              break;
            c.state.connected.add(state.id);
            break;
          }
          case 'JOIN_REQUEST':
            break;
        }
        break;
      case OPCodes.BOOP:
        log('BOOP', data.d.boops);
        state.boops = data.d.boops;
        if (!state.connected)
          break;
        for (const connected of state.connected)
          connected.send(OPCodes.BOOP, { boops: data.d.boops });
        break;
      default:
        log('[[ UNKNOWN OP ]]', data);
    }
  };

  ws.onclose = ws.onerror = () => {
    if (server)
      connections.delete(state.id);
  };

  if (server) {
    send(OPCodes.HELLO, { id: state.id });
    connections.set(state.id, { state, send });
  }

  return {
    send,
    boop(boops) {
      state.boops = boops;
      send(OPCodes.BOOP, { boops });
    },
    activity({ type, request: { user, secret } }) {
      log('SEND ACTIVITY');
      send(OPCodes.ACTIVITY, { type, user, secret });
    },
  };
}

module.exports = socket;
