const { eos, createAccount, setContract } = require('../lib/util')
const path = require('path')

main().catch(e => {
  console.error(e)
  process.exit(1)
})

async function main() {
  await createAccount('test')
  await setContract('test', path.join(__dirname, '.'), 'test')
  await eos.transaction('test', tr => {
    tr.inlinefail({ authorization: 'test@active' })
  })
}
