import type { ChatOpenAICallOptions } from '@langchain/openai'
import { ChatOpenAI } from '@langchain/openai'
import { createLogger } from '@repo/logger'

import type { ClientInterface, OpenAIClientOptions } from '../../core/types.js'

const logger = createLogger('models:openai-client')

/**
 * A thin wrapper around the LangChain OpenAI client.
 * Handles configuration and error management for OpenAI-compatible APIs.
 */
export class OpenAIClient implements ClientInterface {
  private defaultOptions: OpenAIClientOptions

  constructor(defaultOptions: OpenAIClientOptions) {
    // Store a default config (model name, etc.)
    // Also read the API key from env if not provided
    this.defaultOptions = {
      ...defaultOptions,
      openAIApiKey: defaultOptions.apiKey ?? process.env.OPENAI_API_KEY,
    }

    logger.debug('OpenAI client initialized', {
      model: this.defaultOptions.model,
      provider: this.defaultOptions.provider,
      baseURL: this.defaultOptions.configuration?.baseURL ?? 'default',
    })
  }

  private resolveApiKey(options: OpenAIClientOptions): string {
    const apiKey =
      options.apiKey ??
      this.defaultOptions?.apiKey ??
      options.openAIApiKey ??
      this.defaultOptions?.openAIApiKey ??
      ''

    if (!apiKey) {
      const provider =
        options.provider || this.defaultOptions?.provider || 'openai'
      const envVarName =
        provider === 'openai'
          ? 'OPENAI_API_KEY'
          : `${provider.toUpperCase()}_API_KEY`
      logger.warn(
        `No API key provided for ${provider}, expected in options or ${envVarName} environment variable`,
      )
    }

    return apiKey
  }

  /**
   * Helper to build a new ChatOpenAI instance from merged options.
   * Adds error handling and detailed logging.
   */
  useModel(
    options: OpenAIClientOptions = {},
  ): ChatOpenAI<ChatOpenAICallOptions> {
    const model = options.model || this.defaultOptions.model
    logger.debug('Creating LLM client', {
      model,
      provider: options.provider || this.defaultOptions.provider,
    })

    const openAIApiKey = this.resolveApiKey(options)
    if (!openAIApiKey) {
      throw new Error(
        'No API key provided. Set the appropriate environment variable or provide it in options.',
      )
    }

    const opts = { ...this.defaultOptions, ...options }

    try {
      return new ChatOpenAI({
        ...this.defaultOptions,
        ...opts,
        openAIApiKey,
      })
    } catch (error) {
      logger.error('Error initializing model client', {
        model,
        error: error instanceof Error ? error.message : String(error),
      })
      throw new Error(
        `Failed to initialize model client: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
}
