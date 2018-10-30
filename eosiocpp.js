const { spawn } = require('child_process')

main().catch(error => {
  console.error(error)
  process.exit(1)
})

async function main() {
  if (process.argv[2] === '-o') {
    await compile(process.argv[3], process.argv[4])
  } else if (process.argv[2] === '-g') {
    await generateAbi(process.argv[3], process.argv[4])
  }
}

async function compile(output, input) {
  await run(
    `docker run --rm \
    --mount type=bind,src="$(pwd)",dst=/mnt/dev/contract \
    -w "/opt/eosio/bin/" eosio/eos-dev:v1.3.0 \
    eosiocpp -o /mnt/dev/contract/${output} /mnt/dev/contract/${input}`
  )
}

async function generateAbi(output, input) {
  await run(
    `docker run --rm \
    --mount type=bind,src="$(pwd)",dst=/mnt/dev/contract \
    -w "/opt/eosio/bin/" eosio/eos-dev:v1.3.0 \
    eosiocpp -g /mnt/dev/contract/${output} /mnt/dev/contract/${input}`
  )
}

function run(command) {
  return new Promise(resolve => {
    const child = spawn('sh', ['-c', command], { stdio: 'inherit' })
    child.on('close', resolve)
  })
}
