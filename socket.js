const EventEmitter = require('events');
const WebSocket = (() => {
  try {
    return window.WebSocket;
  } catch (err) {
    return require('ws');
  }
})();

const OPCodes = {
  HELLO: 0,
  SUBSCRIBE: 1,
  UNSUBSCRIBE: 2,
  EVENT: 3,
  PUBLISH: 4,
  DISCONNECT: 5,
};

class Socket extends EventEmitter {
  constructor(gateway) {
    super();
    if (typeof gateway === 'string') {
      this.gateway = gateway;
      this.gen();
    } else {
      this.ws = gateway;
      this.attach();
    }
  }

  send(op, d) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN)
      return;

    this.ws.send(JSON.stringify({ op, d }));
  }

  gen() {
    const ws = this.ws = new WebSocket(this.gateway);
    this.ws.onclose = ws.onerror = () => {
      setTimeout(this.gen.bind(this), 1500);
    };
    this.attach();
  }

  attach() {
    this.ws.onmessage = ({ data }) => {
      try {
        this.emit('message', JSON.parse(data));
      } catch (err) {} // eslint-disable-line no-empty
    };
  }
}

module.exports = {
  Socket,
  OPCodes,
};
