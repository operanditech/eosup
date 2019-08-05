import Dockerator from 'dockerator'
import path from 'path'
import imageTag from './imageTag'

export default class Compiler extends Dockerator {
  public static async compile({
    printOutput,
    input,
    output,
    contract,
    extraParams
  }: {
    printOutput?: boolean
    input: string
    output: string
    contract?: string
    extraParams?: string
  }) {
    const compiler = new Compiler({ printOutput })
    await compiler.setup()
    await compiler.compile(input, output, contract, { extraParams })
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

  public async setup() {
    await super.setup({
      context: path.resolve(__dirname, '..', 'image'),
      src: ['Dockerfile']
    })
  }

  public async compile(
    input: string,
    output: string,
    contract?: string,
    { extraParams = '' } = {}
  ) {
    const parsedInput = path.parse(input)
    const parsedOutput = path.parse(output)
    this.dockerConfig.HostConfig.Binds = [
      `${path.join(process.cwd(), parsedInput.dir)}:/mnt/dev/input`,
      `${path.join(process.cwd(), parsedOutput.dir)}:/mnt/dev/output`
    ]
    const inputFile = path.posix.join('/mnt/dev/input', parsedInput.base)
    const outputFile = path.posix.join('/mnt/dev/output', parsedOutput.base)
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
