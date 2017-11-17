const { ipcRenderer: ipc, webFrame } = require('electron');
const socket = require('../socket');
const snek = document.getElementById('snek');
const counter = document.getElementById('boops');
webFrame.setZoomLevelLimits(1, 1);

let boops = 0;

const ws = socket(({ id }) => {
  ipc.send('HELLO', { id });
});

ipc.on('ACTIVITY', (...args) => {
  console.log(args);
});

function boop() {
  boops++;
  counter.innerHTML = `${boops} BOOPS`;
  ipc.send('BOOP', { boops });
  ws.boop(boops);
}

snek.onmousedown = () => {
  snek.style['font-size'] = '550%';
  boop();
};

snek.onmouseup = () => {
  snek.style['font-size'] = '500%';
};
