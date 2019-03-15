#!/usr/bin/env node

const Compiler = require('../lib/compiler')

main().catch(error => {
  console.error(error)
  process.exit(1)
})

async function main() {
  const compiler = new Compiler()
  await compiler.setup()
  await compiler.compile(process.argv[2], process.argv[3], process.argv[4])
  process.exit()
}
