const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const { Api, JsonRpc, Serialize } = require('eosjs')
let JsSignatureProvider = require('eosjs/dist/eosjs-jssig')
JsSignatureProvider =
  JsSignatureProvider['default'] || JsSignatureProvider['JsSignatureProvider']
const fetch = require('node-fetch')
const { TextEncoder, TextDecoder } = require('util')

class Operator {
  constructor({ eos } = {}) {
    if (eos) {
      this.eos = eos
    } else {
      const signatureProvider = new JsSignatureProvider([
        Operator.keypair.private
      ])
      const rpc = new JsonRpc('http://localhost:8888', { fetch })
      this.eos = new Api({
        rpc,
        signatureProvider,
        textEncoder: new TextEncoder(),
        textDecoder: new TextDecoder()
      })
    }
  }
  async createAccount(name, publicKey = Operator.keypair.public) {
    const auth = {
      threshold: 1,
      keys: [{ weight: 1, key: publicKey }],
      accounts: [],
      waits: []
    }
    return this.eos.transact(
      {
        actions: [
          {
            account: 'eosio',
            name: 'newaccount',
            authorization: [
              {
                actor: 'eosio',
                permission: 'active'
              }
            ],
            data: {
              creator: 'eosio',
              name,
              owner: auth,
              active: auth
            }
          }
        ]
      },
      { blocksBehind: 0, expireSeconds: 60 }
    )
  }
  async setContract(account, contractDir, contractName) {
    const wasm = fs.readFileSync(`${contractDir}/${contractName}.wasm`)
    let abi = fs.readFileSync(`${contractDir}/${contractName}.abi`)

    abi = JSON.parse(abi)
    const abiDefinition = this.eos.abiTypes.get('abi_def')

    for (const { name: field } of abiDefinition.fields) {
      if (!(field in abi)) {
        abi[field] = []
      }
    }

    const buffer = new Serialize.SerialBuffer({
      textEncoder: this.eos.textEncoder,
      textDecoder: this.eos.textDecoder
    })
    abiDefinition.serialize(buffer, abi)
    abi = buffer.asUint8Array()

    return this.eos.transact(
      {
        actions: [
          {
            account: 'eosio',
            name: 'setcode',
            authorization: [
              {
                actor: account,
                permission: 'active'
              }
            ],
            data: {
              account,
              vmtype: 0,
              vmversion: 0,
              code: wasm
            }
          },
          {
            account: 'eosio',
            name: 'setabi',
            authorization: [
              {
                actor: account,
                permission: 'active'
              }
            ],
            data: {
              account,
              abi
            }
          }
        ]
      },
      { blocksBehind: 0, expireSeconds: 60 }
    )
  }
  async giveCodeActivePermission(account, contract) {
    const auth = (await this.eos.rpc.get_account(account)).permissions.find(
      p => p.perm_name === 'active'
    ).required_auth
    auth.accounts.push({
      permission: { actor: contract, permission: 'eosio.code' },
      weight: auth.threshold
    })
    return this.eos.transact(
      {
        actions: [
          {
            account: 'eosio',
            name: 'updateauth',
            authorization: [
              {
                actor: account,
                permission: 'active'
              }
            ],
            data: {
              account,
              permission: 'active',
              parent: 'owner',
              auth
            }
          }
        ]
      },
      { blocksBehind: 0, expireSeconds: 60 }
    )
  }
  async loadSystemContracts() {
    await this.setContract(
      'eosio',
      path.join(__dirname, '../systemContracts'),
      'eosio.bios'
    )
    await this.createAccount('eosio.token')
    await this.setContract(
      'eosio.token',
      path.join(__dirname, '../systemContracts'),
      'eosio.token'
    )
    await this.eos.transact(
      {
        actions: [
          {
            account: 'eosio.token',
            name: 'create',
            authorization: [
              {
                actor: 'eosio.token',
                permission: 'active'
              }
            ],
            data: {
              issuer: 'eosio.token',
              maximum_supply: '1000000000.0000 EOS'
            }
          }
        ]
      },
      { blocksBehind: 0, expireSeconds: 60 }
    )
  }
}
Operator.keypair = {
  public: 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV',
  private: '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'
}

module.exports = Operator

function run(command, printOutput = true) {
  return new Promise(resolve => {
    const child = spawn('sh', ['-c', command], {
      stdio: printOutput ? 'inherit' : 'ignore'
    })
    child.on('close', resolve)
  })
}

class DockerTestnet {
  constructor({
    version = 'latest',
    printOutput = false,
    operator = new Operator()
  } = {}) {
    this.version = version
    this.printOutput = printOutput
    this.operator = operator
  }
  async setup() {
    await run(`docker pull eosio/eos-dev:v${this.version}`, this.printOutput)
  }
  async stop() {
    await run(
      'docker stop eosio || true && docker rm --force eosio || true',
      this.printOutput
    )
  }
  async start() {
    await run(
      `docker run --rm --name eosio -d \
      -p 8888:8888 \
      -w "/opt/eosio/bin/" eosio/eos-dev:v${this.version} \
      nodeos -e -p eosio -d /mnt/dev/data \
      --config-dir /mnt/dev/config \
      --http-validate-host=false \
      --plugin eosio::producer_plugin \
      --plugin eosio::history_plugin \
      --plugin eosio::chain_api_plugin \
      --plugin eosio::history_api_plugin \
      --plugin eosio::http_plugin \
      --http-server-address=0.0.0.0:8888 \
      --access-control-allow-origin=* \
      --contracts-console \
      --verbose-http-errors`,
      this.printOutput
    )
    await new Promise(resolve => setTimeout(resolve, 3000))
    await run(
      'docker exec -it eosio /opt/eosio/bin/cleos get info',
      this.printOutput
    )
    await this.operator.loadSystemContracts()
  }
  async tail() {
    await run('docker logs eosio --tail 200 --follow', this.printOutput)
  }
}

Operator.DockerTestnet = DockerTestnet
