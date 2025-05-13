import { AIMessage, ToolMessage } from '@langchain/core/messages'
import type { StructuredTool } from '@langchain/core/tools'
import { createLogger } from '@repo/logger'

import type { StateType, WorkflowNode } from '../types.js'

const logger = createLogger('workflows:nodes:tools')

/**
 * Creates a node for executing tools in the workflow
 *
 * This node processes tool calls from the last AIMessage and adds
 * their output to the messages array as ToolMessages.
 *
 * @param tools Array of structured tools to execute
 * @returns A workflow node that executes requested tools
 */
export function createToolsNode(tools: StructuredTool[]): WorkflowNode {
  return async (state: StateType): Promise<Partial<StateType>> => {
    if (!tools || tools.length === 0) {
      logger.debug('No tools configured. Skipping tool execution.')
      return state
    }

    // Find the last AIMessage with tool calls
    const lastMessage = state.messages[state.messages.length - 1]
    if (
      !(lastMessage instanceof AIMessage) ||
      !lastMessage.tool_calls ||
      lastMessage.tool_calls.length === 0
    ) {
      logger.debug(
        'No tool calls found in the last message. Skipping tool execution.',
      )
      return state
    }

    const updatedMessages = [...state.messages]
    const toolsMap = new Map(tools.map((tool) => [tool.name, tool]))

    // Execute each tool call from the AIMessage
    for (const toolCall of lastMessage.tool_calls) {
      const { name, args, id } = toolCall
      const toolName = name || 'unknown-tool'
      const tool = toolsMap.get(toolName)

      if (!tool) {
        logger.warn(`Tool not found: ${toolName}`)
        // Add a tool message indicating the tool was not found
        updatedMessages.push(
          new ToolMessage({
            tool_call_id: id!,
            name: toolName,
            content: `Error: Tool '${toolName}' not found`,
          }),
        )
        continue
      }

      try {
        logger.debug(`Calling tool: ${toolName}`, args)
        const toolResult = await tool.invoke(args)
        logger.debug(`Tool result for ${toolName}:`, toolResult)

        // Add the tool result as a ToolMessage
        updatedMessages.push(
          new ToolMessage({
            tool_call_id: id!,
            name: toolName,
            content: toolResult,
          }),
        )
      } catch (error) {
        logger.error(`Error calling tool ${toolName}:`, error)
        // Add error message as tool result
        updatedMessages.push(
          new ToolMessage({
            tool_call_id: id!,
            name: toolName,
            content: `Error: ${error instanceof Error ? error.message : String(error)}`,
          }),
        )
      }
    }

    return { messages: updatedMessages }
  }
}
