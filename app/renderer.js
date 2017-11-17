const { ipcRenderer: ipc, webFrame, remote } = require('electron');
const { Socket, OPCodes } = require('../socket');
webFrame.setZoomLevelLimits(1, 1);

const snek = document.getElementById('snek');
const counter = document.getElementById('boops');

const state = window.state = {
  boops: 0,
  id: undefined,
  connected: 0,
  readonly: false,
};

const c = remote.getGlobal('console');
const log = (...args) => {
  // eslint-disable-next-line no-console
  console.log(...args);
  c.log(...args);
};

const ws = new Socket('wss://boop.gc.gy');
ws.on('message', ({ op, d }) => {
  log(op, d);
  switch (op) {
    case OPCodes.HELLO:
      state.id = d.id;
      break;
    case OPCodes.EVENT:
      if (d.boops)
        boop(d.boops);
      break;
    case OPCodes.DISCONNECT:
      state.readonly = false;
      break;
  }
});

ipc.on('ACTIVITY', (evt, d) => {
  if (!d.secret)
    return;

  ws.send(OPCodes.SUBSCRIBE, d.secret);
  if (d.type === 'SPECTATE')
    state.readonly = true;
});

function boop(boops) {
  if (boops)
    state.boops = boops;
  else
    state.boops++;
  counter.innerHTML = `${state.boops} BOOPS`;
  ws.send(OPCodes.PUBLISH, { boops: state.boops });
}

snek.onmousedown = () => {
  if (state.readonly)
    return;
  snek.style['font-size'] = '550%';
  boop();
};

snek.onmouseup = () => {
  if (state.readonly)
    return;
  snek.style['font-size'] = '500%';
};
