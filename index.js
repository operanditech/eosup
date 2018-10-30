const { spawn } = require('child_process')
const loadContracts = require('./contracts')

main().catch(error => {
  console.error(error)
  process.exit(1)
})

async function main() {
  if (process.argv[2] === 'start' || process.argv.length === 2) {
    await start()
  } else if (process.argv[2] === 'stop') {
    await stop()
  } else if (process.argv[2] === 'setup') {
    await setup()
  } else if (process.argv[2] === 'tail') {
    await tail()
  } else {
    console.error('Unrecognized command')
  }
}

async function setup() {
  await run('docker pull eosio/eos-dev:v1.3.0')
  await stop()
}

async function stop() {
  await run(
    'docker stop eosio_container || true && docker rm --force eosio_container || true'
  )
  await run('rm -rf data && mkdir -p data')
}

async function start() {
  await run(
    `docker run --rm --name eosio_container -d \
    -p 8888:8888 \
    --mount type=bind,src="$(pwd)"/data,dst=/mnt/dev/data \
    -w "/opt/eosio/bin/" eosio/eos-dev:v1.3.0 \
    nodeos -e -p eosio -d /mnt/dev/data \
    --config-dir /mnt/dev/config \
    --http-validate-host=false \
    --plugin eosio::producer_plugin \
    --plugin eosio::history_plugin \
    --plugin eosio::chain_api_plugin \
    --plugin eosio::history_api_plugin \
    --plugin eosio::http_plugin \
    --http-server-address=0.0.0.0:8888 \
    --access-control-allow-origin=* \
    --contracts-console \
    --verbose-http-errors`
  )
  await new Promise(resolve => setTimeout(resolve, 1000))
  await run('docker exec -it eosio_container /opt/eosio/bin/cleos get info')
  await loadContracts()
}

async function tail() {
  await run('docker logs eosio_container --tail 200 --follow')
}

function run(command) {
  return new Promise(resolve => {
    const child = spawn('sh', ['-c', command], { stdio: 'inherit' })
    child.on('close', resolve)
  })
}
