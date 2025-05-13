import { FileUtils } from '@repo/utils'
import fs from 'fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createLogger } from './index.js'

vi.mock('@repo/utils', () => ({
  FileUtils: {
    getFilename: vi.fn(),
    findNearestPackageJson: vi.fn(),
  },
}))

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof fs>('fs')
  return {
    ...actual,
    readFileSync: vi.fn(),
  }
})

describe('integration tests for logger', () => {
  const mockPackageJsonPath = '/path/to/package.json'
  const mockPackageJson = JSON.stringify({ name: '@repo/logger-test' })

  beforeEach(() => {
    vi.spyOn(FileUtils, 'getFilename').mockReturnValue('/fake/current/dir')
    vi.spyOn(FileUtils, 'findNearestPackageJson').mockReturnValue(
      mockPackageJsonPath,
    )
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockPackageJson)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return an object containing info, error, warn, debug', () => {
    const logger = createLogger('mynamespace')
    expect(logger).toHaveProperty('info')
    expect(logger).toHaveProperty('error')
    expect(logger).toHaveProperty('warn')
    expect(logger).toHaveProperty('debug')
    expect(Object.keys(logger).length).toBe(4)
  })

  it('should create debug namespaces with correct format', () => {
    const logger = createLogger('mynamespace')
    logger.info('test')
    expect(logger.info.namespace).toBe('gtr:info:logger-test:mynamespace')
  })

  it('should throw an error when packageJson is not found', () => {
    vi.spyOn(FileUtils, 'findNearestPackageJson').mockReturnValue(null)
    expect(() => createLogger('no-package')).toThrow('Package path not found')
  })
})
