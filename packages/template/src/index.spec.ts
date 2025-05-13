import { describe, expect, it } from 'vitest'

import * as index from './index.js'

describe('unit tests for index', () => {
  it('should have 2 functions', () => {
    expect(Object.keys(index)).toHaveLength(2)
  })

  it('should return bar', () => {
    expect(index.bar()).toBe('bar')
  })

  it('should return foo', () => {
    expect(index.foo()).toBe('foo')
  })
})
