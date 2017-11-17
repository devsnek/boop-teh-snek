const EventEmitter = require('events');

const OPCodes = {
  HELLO: 0,
  STATE: 1,
  CONNECT: 2,
  BOOP: 3,
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
