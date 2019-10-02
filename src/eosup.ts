/// <reference types="../@types/types" />

import fs from 'fs'
import path from 'path'

import { Api, JsonRpc, Serialize } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig'
import fetch from 'node-fetch'
import { TextDecoder, TextEncoder } from 'util'

import { FlexAuth, Morpheos, Transaction } from 'morpheos'

import Compiler from './compiler'

export default class EosUp {
  public static keypair = {
    public: 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV',
    private: '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'
  }

  public static async compile({
    printOutput,
    input,
    output,
    contract,
    extraParams
  }: {
    printOutput?: boolean
    input: string
    output: string
    contract?: string
    extraParams?: string
  }) {
    await Compiler.compile({
      printOutput,
      input,
      output,
      contract,
      extraParams
    })
  }

  public morph: Morpheos

  constructor({ eos }: { eos?: Api | Morpheos } = {}) {
    if (eos) {
      this.morph = new Morpheos(eos)
    } else {
      const signatureProvider = new JsSignatureProvider([EosUp.keypair.private])
      const rpc = new JsonRpc('http://localhost:8888', { fetch })
      this.morph = new Morpheos(
        new Api({
          rpc,
          signatureProvider,
          textEncoder: new TextEncoder() as any,
          textDecoder: new TextDecoder() as any
        })
      )
    }
  }

  public async createAccount(name: string, publicKey = EosUp.keypair.public) {
    const auth = {
      threshold: 1,
      keys: [{ weight: 1, key: publicKey }],
      accounts: [],
      waits: []
    }
    return this.morph.transact({
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
    })
  }

  public async setContract(account: string, contractPath: string) {
    const wasm = fs.readFileSync(contractPath)
    const abiBuffer = fs.readFileSync(
      path.format({
        ...path.parse(contractPath),
        ext: '.abi',
        base: undefined
      })
    )

    const abi: { [key: string]: any } = JSON.parse((abiBuffer as any) as string)
    const abiDefinition = this.morph.eos.abiTypes.get('abi_def')
    if (!abiDefinition) {
      throw new Error('Missing ABI definition')
    }

    for (const { name: field } of abiDefinition.fields) {
      if (!(field in abi)) {
        abi[field] = []
      }
    }

    const buffer = new Serialize.SerialBuffer({
      textEncoder: this.morph.eos.textEncoder,
      textDecoder: this.morph.eos.textDecoder
    })
    abiDefinition.serialize(buffer, abi)

    return this.morph.transact([
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
          abi: buffer.asUint8Array()
        }
      }
    ])
  }

  public async hasCodeActivePermission(account: string, contract: string) {
    const auth = (await this.morph.eos.rpc.get_account(
      account
    )).permissions.find((p: any) => p.perm_name === 'active').required_auth
    const entry = auth.accounts.find(
      (a: any) =>
        a.permission.actor === contract &&
        a.permission.permission === 'eosio.code' &&
        a.weight >= auth.threshold
    )
    return !!entry
  }

  public async giveCodeActivePermission(account: string, contract: string) {
    const auth = (await this.morph.eos.rpc.get_account(
      account
    )).permissions.find((p: any) => p.perm_name === 'active').required_auth
    auth.accounts.push({
      permission: { actor: contract, permission: 'eosio.code' },
      weight: auth.threshold
    })
    return this.morph.transact({
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
    })
  }

  public async loadSystemContracts() {
    await this.setContract(
      'eosio',
      path.join(__dirname, '../systemContracts/eosio.bios.wasm')
    )
    await this.createAccount('eosio.token')
    await this.setContract(
      'eosio.token',
      path.join(__dirname, '../systemContracts/eosio.token.wasm')
    )
    await this.morph.transact({
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
    })
  }

  public async issueEos(
    account: string,
    amount: string,
    memo = 'Issued funds'
  ) {
    return this.morph.transact({
      account: 'eosio.token',
      name: 'issue',
      authorization: [{ actor: 'eosio.token', permission: 'active' }],
      data: {
        to: account,
        quantity: amount,
        memo
      }
    })
  }

  public async transfer(
    from: FlexAuth,
    to: string,
    quantity: { quantity: string; contract: string },
    memo = ''
  ) {
    return this.morph.transact({
      account: quantity.contract,
      name: 'transfer',
      authorization: from,
      data: {
        from: Transaction.extractAccountName(from),
        to,
        quantity: quantity.quantity,
        memo
      }
    })
  }
}
