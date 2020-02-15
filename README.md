# eosup

This package installs an executable for managing your local
EOSIO testnet from Docker, as well as for compiling EOSIO
smart contracts.
It can be installed globally for ease of access to the
executable, or installed inside a project as a dependency
to access utility functions for creating seed data, or running
the executable from your `package.json` scripts section.

## Installing

### Globally

Install globally with `npm install -g eosup`. Then simply
run `eosup` anywhere.

### Inside a project

Install as a dependency of your project with `npm install eosup`.
Then, run `eosup` from your `package.json` scripts, like this:

```json
"scripts": {
  "build": "eosup compile contract.cpp contract.wasm -c contractname",
  "testnet": "eosup testnet"
},
```

## Usage

Run `eosup --help` to get info on the specific commands
and options.

In the current version, this tool uses EOSIO version 1.8.9 and
eosio.cdt version 1.7.0. Block.one doesn't provide the packages
in a package registry that allows for simple version selection yet,
so for using other versions, a new release of eosup will be
necessary. Please open an issue in this repository if you require
such update.

### Testnet

Run `eosup testnet` to start a local single-node testnet
and load the `eosio.bios` and `eosio.token` contracts, and create
the `EOS` token with 1 billion supply. The process will start printing
the `nodeos` output. When you terminate it, it will stop the Docker
container and clean up the blockchain files.

#### Managing testnet programatically

You can also use the `Testnet` class from your code by
importing this package, giving you more control over the
management of your testnet.

```js
const { Testnet } = require('eosup')

async function testnetExample() {
  const testnet = new Testnet({
    printOutput: false,
    extraParams: '--verbose-http-errors'
  })
  await testnet.setup() // This makes sure the Docker image is ready
  testnet.loadExitHandler() // Kill the testnet when killing the current process
  await testnet.start()
  // ...
  await testnet.stop()
}
```

### Loading seeds

You can run `eosup testnet -c "node loadSeeds.js"` for example,
which will run the specified command (`node loadSeeds.js`) right after the
testnet becomes operational and ready to receive transactions. This
allows you to, for example, use TypeScript for loading the seeds
(`ts-node loadSeeds.ts`), or run anything else you want.

Additionally, the `EosUp` class provides various useful
functions for creating accounts, loading contracts, giving
`eosio.code` permissions, and more. You can use these for
loading seed data into your testnet, or running automated tests
against your contracts on the blockchain.

```js
const { EosUp } = require('eosup')

async function seedingExample() {
  const up = new EosUp()
  
  await up.createAccount('superdapp') // Can provide a public key as second parameter
  await up.setContract('superdapp', './contract.wasm') // Will automatically load the ABI file with the same name
  
  await up.createAccount('user1')
  // Add { actor: 'superdapp', permission: 'eosio.code' } to user1's 'active' permission:
  const granted = await up.hasCodeActivePermission('user1', 'superdapp')
  if (!granted) {
    await up.giveCodeActivePermission('user1', 'superdapp')
  }
}
```

### Compiling contracts

Run `eosup compile <inputFile> <outputFile>` to compile smart
contracts using eosio.cdt (even in Windows). It also supports a
`--contract <name>` option to specify the contract name to be used for
generating the ABI.

#### Compiling contracts programatically

The `EosUp` class provides a static function for compiling contracts
from your code.

```js
const { EosUp } = require('eosup')

async function compileExample() {
  await EosUp.compile({
    input: './inputFile.cpp',
    output: './outputFile.wasm',
    contract: 'mycontract'
  })
}
```

## Contributing

- Please report any bugs you find.
- Pull requests welcome. Maybe open an issue first to discuss it before you work on new features.
