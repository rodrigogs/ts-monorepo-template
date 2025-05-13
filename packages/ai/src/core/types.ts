import type {
  BaseChatModel,
  BaseChatModelCallOptions,
} from '@langchain/core/language_models/chat_models'
import type {
  AIMessage,
  AIMessageChunk,
  BaseMessage,
  FunctionMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages'
import type { StructuredTool } from '@langchain/core/tools'
import type { ChatOpenAI } from '@langchain/openai'
import type { ZodTypeAny } from 'zod'

export type PlainObject = Record<string | number | symbol, unknown>

export type AnyAIMessage =
  | SystemMessage
  | HumanMessage
  | AIMessage
  | ToolMessage
  | FunctionMessage

/**
 * The OpenAIClientOptions extends the ChatOpenAI constructor plus any
 * custom fields you might add in `ClientOptions`.
 */
export type OpenAIClientOptions = ConstructorParameters<typeof ChatOpenAI>[0] &
  ClientOptions

export type Provider = 'openai' | 'deepseek'
export type Model =
  | 'gpt-3.5-turbo'
  | 'gpt-4'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'deepseek-chat'
  | 'deepseek-reasoner'

/**
 * Generic client options, which can also include
 * model-specific settings or references to tools.
 */

export type ClientOptions = {
  provider?: Provider
  model?: Model
} & PlainObject

export type AIAgentOptions<Schema extends ZodTypeAny> = ClientOptions & {
  name: string
  client?: ClientInterface
  responseFormat: Schema
  systemInstructions?: SystemMessage[]
  context?: BaseMessage[]
  tools?: StructuredTool[]
  maxContextMessages?: number
  preserveSystemMessages?: boolean
  maxRetries?: number
  baseDelay?: number
}

/**
 * Represents a minimal interface for your AI client:
 */
export interface ClientInterface {
  /**
   * `useModel` creates a new ChatOpenAI instance with merged options.
   * This is useful for creating multiple agents with different settings.
   */
  useModel(
    options?: ClientOptions,
  ): BaseChatModel<BaseChatModelCallOptions, AIMessageChunk>
}
