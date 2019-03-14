#!/usr/bin/env node

const { DockerTestnet } = require('../lib/operator')

const version = process.argv[2] || '1.5.2'
const extraParams = process.argv.slice(3).join(' ')

main().catch(error => {
  console.error(error)
  process.exit(1)
})

async function main() {
  const testnet = new DockerTestnet({ version, printOutput: true })
  await testnet.setup()
  await testnet.start({ detached: false, extraParams })
}
