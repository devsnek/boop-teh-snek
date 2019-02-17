'use strict';

/* eslint-env browser */

const { ipcRenderer: ipc, webFrame, remote } = require('electron');
const { Socket, OPCodes } = require('./socket');
const { WS } = require('./constants');

webFrame.setZoomLevelLimits(1, 1);

const snek = document.getElementById('snek');
const counter = document.getElementById('boops');

const state = window.state = {
  boops: 0,
  id: undefined,
  connected: 0,
  readonly: false,
  party: undefined,
};

const c = remote.getGlobal('console');
const log = (...args) => {
  // eslint-disable-next-line no-console
  console.log(...args);
  c.log(...args);
};

const ws = new Socket(WS);

function boop(boops) {
  if (boops) {
    state.boops = boops;
  } else {
    state.boops += 1;
  }
  counter.innerHTML = `${state.boops} BOOPS`;
  ws.send(OPCodes.PUBLISH, { boops: state.boops });
  if (state.party) {
    ws.send(OPCodes.BROADCAST, { target: state.party, boop: state.boops });
  }
}

ws.on('message', ({ op, d }) => {
  log(op, d);
  switch (op) {
    case OPCodes.HELLO:
      state.id = d.id;
      break;
    case OPCodes.PUBLISH:
      if (d.boops) {
        boop(d.boops);
      }
      break;
    case OPCodes.DISCONNECT:
      state.readonly = false;
      state.party = undefined;
      break;
    default:
      break;
  }
});

ipc.on('ACTIVITY', (evt, d) => {
  if (d.type === 'REQUEST') {
    // show modal
    ipc.send('REQUEST_REPLY', { type: 'ACCEPT' });
  } else {
    ws.send(OPCodes.SUBSCRIBE, d.secret);
    state.party = d.secret;
    if (d.type === 'SPECTATE') {
      state.readonly = true;
    }
  }
});

snek.onmousedown = () => {
  if (state.readonly) {
    return;
  }
  snek.style['font-size'] = '550%';
  boop();
};

snek.onmouseup = () => {
  if (state.readonly) {
    return;
  }
  snek.style['font-size'] = '500%';
};
