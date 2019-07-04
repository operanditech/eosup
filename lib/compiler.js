const Dockerator = require('dockerator')
const path = require('path')
const imageTag = require('./imageTag')

class Compiler extends Dockerator {
  static async compile({
    version,
    printOutput,
    contract,
    input,
    output,
    extraParams
  } = {}) {
    const compiler = new Compiler({ version, printOutput })
    await compiler.setup()
    await compiler.compile(contract, input, output, { extraParams })
  }
  constructor({ printOutput = false } = {}) {
    super({
      image: imageTag,
      stdio: printOutput ? 'inherit' : 'ignore',
      dockerConfig: {
        NetworkDisabled: true,
        HostConfig: {}
      }
    })
  }
  async setup() {
    await super.setup({ context: './image', src: ['Dockerfile'] })
  }
  async compile(input, output, contract = null, { extraParams = '' } = {}) {
    input = path.parse(input)
    output = path.parse(output)
    this.dockerConfig.HostConfig.Binds = [
      `${path.join(process.cwd(), input.dir)}:/mnt/dev/input`,
      `${path.join(process.cwd(), output.dir)}:/mnt/dev/output`
    ]
    const inputFile = path.join('/mnt/dev/input', input.base)
    const outputFile = path.join('/mnt/dev/output', output.base)
    this.command = [
      'bash',
      '-c',
      `eosio-cpp -o ${outputFile} ${inputFile} ${
        contract ? `-abigen -contract ${contract}` : ''
      } ${extraParams}`
    ]
    await super.start({ untilExit: true })
  }
}

module.exports = Compiler
