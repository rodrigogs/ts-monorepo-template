import { AIMessage } from '@langchain/core/messages'
import { createLogger } from '@repo/logger'
import type { ZodSchema } from 'zod'

import type { StateType, WorkflowNode } from '../types.js'

const logger = createLogger('workflows:nodes:parse')

/**
 * Creates a node for parsing and validating the model output based on a schema
 *
 * This node extracts the content from the last AIMessage in the messages array,
 * handles JSON extraction (including from markdown code blocks),
 * parses the JSON data, and validates it against the provided schema.
 * It produces the final validated result object.
 *
 * @param schema Zod schema to validate the model output
 * @returns A workflow node that parses and validates output
 */
export function createParseNode<Schema extends ZodSchema>(
  schema: Schema,
): WorkflowNode {
  return async (state: StateType): Promise<Partial<StateType>> => {
    // Get content from the last AIMessage in the messages array
    const lastMessage = state.messages[state.messages.length - 1]

    if (!(lastMessage instanceof AIMessage)) {
      logger.error('Last message is not an AIMessage', { lastMessage })
      throw new Error(
        'Expected the last message to be an AIMessage for parsing',
      )
    }

    const messageContent =
      typeof lastMessage.content === 'string'
        ? lastMessage.content
        : JSON.stringify(lastMessage.content)

    let jsonData: unknown

    // Process markdown code blocks if present
    const codeBlockMatch = /```(?:json)?\s*([\s\S]*?)\s*```/gm.exec(
      messageContent,
    )
    let processedOutput = messageContent

    if (codeBlockMatch && codeBlockMatch[1]) {
      processedOutput = codeBlockMatch[1].trim()
      logger.debug('Extracted JSON from code block', {
        original: messageContent,
        extracted: processedOutput,
      })
    }

    try {
      // Try to parse the JSON output from the LLM
      jsonData = JSON.parse(processedOutput)
    } catch (error) {
      logger.error('Error parsing JSON output', {
        output: messageContent,
        cleanedOutput: processedOutput,
        error,
      })
      throw new Error(
        `Failed to parse JSON output from agent: ${error instanceof Error ? error.message : String(error)}`,
      )
    }

    try {
      // Validate the parsed JSON with the schema
      const parsed = schema.parse(jsonData)
      logger.debug('Parsed result', { parsed })
      return { result: parsed }
    } catch (validationError) {
      logger.error('Schema validation error', {
        schema: schema.toString(),
        data: jsonData,
        error: validationError,
      })
      throw new Error(
        `Output validation failed: ${validationError instanceof Error ? validationError.message : String(validationError)}`,
      )
    }
  }
}
