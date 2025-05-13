import { createLogger } from '@repo/logger'

import { OpenAIClient } from '../clients/openai/index.js'
import type { ClientInterface, Model, Provider } from './types.js'

const logger = createLogger('core:resolver')

/**
 * Simple resolver that maps a SupportedModel name
 * to its corresponding ClientInterface implementation.
 */
export class Resolver {
  private static readonly clientsMap: Record<string, ClientInterface> = {
    'openai.gpt-3.5-turbo': new OpenAIClient({
      model: 'gpt-3.5-turbo',
    }),
    'openai.gpt-4o': new OpenAIClient({
      model: 'gpt-4o',
    }),
    'openai.gpt-4o-mini': new OpenAIClient({
      model: 'gpt-4o-mini',
    }),
    'deepseek.deepseek-chat': new OpenAIClient({
      model: 'deepseek-chat',
      configuration: {
        baseURL: process.env.DEEPSEEK_API_URL,
        apiKey: process.env.DEEPSEEK_API_KEY,
      },
    }),
    'deepseek.deepseek-reasoner': new OpenAIClient({
      model: 'deepseek-reasoner',
      configuration: {
        baseURL: process.env.DEEPSEEK_API_URL,
        apiKey: process.env.DEEPSEEK_API_KEY,
      },
    }),
  }

  /**
   * Resolves and returns a client for the given model name.
   * @throws If the clientName is not found in `clientsMap`.
   */
  static resolveClient(provider: Provider, model: Model): ClientInterface {
    const key = `${provider}.${model}`
    const client = this.clientsMap[key]

    if (!client) {
      throw new Error(`Client not found for model "${provider}.${model}"`)
    }

    logger.info(`Resolved client for model "${provider}.${model}"`)
    return client
  }
}
