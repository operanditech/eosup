#!/usr/bin/env node

const { DockerTestnet } = require('../lib/operator')

const version = process.argv[2] || '1.5.2'

main().catch(error => {
  console.error(error)
  process.exit(1)
})

async function main() {
  const testnet = new DockerTestnet({ version, printOutput: true })
  await testnet.setup()
  await testnet.start()
  const exitHandler = () => {
    console.log('Stopping testnet...')
    testnet.stop().finally(() => {
      process.exit()
    })
  }
  process.on('SIGINT', exitHandler)
  process.on('SIGTERM', exitHandler)
  await testnet.tail()
}
