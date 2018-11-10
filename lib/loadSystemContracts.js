const { eos, createAccount, setContract } = require('./util')
const path = require('path')

module.exports = async () => {
  await setContract(
    'eosio',
    path.join(__dirname, '../systemContracts'),
    'eosio.bios'
  )
  await createAccount('eosio.token')
  await setContract(
    'eosio.token',
    path.join(__dirname, '../systemContracts'),
    'eosio.token'
  )
  await eos.transaction('eosio.token', tr => {
    tr.create('eosio.token', '1000000000.0000 EOS')
  })
}
