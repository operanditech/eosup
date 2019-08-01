const fs = require('fs')
const path = require('path')

const { Api, JsonRpc, Serialize } = require('eosjs')
let JsSignatureProvider = require('eosjs/dist/eosjs-jssig')
JsSignatureProvider =
  JsSignatureProvider['default'] || JsSignatureProvider['JsSignatureProvider']
const fetch = require('node-fetch')
const { TextEncoder, TextDecoder } = require('util')

const Compiler = require('./compiler')

class EosUp {
  constructor({ eos } = {}) {
    if (eos) {
      this.eos = eos
    } else {
      const signatureProvider = new JsSignatureProvider([EosUp.keypair.private])
      const rpc = new JsonRpc('http://localhost:8888', { fetch })
      this.eos = new Api({
        rpc,
        signatureProvider,
        textEncoder: new TextEncoder(),
        textDecoder: new TextDecoder()
      })
    }
  }
  static async compile({
    printOutput,
    input,
    output,
    contract,
    extraParams
  } = {}) {
    await Compiler.compile({
      printOutput,
      input,
      output,
      contract,
      extraParams
    })
  }
  async createAccount(name, publicKey = EosUp.keypair.public) {
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
  async setContract(account, contractPath) {
    const wasm = fs.readFileSync(contractPath)
    let abi = fs.readFileSync(
      path.format({
        ...path.parse(contractPath),
        ext: '.abi',
        base: undefined
      })
    )

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
  async hasCodeActivePermission(account, contract) {
    const auth = (await this.eos.rpc.get_account(account)).permissions.find(
      p => p.perm_name === 'active'
    ).required_auth
    const entry = auth.accounts.find(
      a =>
        a.permission.actor === contract &&
        a.permission.permission === 'eosio.code' &&
        a.weight >= auth.threshold
    )
    return !!entry
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
EosUp.keypair = {
  public: 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV',
  private: '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'
}

module.exports = EosUp
