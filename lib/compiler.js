const Dockerator = require('dockerator')
const path = require('path')

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
  constructor({ version = '1.5.0', printOutput = false } = {}) {
    super({
      image: `eostudio/eosio.cdt:v${version}`,
      stdio: printOutput ? 'inherit' : 'ignore',
      dockerConfig: {
        NetworkDisabled: true,
        HostConfig: {
          Binds: [`${process.cwd()}:/mnt/dev/contract`]
        }
      }
    })
  }
  async compile(contract, input, output, { extraParams = '' } = {}) {
    let abiOutput = path.format({
      ...path.parse(output),
      ext: '.abi',
      base: undefined
    })
    if (process.platform === 'win32') {
      abiOutput = abiOutput.replace('\\', '/')
    }
    this.command = [
      'bash',
      '-c',
      `eosio-cpp /mnt/dev/contract/${input} -c -o /tmp/contract.out ${extraParams} && \
      eosio-ld /tmp/contract.out -o /mnt/dev/contract/${output} && \
      eosio-abigen /mnt/dev/contract/${input} -contract ${contract} -output /mnt/dev/contract/${abiOutput}`
    ]
    await super.start({ untilExit: true })
  }
}

module.exports = Compiler
