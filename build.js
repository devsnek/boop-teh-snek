#!/usr/env/bin node

'use strict';

const packager = require('electron-packager');

const matrix = {
  mac: ['darwin', 'x64'],
  win: ['win32', 'ia32'],
  linux: ['linux', 'x64'],
};

const sel = matrix[process.argv[2]];

const opt = {
  name: 'BOOP TEH SNEK',
  appCopyright: 'snek 2017',
  dir: '.',
  asar: true,
  overwrite: true,
  prune: true,
  out: './builds',
  ignore: [
    'node_modules/uuid',
  ],
};

if (sel) {
  opt.platform = sel[0];
  opt.arch = sel[1];
} else {
  opt.all = true;
}

packager(opt).then(console.log);
