import fs from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { checkFileExists } from './check-file-exists.js'

// Mock the fs module
vi.mock('node:fs', () => ({
  default: {
    promises: {
      access: vi.fn(),
    },
  },
}))

describe('checkFileExists', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return true when file exists', async () => {
    // Mock successful access
    vi.mocked(fs.promises.access).mockResolvedValueOnce(undefined)

    const result = await checkFileExists('/path/to/existing/file')

    expect(fs.promises.access).toHaveBeenCalledWith('/path/to/existing/file')
    expect(result).toBe(true)
  })

  it('should return false when file does not exist', async () => {
    // Mock failed access
    vi.mocked(fs.promises.access).mockRejectedValueOnce(
      new Error('File not found'),
    )

    const result = await checkFileExists('/path/to/non-existing/file')

    expect(fs.promises.access).toHaveBeenCalledWith(
      '/path/to/non-existing/file',
    )
    expect(result).toBe(false)
  })
})
