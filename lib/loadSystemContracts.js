const { eos, createAccount, setContract } = require('./util')

module.exports = async () => {
  await setContract('eosio', './systemContracts', 'eosio.bios')
  await createAccount('eosio.token')
  await setContract('eosio.token', './systemContracts', 'eosio.token')
  await eos.transaction('eosio.token', tr => {
    tr.create('eosio.token', '1000000000.0000 EOS')
  })
}
