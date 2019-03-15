const Docker = require('dockerode')
const path = require('path')

const image = 'eostudio/eosio.cdt:v1.5.0'

class Compiler {
  constructor() {
    this.docker = new Docker()
  }
  async setup() {
    console.log('Preparing docker image...')
    const stream = await this.docker.pull(image)
    await new Promise((resolve, reject) => {
      this.docker.modem.followProgress(stream, (error, result) =>
        error ? reject(error) : resolve(result)
      )
    })
    console.log('Docker image ready')
  }
  async compile(contract, input, output) {
    const abiOutput = path
      .format({
        ...path.parse(output),
        ext: '.abi',
        base: undefined
      })
      .replace('\\', '/')
    await this.docker.run(
      image,
      [
        'bash',
        '-c',
        `eosio-cpp /mnt/dev/contract/${input} -c -o /tmp/contract.out && \
        eosio-ld /tmp/contract.out -o /mnt/dev/contract/${output} && \
        eosio-abigen /mnt/dev/contract/${input} -contract ${contract} -output /mnt/dev/contract/${abiOutput}`
      ],
      process.stdout,
      {
        NetworkDisabled: true,
        HostConfig: {
          Binds: [`${process.cwd()}:/mnt/dev/contract`]
        }
      }
    )
  }
}
module.exports = Compiler
