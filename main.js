'use strict';

/* eslint-disable no-console */

const { app, BrowserWindow, ipcMain: ipc } = require('electron');
const path = require('path');
const url = require('url');
const DiscordRPC = require('discord-rpc');

process.on('unhandledRejection', console.error);

const clientId = '180984871685062656';

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
  if (mainWindow === null) {
    createWindow();
  }
});

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

async function setActivity() {
  if (!rpc) {
    return undefined;
  }

  const state = await mainWindow.webContents.executeJavaScript('window.state');

  if (!state) {
    return undefined;
  }

  return rpc.setActivity({
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

  setActivity().then(console.log);

  setInterval(() => {
    setActivity().then(console.log);
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

DiscordRPC.register(clientId);
rpc.login({ clientId }).catch(console.error);
