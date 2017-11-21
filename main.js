/* eslint-disable no-console */

const { app, BrowserWindow, ipcMain: ipc } = require('electron');
const path = require('path');
const url = require('url');
const DiscordRPC = require('discord-rpc');

process.on('unhandledRejection', console.error);

const ClientId = '180984871685062656';

app.setAsDefaultProtocolClient(`discord-${ClientId}`);

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

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

async function setActivity() {
  if (!rpc)
    return;

  const state = await mainWindow.webContents.executeJavaScript('window.state');

  if (!state)
    return;

  rpc.setActivity({
    details: `booped ${state.boops} times`,
    state: `booping ${state.party ? `with ${state.connected} friends` : 'alone'}`,
    startTimestamp,
    largeImageKey: 'snek_large',
    largeImageText: 'tea is delicious',
    smallImageKey: 'snek_small',
    smallImageText: 'i am my own pillows',
    partyId: state.party || state.id,
    partySize: state.connections,
    matchSecret: state.id ? `m${state.id}` : undefined,
    joinSecret: state.id ? `j${state.id}` : undefined,
    spectateSecret: state.id ? `s${state.id}` : undefined,
    instance: true,
  });
}

rpc.on('ready', () => {
  rpc.subscribe('ACTIVITY_JOIN', ({ secret }) => {
    mainWindow.webContents.send('ACTIVITY', {
      type: 'JOIN',
      secret: secret.slice(1),
    });
  });

  rpc.subscribe('ACTIVITY_SPECTATE', ({ secret }) => {
    mainWindow.webContents.send('ACTIVITY', {
      type: 'SPECTATE',
      secret: secret.slice(1),
    });
  });

  rpc.subscribe('ACTIVITY_JOIN_REQUEST', ({ user }) => {
    mainWindow.webContents.send('ACTIVITY', { type: 'REQUEST', user });
  });

  setActivity();

  setInterval(() => {
    setActivity();
  }, 15e3);
});

ipc.on('REQUEST_REPLY', (evt, data) => {
  switch (data.type) {
    case 'ACCEPT':
      rpc.sendJoinInvite(data.user);
      break;
    default:
      rpc.closeJoinRequest(data.user);
      break;
  }
});

rpc.login(ClientId).catch(console.error);
