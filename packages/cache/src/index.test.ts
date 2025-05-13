import { describe, expect, it } from 'vitest'

import { Cache, MemoryCacheAdapter } from './index.js'

describe('Integration Test - Cache with MemoryCacheAdapter', () => {
  it('should set and get a value', async () => {
    const cache = new Cache(new MemoryCacheAdapter())
    await cache.set('foo', 'bar')
    expect(await cache.get('foo')).toBe('bar')
  })

  it('should delete a value', async () => {
    const cache = new Cache(new MemoryCacheAdapter())
    await cache.set('foo', 'bar')
    expect(await cache.delete('foo')).toBe(true)
    expect(await cache.get('foo')).toBeUndefined()
  })

  it('should flush all values', async () => {
    const cache = new Cache(new MemoryCacheAdapter())
    await cache.set('key1', 'val1')
    await cache.set('key2', 'val2')
    await cache.flush()
    expect(await cache.get('key1')).toBeUndefined()
    expect(await cache.get('key2')).toBeUndefined()
  })
})
