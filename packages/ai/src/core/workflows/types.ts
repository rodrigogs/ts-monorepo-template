import type { BaseMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { StructuredTool } from '@langchain/core/tools'
import type { ZodSchema } from 'zod'

/**
 * Represents the state of the AI agent workflow
 * Contains the input, messages, intermediate output, and final result
 */
export interface StateType<TResult = unknown> {
  userInput: BaseMessage
  // Replace 'context' with 'messages' to align with messagesStateReducer
  messages: BaseMessage[]
  // 'output' might be redundant if parsing from the last message
  // output?: string
  result?: TResult
}

/**
 * Type definition for a workflow node function that processes the state
 * Each node takes the current state and returns a partial state that will be merged
 */
export type WorkflowNode = (
  state: StateType<unknown>,
) => Promise<Partial<StateType<unknown>>>

/**
 * Options for creating an agent workflow
 */
export interface AgentWorkflowOptions<Schema extends ZodSchema> {
  responseFormat: Schema
  tools: StructuredTool[]
}

/**
 * Options for executing a workflow
 */
export interface RunWorkflowOptions {
  initialState: StateType<unknown>
  config?: RunnableConfig
}
