import type { BaseMessage } from '@langchain/core/messages'
import { AIMessage } from '@langchain/core/messages'
import {
  Annotation,
  END,
  messagesStateReducer,
  START,
  StateGraph,
} from '@langchain/langgraph'
import { createLogger } from '@repo/logger'
import type { ZodSchema } from 'zod'

import type { ClientInterface } from '../types.js'
import {
  createLLMNode,
  createParseNode,
  createToolsNode,
} from './nodes/index.js'
import type {
  AgentWorkflowOptions,
  RunWorkflowOptions,
  StateType,
} from './types.js'

const logger = createLogger('workflows:agent-workflow')

export const START_NODE = START
export const END_NODE = END
export const LLM_NODE = '__llm__'
export const LLM_WITH_TOOLS_NODE = '__llm_with_tools__'
export const TOOLS_NODE = '__tools__'
export const PARSE_NODE = '__parse__'

// Helper function to determine the next step based on the LLM response
export const shouldContinue = (
  state: StateType,
): typeof PARSE_NODE | typeof TOOLS_NODE => {
  const lastMessage = state.messages[state.messages.length - 1]

  // Verificação mais eficiente para evitar chamadas desnecessárias
  if (!lastMessage || !(lastMessage instanceof AIMessage)) {
    logger.debug('No AI message found, proceeding to parse.')
    return PARSE_NODE
  }

  // Verifica se existem chamadas de ferramentas válidas
  const hasValidToolCalls =
    lastMessage.tool_calls &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0 &&
    lastMessage.tool_calls.some(
      (call) =>
        call && typeof call.name === 'string' && call.name.trim() !== '',
    )

  if (hasValidToolCalls) {
    logger.debug('Valid tool calls found, proceeding to tools node.')
    return TOOLS_NODE
  }

  logger.debug('No valid tool calls found, proceeding to parse.')
  return PARSE_NODE
}

/**
 * Class that implements the AI agent workflow
 *
 * This class orchestrates the flow of data through workflow nodes, from prompt preparation
 * through tool execution, LLM invocation, and result parsing. It provides retry capabilities
 * for increased robustness.
 */
export class AgentWorkflow<Schema extends ZodSchema> {
  private graph!: StateGraph<ReturnType<typeof Annotation.Root>>
  private compiledGraph!: ReturnType<typeof StateGraph.prototype.compile>

  /**
   * Creates a new instance of the agent workflow
   *
   * @param client Client interface to access the language model
   * @param formatPromptFn Function that formats the prompt
   * @param options Workflow configuration options
   */
  constructor(
    private client: ClientInterface,
    private formatPromptFn: (
      input: BaseMessage,
      messages: BaseMessage[],
    ) => BaseMessage[],
    private options: AgentWorkflowOptions<Schema>,
  ) {
    this.initializeWorkflow()
  }

