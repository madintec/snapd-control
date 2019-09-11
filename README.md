# snapd-control

[![Build Status](https://travis-ci.com/madintec/snapd-control.svg?branch=master)](https://travis-ci.com/madintec/snapd-control)

This library allows you to communicate with the Snap daemon throught its [REST API](https://github.com/snapcore/snapd/wiki/REST-API) in NodeJS.

There is currently no external HTTPS over TCP socket support, so the default settings uses the Unix socket in `/run/snapd.socket`.

## Usage

### Install

There is currently no NPM package, so install this library by running :

```bash
npm install --save https://github.com/madintec/snapd-control.git
```

### Getting started

```js
const Snapd = require('snapd-control')

const snap = new Snapd()

snap.info('gitkraken')
    .then(infos => console.log(infos))
    .catch(err => console.error(err))

// Will log a JS object containing snap informations
```

## Hacking

See [HACKING](HACKING.md)

## License

Copyright (c) 2019 Clément Dandrieux, [madintec.com](https://madintec.com)

This program is released under the [MIT license](./LICENSE).