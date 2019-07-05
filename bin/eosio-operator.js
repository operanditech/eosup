#!/usr/bin/env node

const Docker = require('dockerode')
const execa = require('execa')
const version = require('../package.json').version
const Compiler = require('../lib/compiler')
const { DockerTestnet } = require('../lib/operator')
const imageTag = require('../lib/imageTag')

const prog = require('caporal')
prog
  .version(version)
  .command(
    'install',
    'Build the Docker image. Will be tagged to the current version of this program.'
  )
  .action(
    wrapAsync(async (args, options, logger) => {
      const compiler = new Compiler({
        printOutput: true
      })
      await compiler.setup()
    })
  )
  .command(
    'uninstall',
    'Remove the Docker image tagged to the current version of this program.'
  )
  .action(
    wrapAsync(async (args, options, logger) => {
      const docker = new Docker()
      await docker.getImage(imageTag).remove()
    })
  )
  .command('compile', 'Compile a smart contract')
  .argument('<input>', 'File with the source code to compile.')
  .argument(
    '<output>',
    'Output file where the compiled WASM should be written.'
  )
  .option('-c, --contract <name>', 'Contract name, for ABI generation.')
  .option(
    '-e, --extra-params <params>',
    'String with additional command parameters to forward to eosio-cpp.'
  )
  .action(
    wrapAsync(async (args, opts, logger) => {
      const compiler = new Compiler({
        printOutput: true
      })
      await compiler.setup()
      await compiler.compile(args.input, args.output, opts.contract, {
        extraParams: opts.extraParams
      })
    })
  )
  .command('testnet', 'Run a local eosio testnet for development.')
  .option(
    '-e, --extra-params <params>',
    'String with additional command parameters to forward to nodeos.'
  )
  .option(
    '-c, --callback <command>',
    'Command to run as soon as the testnet is operational (e.g. for loading seed data).'
  )
  .action(
    wrapAsync(async (args, opts, logger) => {
      const testnet = new DockerTestnet({
        printOutput: true,
        extraParams: opts.extraParams
      })
      await testnet.setup()
      testnet.loadExitHandler()
      await testnet.start()
      if (opts.callback) {
        try {
          await execa.command(opts.callback, { stdio: 'inherit', shell: true })
        } catch (error) {
          await testnet.stop()
          throw error
        }
      }
    })
  )

prog.parse(process.argv)

function wrapAsync(func) {
  return (...args) => {
    func(...args).catch(error => {
      console.error(error)
      process.exit(1)
    })
  }
}
