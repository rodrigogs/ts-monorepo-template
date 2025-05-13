import { FileUtils } from '@repo/utils'
import debug from 'debug'
import fs from 'fs'

const getCallerDir = () => {
  const originalFunc = Error.prepareStackTrace
  let callerfile
  try {
    const err = new Error()
    Error.prepareStackTrace = (_, stack) => stack
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stack = err.stack as unknown as any[]
    const currentfile = stack.shift().getFileName()
    while (stack.length) {
      callerfile = stack.shift().getFileName()
      if (currentfile !== callerfile) break
    }
  } catch (e) {
    console.error(e)
  }
  Error.prepareStackTrace = originalFunc
  return callerfile
}

export type LogLevel = 'info' | 'error' | 'warn' | 'debug'

export const createLogger = (namespace: string) => {
  const currentDir = getCallerDir()
  const pkgPath = FileUtils.findNearestPackageJson(currentDir)
  if (!pkgPath) {
    throw new Error('Package path not found')
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  const pkgName = pkg.name.startsWith('@')
    ? pkg.name.split('/').pop()
    : pkg.name
  const createNamespace = (type: LogLevel, namespace: string) =>
    `gtr:${type}:${pkgName}:${namespace}`

  return {
    info: debug(createNamespace('info', namespace)),
    error: debug(createNamespace('error', namespace)),
    warn: debug(createNamespace('warn', namespace)),
    debug: debug(createNamespace('debug', namespace)),
  }
}
