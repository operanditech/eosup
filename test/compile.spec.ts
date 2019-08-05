import fs from 'fs'
import { describe, it } from 'mocha'
import Compiler from '../src/compiler'

describe('Compiler', () => {
  it('should compile', async () => {
    try {
      fs.unlinkSync('test/contract.wasm')
      fs.unlinkSync('test/contract.abi')
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e
      }
    }
    const compiler = new Compiler()
    await compiler.setup()
    await compiler.compile('test/contract.cpp', 'test/contract.wasm', 'hello')
  })
})
