const { spawn } = require('child_process')
const loadContracts = require('../lib/loadSystemContracts')

main().catch(error => {
  console.error(error)
  process.exit(1)
})

async function main() {
  if (process.argv[2] === 'start' || process.argv.length === 2) {
    await start()
  } else if (process.argv[2] === 'stop') {
    await stop()
  } else if (process.argv[2] === 'tail') {
    await tail()
  } else {
    console.error('Unrecognized command')
  }
}

async function stop() {
  await run('kill -9 $(cat "$(pwd)"/data/nodeos.pid) || true')
  await run('rm -rf data && mkdir -p data')
}

async function start() {
  await run(
    `nodeos -e -p eosio -d "$(pwd)"/data \
    --plugin eosio::producer_plugin \
    --plugin eosio::history_plugin \
    --plugin eosio::chain_api_plugin \
    --plugin eosio::history_api_plugin \
    --plugin eosio::http_plugin \
    --plugin eosio::statetrack_plugin \
    --http-server-address=0.0.0.0:8888 \
    --http-validate-host=false \
    --access-control-allow-origin=* \
    --contracts-console \
    --verbose-http-errors \
    >>"$(pwd)"/data/nodeos.log 2>&1 \
    & echo $! > "$(pwd)"/data/nodeos.pid`,
    { background: true }
  )
  await new Promise(resolve => setTimeout(resolve, 3000))
  await run('cleos get info')
  await loadContracts()
}

async function tail() {
  await run('tail -200 -f "$(pwd)"/data/nodeos.log')
}

async function run(command, { background = false } = {}) {
  if (background) {
    const subprocess = spawn('sh', ['-c', command], {
      detached: true,
      stdio: 'ignore'
    })
    subprocess.unref()
    return subprocess
  } else {
    await new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', command], { stdio: 'inherit' })
      child.on('close', resolve)
      child.on('exit', code => {
        if (code !== 0) {
          reject(new Error('Child process exited with an error code'))
        }
      })
    })
  }
}
