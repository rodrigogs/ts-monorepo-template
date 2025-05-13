import type { BaseLanguageModelInput } from '@langchain/core/language_models/base'
import type {
  BaseChatModel,
  BaseChatModelCallOptions,
} from '@langchain/core/language_models/chat_models'
import type { AIMessageChunk, MessageContent } from '@langchain/core/messages'
import { AIMessage } from '@langchain/core/messages'
import type { Runnable } from '@langchain/core/runnables'
import { createLogger } from '@repo/logger'

import type { StateType, WorkflowNode } from '../types'

const logger = createLogger('workflows:nodes:llm')

/**
 * Creates a node for calling the language model in the workflow
 *
 * This node takes the current messages (which may include the formatted prompt and tool outputs)
 * and sends it to the language model, capturing the response for further processing.
 *
 * @param model The language model to be used in the workflow
 * @returns A workflow node that calls the language model
 */
export function createLLMNode(
  model:
    | BaseChatModel<BaseChatModelCallOptions, AIMessageChunk>
    | Runnable<BaseLanguageModelInput, AIMessageChunk, BaseChatModelCallOptions>
    | undefined,
): WorkflowNode {
  if (!model) {
    throw new Error('Model is not defined')
  }

  return async (state: StateType): Promise<Partial<StateType>> => {
    const response = await model.invoke(state.messages)

    // Handle the LLM response
    let messageContent: MessageContent = ''

    if (typeof response === 'string') {
      messageContent = response
    } else if (response instanceof AIMessage) {
      // If it's already an AIMessage, we'll return it directly later
      messageContent = response.content
    } else if (response.content !== undefined) {
      if (typeof response.content === 'string') {
        // Check if the content is a JSON string that needs parsing
        try {
          const parsedContent = JSON.parse(response.content)
          messageContent = parsedContent
        } catch {
          // If parsing fails, use the string as is
          messageContent = response.content
        }
      } else {
        // Already an object, use as is
        messageContent = response.content
      }
    }

    logger.debug('LLM output received', {
      outputType: typeof response,
      output: response instanceof Object ? JSON.stringify(response) : response,
      outputContent:
        typeof messageContent === 'object'
          ? JSON.stringify(messageContent)
          : messageContent,
    })

    // Create a new AI message with the response content and any tool calls
    const aiMessage =
      response instanceof AIMessage
        ? response
        : new AIMessage({ content: messageContent })

    // Return updated messages array with the new AI message appended
    return {
      messages: [...state.messages, aiMessage],
    }
  }
}
