#!/usr/env/bin node

'use strict';

const packager = require('electron-packager');
const fs = require('fs').promises;
const { CLIENT_ID } = require('./src/constants');

const target = process.argv[2];
const matrix = {
  darwin: {
    arch: 'x64',
    extension: '.app',
  },
  win32: {
    arch: ['x64', 'ia32'],
    extension: '.exe',
  },
  linux: {
    arch: ['x64', 'armv7l', 'arm64', 'mips64el'],
    extension: '',
  },
};

const config = {
  name: 'BOOP_TEH_SNEK',
  appCopyright: 'Copyright (c) 2018 Gus Caplan',
  dir: '.',
  asar: true,
  overwrite: true,
  prune: true,
  out: './builds',
  ignore: [
    'node_modules/uuid',
  ],
};

if (target) {
  const selection = matrix[target];
  config.platform = target;
  config.arch = selection.arch;
} else {
  config.platform = Object.keys(matrix);
  config.arch = 'all';
}

const discordPlatforms = {
  'darwin-x64': 'macos',
  'linux-x64': 'linux',
  'win32-ia32': 'win32',
  'win32-x64': 'win64',
};

packager(config).then((builds) => {
  const dispatch = {
    application: {
      id: '__ID__', // __ID__ because numbers in js can't represent 64bit ids
      manifests: [],
    },
  };
  builds.forEach(({ platform, arch, name }) => {
    const { extension } = matrix[platform];
    const discordPlatform = discordPlatforms[`${platform}-${arch}`];
    if (!discordPlatform) {
      return;
    }
    dispatch.application.manifests.push({
      label: `boop-teh-snek/${platform}-${arch}`,
      platforms: [discordPlatform],
      locales: ['en-US'],
      local_root: `BOOP_TEH_SNEK-${platform}-${arch}`,
      launch_options: [{
        name: 'BOOP TEH SNEK',
        executable: `BOOP_TEH_SNEK-${platform}-${arch}/${name}${extension}`,
        arguments: [],
        platforms: [discordPlatform],
      }],
    });
  });
  const json = JSON.stringify(dispatch, null, 2).replace('"__ID__"', CLIENT_ID);
  return fs.writeFile('./builds/dispatch.json', json);
});
