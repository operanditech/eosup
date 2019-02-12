# eosio-operator

This package installs an executable for managing your local
EOSIO testnet from Docker.
It can be installed globally for ease of access to the
executable, or installed inside a project as a dependency
to access utility functions for creating seed data, or running
the executable from your `package.json` scripts section.

## Usage

Run `eosop` to start a local single-node testnet and load the
`eosio.bios` and `eosio.token` contracts and create the `EOS`
token with 1 billion supply. The process will start printing the
`nodeos` output. When you terminate it, it will stop the Docker
container and clean up the blockchain files.

You can also specify what version of the EOSIO software to use
like this: `eosop 1.4.1`.

### Globally

Install globally with `npm install -g eosio-operator`. Then simply
run `eosop` anywhere.

## Inside a project

Install as a dependency with `npm install --save eosio-operator`.
Then run `eosop` from your `package.json` scripts, like this:

```json
"scripts": {
  "start": "eosop 1.5.0"
},
```

You can also use the `DockerTestnet` class from your code by
importing this package, giving you more control over the
management of your testnet.

Additionally, the `Operator` class provides various useful
functions for creating accounts, loading contracts, giving
`eosio.code` permissions, and more. You can use these for
loading seed data into your testnet, or running automated tests
for your contracts.
