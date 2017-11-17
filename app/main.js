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
let boops = 0;
let wsId = undefined;
let partySize = undefined;
const startTimestamp = new Date();

function setActivity() {
  if (!rpc)
    return;

  rpc.setActivity({
    details: `booped ${boops} times`,
    state: `booping ${partySize ? 'with friends' : 'alone'}`,
    startTimestamp,
    largeImageKey: 'snek_large',
    largeImageText: 'tea is delicious',
    smallImageKey: 'snek_small',
    smallImageText: 'i am my own pillows',
    partyId: wsId,
    partySize: partySize,
    matchSecret: wsId && `M${wsId}`,
    joinSecret: wsId && `J${wsId}`,
    spectateSecret: wsId && `S${wsId}`,
    instance: true,
  });
}

rpc.on('ready', () => {
  setActivity();

  rpc.subscribe('ACTIVITY_JOIN', (request) => {
    mainWindow.webContents.send('ACTIVITY', { type: 'JOIN', request });
  });

  rpc.subscribe('ACTIVITY_SPECTATE', (request) => {
    mainWindow.webContents.send('ACTIVITY', { type: 'SPECTATE', request });
  });

  rpc.subscribe('ACTIVITY_JOIN_REQUEST', (request) => {
    mainWindow.webContents.send('ACTIVITY', { type: 'REQUEST', request });
  });

  // activity can only be set every 15 seconds
  setInterval(() => {
    setActivity();
  }, 15e3);
});

rpc.login(ClientId).catch(console.error);

ipc.on('HELLO', (evt, { id }) => {
  wsId = id;
});

ipc.on('BOOP', (evt, { boops: b }) => {
  boops = b;
});
