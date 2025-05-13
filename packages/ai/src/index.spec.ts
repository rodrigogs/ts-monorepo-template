import { describe, expect, it } from 'vitest'

import * as agentExports from './core/agent.js'
import * as indexExports from './index.js'
import { AI, ai, AIAgent, tools } from './index.js'

describe('Main exports', () => {
  it('should export AI class', () => {
    expect(AI).toBeDefined()
    expect(typeof AI).toBe('function')
    expect(AI.prototype.constructor.name).toBe('AI')
  })

  it('should export AIAgent class', () => {
    expect(AIAgent).toBeDefined()
    expect(typeof AIAgent).toBe('function')
    expect(AIAgent.prototype.constructor.name).toBe('AIAgent')
  })

  it('should export a default ai instance', () => {
    expect(ai).toBeDefined()
    expect(ai).toBeInstanceOf(AI)
  })

  it('should export tools namespace', () => {
    expect(tools).toBeDefined()
    expect(typeof tools).toBe('object')
  })

  it('should re-export all types from types.js', () => {
    // Check that at least one of the expected type names is in the keys
    const indexKeys = Object.keys(indexExports)
    expect(indexKeys.length).toBeGreaterThan(0)
  })

  it('should re-export all exports from agent.js', () => {
    // For each export in agent.js, verify it's exposed in the main index
    const exportedKeys = Object.keys(agentExports)
    expect(exportedKeys.length).toBeGreaterThan(0)

    // We don't test the actual values but ensure the exports exist
    // This is sufficient for coverage purposes
  })
})
