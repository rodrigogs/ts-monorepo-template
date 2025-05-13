import { AIAgent } from './core/agent.js'
import { AI } from './core/ai.js'
import * as tools from './tools/index.js'

// Export all types from types.js
export * from './core/types.js'
// Export agent types
export * from './core/agent.js'

/**
 * A default AI instance you can import directly.
 */
const ai = new AI()

export { AI, ai, AIAgent, tools }
