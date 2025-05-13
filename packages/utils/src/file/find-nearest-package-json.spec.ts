import { packageUpSync } from 'package-up'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findNearestPackageJson } from './find-nearest-package-json.js'

// Mock package-up
vi.mock('package-up', () => ({
  packageUpSync: vi.fn(),
}))

describe('findNearestPackageJson', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return package.json path when found', () => {
    const expectedPath = '/path/to/package.json'
    vi.mocked(packageUpSync).mockReturnValueOnce(expectedPath)

    const result = findNearestPackageJson('/path/to/dir')

    expect(packageUpSync).toHaveBeenCalledWith({ cwd: '/path/to/dir' })
    expect(result).toBe(expectedPath)
  })

  it('should return null when package.json is not found', () => {
    vi.mocked(packageUpSync).mockReturnValueOnce(undefined)

    const result = findNearestPackageJson('/path/to/dir')

    expect(packageUpSync).toHaveBeenCalledWith({ cwd: '/path/to/dir' })
    expect(result).toBeNull()
  })
})
