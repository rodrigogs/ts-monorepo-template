import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Cache } from './cache.js'
import type { CacheAdapter } from './cache-adapter.js'

describe('Cache', () => {
  // Create mock adapter for testing
  let mockAdapter: CacheAdapter

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks()

    // Create fresh mock adapter for each test
    mockAdapter = {
      set: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue('test-value'),
      delete: vi.fn().mockResolvedValue(true),
      flush: vi.fn().mockResolvedValue(undefined),
      keys: vi.fn().mockImplementation((pattern: string) => {
        if (pattern === 'exists') {
          return Promise.resolve(['exists'])
        }
        return Promise.resolve([])
      }),
    }
  })

  it('should create an instance with the provided adapter', () => {
    const cache = new Cache(mockAdapter)
    expect(cache).toBeInstanceOf(Cache)
  })

  it('should call adapter.set when set is called', async () => {
    const cache = new Cache(mockAdapter)
    await cache.set('test-key', 'test-value', 1000)

    expect(mockAdapter.set).toHaveBeenCalledTimes(1)
    expect(mockAdapter.set).toHaveBeenCalledWith('test-key', 'test-value', 1000)
  })

  it('should call adapter.get when get is called', async () => {
    const cache = new Cache(mockAdapter)
    const result = await cache.get('test-key')

    expect(mockAdapter.get).toHaveBeenCalledTimes(1)
    expect(mockAdapter.get).toHaveBeenCalledWith('test-key')
    expect(result).toEqual('test-value')
  })

  it('should call adapter.delete when delete is called', async () => {
    const cache = new Cache(mockAdapter)
    const result = await cache.delete('test-key')

    expect(mockAdapter.delete).toHaveBeenCalledTimes(1)
    expect(mockAdapter.delete).toHaveBeenCalledWith('test-key')
    expect(result).toBe(true)
  })

  it('should call adapter.flush when flush is called', async () => {
    const cache = new Cache(mockAdapter)
    await cache.flush()

    expect(mockAdapter.flush).toHaveBeenCalledTimes(1)
  })

  it('should call adapter.keys when keys is called', async () => {
    const cache = new Cache(mockAdapter)
    const result = await cache.keys('test-pattern')

    expect(mockAdapter.keys).toHaveBeenCalledTimes(1)
    expect(mockAdapter.keys).toHaveBeenCalledWith('test-pattern')
    expect(result).toEqual([])
  })

  it('should return true from has when key exists', async () => {
    const cache = new Cache(mockAdapter)
    const result = await cache.has('exists')

    expect(mockAdapter.keys).toHaveBeenCalledTimes(1)
    expect(mockAdapter.keys).toHaveBeenCalledWith('exists')
    expect(result).toBe(true)
  })

  it('should return false from has when key does not exist', async () => {
    const cache = new Cache(mockAdapter)
    const result = await cache.has('non-existent')

    expect(mockAdapter.keys).toHaveBeenCalledTimes(1)
    expect(mockAdapter.keys).toHaveBeenCalledWith('non-existent')
    expect(result).toBe(false)
  })
})
