const Docker = require('dockerode')

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
    if (this.printOutput) {
      console.log('Docker image ready')
    }
  }
  async compile(contract, input, output) {
    await this.docker.run(
      image,
      [
        'eosio-cpp',
        '-abigen',
        `-contract=${contract}`,
        `/mnt/dev/contract/${input}`,
        '-o',
        `/mnt/dev/contract/${output}`
      ],
      process.stdout,
      {
        NetworkDisabled: true,
        HostConfig: {
          Binds: [`${process.cwd()}:/mnt/dev/contract`]
        }
      }
    )
    // await run(
    //   `docker run --rm \
    //   --mount type=bind,src="$(pwd)",dst=/mnt/dev/contract \
    //   -w "/opt/eosio/bin/" eosio/eos-dev:v1.3.0 \
    //   eosiocpp -o /mnt/dev/contract/${output} /mnt/dev/contract/${input}`
    // )
  }
}
module.exports = Compiler
