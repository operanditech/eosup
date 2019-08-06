import fs from 'fs'
import path from 'path'

const { name, version } = JSON.parse((fs.readFileSync(
  path.resolve(__dirname, '../package.json')
) as any) as string)

export = `${name}:${version}`
