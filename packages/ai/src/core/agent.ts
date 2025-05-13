import type { BaseMessage, HumanMessage } from '@langchain/core/messages'
import { SystemMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { StructuredTool } from '@langchain/core/tools'
import { createLogger } from '@repo/logger'
import { StructuredOutputParser } from 'langchain/output_parsers'
import type { ZodSchema } from 'zod'

import { ai } from '../index.js'
import type { AIAgentOptions, ClientInterface } from './types.js'
import { AgentWorkflow } from './workflows/agent-workflow.js'
import type { StateType } from './workflows/types.js'

// Default values for retry logic
const DEFAULT_MAX_RETRIES = 3
const DEFAULT_BASE_DELAY = 1000

const logger = createLogger('core:agent')

export class AIAgent<Schema extends ZodSchema> {
  private name: string
  private client: ClientInterface
  private responseFormat: Schema
  private systemInstructions: SystemMessage[]
  private maxRetries: number
  private baseDelay: number
  private tools: StructuredTool[]

  // Propriedade que utiliza a nova arquitetura modular para o workflow do agente
  private agentWorkflow: AgentWorkflow<Schema>

  constructor(options: AIAgentOptions<Schema>) {
    this.name = options.name
    this.client = options.client ?? ai.getClient(options)
    this.responseFormat = options.responseFormat
    this.systemInstructions = options.systemInstructions ?? []
    this.tools = options.tools ?? []
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
    this.baseDelay = options.baseDelay ?? DEFAULT_BASE_DELAY

    logger.debug('Creating new agent', { name: this.name })

    this.agentWorkflow = new AgentWorkflow(
      this.client,
      this.formatPrompt.bind(this),
      {
        responseFormat: this.responseFormat,
        tools: this.tools,
      },
    )
  }

  /**
   * Creates an array of BaseMessage for the prompt. It combines:
   * - The system instructions (first, before anything else)
   * - An optional tools message with usage guidelines
   * - The context messages including session information
   * - A system message with format instructions and examples
   * - The user input as a HumanMessage
   *
   * @param input The user's input string.
   * @param context An array of BaseMessage representing the current context.
   * @returns An array of BaseMessage.
   */
  private formatPrompt(
    input: HumanMessage,
    context: BaseMessage[],
  ): BaseMessage[] {
    // Format tools section with clearer usage instructions
    let toolsSection = ''
    if (this.tools.length > 0) {
      const toolDescriptions = this.tools
        .map((t) => `- **${t.name}**: ${t.description}`)
        .join('\n')

      toolsSection =
        '=== TOOLS ===\n' +
        `Available tools:\n${toolDescriptions}\n\n` +
        'Tool Usage Guidelines:\n' +
        '- Only use tools when necessary and when you have all required information\n' +
        '- Collect all required information before using tools\n' +
        '- Do not use the same tool repeatedly without new information'
    }

    // Create format instructions with clear schema and example
    const outputParser = StructuredOutputParser.fromZodSchema(
      this.responseFormat,
    )

    const formatInstructions =
      '=== OUTPUT FORMAT ===\n' +
      'Your response must be provided in the following JSON format:\n' +
      `${outputParser.getFormatInstructions()}\n\n` +
      'Example response format:\n' +
      '{\n' +
      '  "name": "Assistant",\n' +
      '  "text": "Here is my response to your query",\n' +
      '  "finished": false\n' +
      '}'

    // Combine all instructions into a single comprehensive system message
    const systemInstructionsContent = [
      '=== SYSTEM INSTRUCTIONS ===',
      ...this.systemInstructions.map((msg) => msg.content),
      toolsSection,
      formatInstructions,
    ]
      .filter(Boolean)
      .join('\n\n')

    // Build the optimized message array
    const messages: BaseMessage[] = [
      // Consolidated system instructions
      new SystemMessage(systemInstructionsContent),

      // Context section with conversation history
      ...context,

      // Current user input
      input,
    ]

    return messages
  }

  /**
   * Executes the agent with the provided input. The workflow processes the state through
   * bypassing the prepare-node and directly formatting the messages.
   *
   * @param input The user's input string.
   * @param context An optional array of BaseMessage representing the current context.
   * @param config Optional configuration for the runnable.
   * @returns The structured final output validated against the Zod schema.
   */
  async run(
    input: BaseMessage,
    context?: BaseMessage[],
    config?: RunnableConfig,
  ): Promise<Schema['_output']> {
    logger.debug('Running agent with input', {
      input,
      context: context?.length,
    })

    // Directly format messages instead of using prepare-node
    const formattedMessages = this.formatPrompt(
      input as HumanMessage,
      context || [],
    )

    // Create initial state with the formatted messages
    const initialState: StateType = {
      userInput: input,
      messages: formattedMessages,
    }

    // Use the modified workflow that bypasses prepare-node
    return this.agentWorkflow.runWithRetries(
      { initialState, config },
      this.maxRetries,
      this.baseDelay,
    )
  }
}
