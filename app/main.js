/* eslint-disable no-console */

const { app, BrowserWindow, ipcMain: ipc } = require('electron');
const path = require('path');
const url = require('url');
const DiscordRPC = require('discord-rpc');

// don't change the client id if you want this example to work
const ClientId = '180984871685062656';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 340,
    height: 380,
    resizable: false,
    titleBarStyle: 'hidden',
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null)
    createWindow();
});

app.setAsDefaultProtocolClient(`discord-${ClientId}`, path.join(__dirname, 'launch.sh'));

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

const state = {
  boops: 0,
};

function setActivity() {
  if (!rpc)
    return;

  rpc.setActivity({
    details: `booped ${state.boops} times`,
    state: `booping ${state.partySize ? 'with friends' : 'alone'}`,
    startTimestamp,
    largeImageKey: 'snek_large',
    largeImageText: 'tea is delicious',
    smallImageKey: 'snek_small',
    smallImageText: 'i am my own pillows',
    partyId: state.id,
    partySize: state.partySize,
    matchSecret: state.id ? `m${state.id}` : undefined,
    joinSecret: state.id ? `j${state.id}` : undefined,
    spectateSecret: state.id ? `s${state.id}` : undefined,
    instance: true,
  });
}

rpc.on('ready', () => {
  setActivity();

  rpc.subscribe('ACTIVITY_JOIN', ({ secret }) => {
    secret = secret.slice(1);
    mainWindow.webContents.send('ACTIVITY', { type: 'JOIN', secret });
  });

  rpc.subscribe('ACTIVITY_SPECTATE', ({ secret }) => {
    secret = secret.slice(1);
    mainWindow.webContents.send('ACTIVITY', { type: 'SPECTATE', secret });
  });

  // rpc.subscribe('ACTIVITY_JOIN_REQUEST', ({ user }) => {
  //   mainWindow.webContents.send('ACTIVITY', { type: 'REQUEST', user });
  // });

  // activity can only be set every 15 seconds
  setInterval(() => {
    setActivity();
  }, 15e3);
});

rpc.login(ClientId).catch(console.error);

ipc.on('STATE', (evt, s) => {
  Object.assign(state, s);
});
