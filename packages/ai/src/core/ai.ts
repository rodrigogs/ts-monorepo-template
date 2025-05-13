import { createLogger } from '@repo/logger'
import type { ZodTypeAny } from 'zod'

import { AIAgent } from './agent.js'
import { Resolver } from './resolver.js'
import type { AIAgentOptions, ClientOptions, Model, Provider } from './types.js'

const logger = createLogger('core:ai')

export class AI {
  /**
   * Get a model client for the given provider and model.
   * If no options are provided, it will use the default provider and model.
   * If no provider or model is specified, it will throw an error.
   */
  getClient(options: ClientOptions = {}) {
    const provider = (options.provider ??
      process.env.DEFAULT_PROVIDER) as Provider
    const model = (options.model ?? process.env.DEFAULT_MODEL) as Model
    if (!provider || !model) {
      throw new Error('No provider or model specified')
    }

    return Resolver.resolveClient(provider, model)
  }

  /**
   * Creates an agent that uses a StateGraph for multi-turn tool usage.
   * It loops over the provided tools until there are no more tool calls or a structured
   * response is received via the special 'response' function call.
   */
  createAgent<T extends ZodTypeAny>(options: AIAgentOptions<T>) {
    logger.debug('Creating new agent', options.name)

    const client = this.getClient(options)

    return new AIAgent({ ...options, client })
  }
}