  /**
   * Initializes the workflow with all necessary nodes
   *
   * This method sets up the state graph, nodes, and edges for the workflow.
   * It uses LangGraph to create a directed graph of processing steps.
   *
   * @throws Error if workflow initialization fails
   */
  private initializeWorkflow(): void {
    try {
      const agentState = Annotation.Root({
        userInput: Annotation<BaseMessage>(),
        messages: Annotation<BaseMessage[]>({
          reducer: messagesStateReducer,
          default: () => [],
        }),
        result: Annotation<Schema['_output']>(),
      })

      this.graph = new StateGraph(agentState)

      this.addWorkflowNodes()
      this.connectWorkflowEdges()
      this.compiledGraph = this.graph.compile()

      // this.compiledGraph.getGraphAsync().then(async (graph) => {
      //   const image = await graph.drawMermaidPng()
      //   const arrayBuffer = await image.arrayBuffer()

      //   await import('tslab').then((tslab) =>
      //     tslab.display.png(new Uint8Array(arrayBuffer)),
      //   )
      // })

      logger.debug('Agent workflow initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize agent workflow', error)
      throw new Error(
        `Failed to initialize agent workflow: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  private getLlmModel() {
    return this.client.useModel()
  }

  private addWorkflowNodes(): void {
    try {
      const llmModel = this.getLlmModel()
      const llmMoldeWithTools = this.client
        .useModel()
        .bindTools?.(this.options.tools)
      this.graph.addNode(LLM_WITH_TOOLS_NODE, createLLMNode(llmMoldeWithTools))
      this.graph.addNode(TOOLS_NODE, createToolsNode(this.options.tools))
      this.graph.addNode(LLM_NODE, createLLMNode(llmModel))
      this.graph.addNode(
        PARSE_NODE,
        createParseNode(this.options.responseFormat),
      )

      logger.debug('Workflow nodes added', {
        nodes: [
          `${LLM_NODE} (LLM)`,
          `${LLM_WITH_TOOLS_NODE} (LLM with tools)`,
          `${TOOLS_NODE} (Tools)`,
          `${PARSE_NODE} (Parse)`,
        ],
      })
      logger.debug('All workflow nodes have been successfully added.')
    } catch (error) {
      logger.error('Failed to add workflow nodes', error)
      throw new Error(
        `Error adding workflow nodes: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  private connectWorkflowEdges(): void {
    try {
      // Use unknown instead of any for safer type casting
      // This is necessary because LangGraph's typing is often too strict
      // for practical usage patterns
      const graph = this.graph as unknown as {
        addEdge: (from: string, to: string) => void
        addConditionalEdges: (
          from: string,
          condition: (state: StateType) => string,
          routes: Record<string, string>,
        ) => void
      }

      /**
       * Connects the nodes in the workflow graph
       *
       * START_NODE → LLM_NODE
       * LLM_WITH_TOOLS_NODE → TOOLS_NODE (conditional)
       * LLM_WITH_TOOLS_NODE → PARSE_NODE (conditional)
       * TOOLS_NODE → LLM_NODE
       * LLM_NODE → PARSE_NODE
       * PARSE_NODE → END_NODE
       */
      graph.addEdge(START_NODE, LLM_WITH_TOOLS_NODE)
      graph.addConditionalEdges(LLM_WITH_TOOLS_NODE, shouldContinue, {
        [TOOLS_NODE]: TOOLS_NODE,
        [PARSE_NODE]: PARSE_NODE,
      })
      graph.addEdge(TOOLS_NODE, LLM_NODE)
      graph.addEdge(LLM_NODE, PARSE_NODE)
      graph.addEdge(PARSE_NODE, END_NODE)

      logger.debug('Workflow edges connected', {
        edges: [
          `${START_NODE} → ${LLM_NODE}`,
          `${LLM_WITH_TOOLS_NODE} → ${TOOLS_NODE} (conditional)`,
          `${LLM_WITH_TOOLS_NODE} → ${PARSE_NODE} (conditional)`,
          `${TOOLS_NODE} → ${LLM_NODE}`,
          `${LLM_NODE} → ${PARSE_NODE}`,
          `${PARSE_NODE} → ${END_NODE}`,
        ],
      })
    } catch (error) {
      logger.error('Failed to connect workflow edges', error)
      throw new Error(
        `Error connecting workflow edges: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Executes the workflow with the provided options
   *
   * @param options Execution options including initial state and config
   * @returns The final result validated by the schema
   * @throws Error if workflow execution fails
   */
  async run(options: RunWorkflowOptions): Promise<Schema['_output']> {
    try {
      const finalState = await this.compiledGraph.invoke(
        options.initialState,
        options.config,
      )

      if (!finalState || !finalState.result) {
        throw new Error('Workflow completed but no result was produced')
      }

      return finalState.result
    } catch (error) {
      logger.error('Error executing workflow', error)
      throw error
    }
  }

  /**
   * Executes the workflow with multiple retry attempts in case of failure
   *
   * This implements an exponential backoff retry strategy for increased robustness.
   *
   * @param options Execution options including initial state and config
   * @param maxRetries Maximum number of retries (default: 3)
   * @param baseDelay Base delay between retries in ms (default: 1000)
   * @returns The final result validated by the schema
   * @throws Error if all retry attempts fail
   */
  async runWithRetries(
    options: RunWorkflowOptions,
    maxRetries = 3,
    baseDelay = 1000,
  ): Promise<Schema['_output']> {
    let lastError: Error | null = null

    // Initial attempt (0) + retries (maxRetries)
    for (let attempt = 0; attempt < maxRetries + 1; attempt++) {
      try {
        logger.debug(`Attempt ${attempt + 1} to invoke workflow`)
        return await this.run(options)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        logger.error(`Error on attempt ${attempt + 1}:`, error)

        if (attempt < maxRetries) {
          const delay = baseDelay * 2 ** attempt
          logger.debug(`Retrying in ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    logger.error('All retry attempts failed.')
    throw (
      lastError ||
      new Error(
        'Unexpected error: All retry attempts failed without specific error.',
      )
    )
  }
}
