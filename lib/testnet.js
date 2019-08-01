const path = require('path')
const Dockerator = require('dockerator')
const es = require('event-stream')

const imageTag = require('./imageTag')
const EosUp = require('./eosup')

class Testnet extends Dockerator {
  constructor({
    printOutput = false,
    extraParams = '',
    eosup = new EosUp()
  } = {}) {
    const stdout = es.mapSync(data => {
      if (!this.operational) {
        if (
          data.includes('producer_plugin.cpp') &&
          data.includes('produce_block') &&
          data.includes('Produced block') &&
          data.includes('#2 @ ')
        ) {
          this.operational = true
          this.markOperational()
        }
      }
      return data
    })
    if (printOutput) {
      stdout.pipe(process.stdout)
    }
    super({
      image: imageTag,
      command: [
        'bash',
        '-c',
        `nodeos -e -p eosio -d /mnt/dev/data \
        --config-dir /mnt/dev/config \
        --http-validate-host=false \
        --disable-replay-opts \
        --plugin eosio::producer_plugin \
        --plugin eosio::state_history_plugin \
        --plugin eosio::http_plugin \
        --plugin eosio::chain_api_plugin \
        --http-server-address=0.0.0.0:8888 \
        --access-control-allow-origin=* \
        --contracts-console \
        --verbose-http-errors \
        ${extraParams || ''}`
      ],
      portMappings: ['8888:8888', '8080:8889'],
      stdio: { stdout }
    })
    this.operational = false
    this.eosup = eosup
  }
  async setup() {
    await super.setup({
      context: path.resolve(__dirname, '..', 'image'),
      src: ['Dockerfile']
    })
  }
  async start() {
    await super.start()
    try {
      await new Promise((resolve, reject) => {
        this.markOperational = resolve
        setTimeout(() => reject(new Error('Testnet start timeout')), 30000)
      })
      await this.eosup.loadSystemContracts()
    } catch (error) {
      await this.stop()
      throw error
    }
  }
}

module.exports = Testnet
