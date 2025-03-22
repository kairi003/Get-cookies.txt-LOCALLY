const icongen = require('icon-gen');
const fs = require('node:fs');

icongen('icon.svg', '../src/images', {
  favicon: {
    name: 'icon',
    pngSizes: [16, 32, 48, 128],
  },
}).then(() => {
  fs.unlinkSync('../src/images/favicon.ico');
});
