import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { StateType } from '../types.js'
import { createLLMNode, createParseNode, createToolsNode } from './index.js'

describe('Workflow Nodes', () => {
  // Tests for tools node
  describe('ToolsNode', () => {
    it('should skip execution when no tools provided', async () => {
      const toolsNode = createToolsNode([])
      const state: StateType = {
        userInput: new HumanMessage('Test Input'),
        messages: [],
      }

      const result = await toolsNode(state)

      expect(result).toEqual(state)
    })

    it('should call tools and update messages', async () => {
      const mockTool = {
        name: 'MockTool',
        description: 'Mock tool description',
        invoke: vi.fn().mockResolvedValue('Tool Result'),
      } as any

      const toolsNode = createToolsNode([mockTool])

      // Create a state with an AIMessage that has tool calls
      const aiMessage = new AIMessage({
        content: 'I need to use a tool',
        tool_calls: [
          {
            name: 'MockTool',
            args: { input: 'test args' },
            id: 'test-id-123',
          },
        ],
      })

      const state: StateType = {
        userInput: new HumanMessage('Test Input'),
        messages: [aiMessage],
      }

      const result = await toolsNode(state)

      expect(mockTool.invoke).toHaveBeenCalledWith({ input: 'test args' })
      expect(result.messages).toHaveLength(2)
      // Check for ToolMessage instance instead of a string
      expect(result.messages?.[1]).toBeInstanceOf(ToolMessage)
      expect((result.messages?.[1] as ToolMessage).content).toBe('Tool Result')
      expect((result.messages?.[1] as ToolMessage).tool_call_id).toBe(
        'test-id-123',
      )
    })

    it('should handle errors during tool execution', async () => {
      const mockTool = {
        name: 'ErrorTool',
        description: 'Tool that throws error',
        invoke: vi.fn().mockRejectedValue(new Error('Tool Error')),
      } as any

      const toolsNode = createToolsNode([mockTool])

      // Create a state with an AIMessage that has tool calls
      const aiMessage = new AIMessage({
        content: 'I need to use a tool',
        tool_calls: [
          {
            name: 'ErrorTool',
            args: { input: 'test args' },
            id: 'error-id-123',
          },
        ],
      })

      const state: StateType = {
        userInput: new HumanMessage('Test Input'),
        messages: [aiMessage],
      }

      // Should not throw error, should handle internally
      const result = await toolsNode(state)

      expect(mockTool.invoke).toHaveBeenCalledWith({ input: 'test args' })
      expect(result.messages).toHaveLength(2)
      expect(result.messages?.[1].content).toContain('Error: Tool Error')
      expect((result.messages?.[1] as ToolMessage).name).toBe('ErrorTool')
      expect((result.messages?.[1] as ToolMessage).tool_call_id).toBe(
        'error-id-123',
      )
    })

    it('should skip execution when last message is not an AIMessage or has no tool calls', async () => {
      const mockTool = {
        name: 'AnyTool',
        description: '',
        invoke: vi.fn(),
      } as any
      const toolsNode = createToolsNode([mockTool])
      // state with a HumanMessage instead of AIMessage
      const state1 = { userInput: 'x', messages: [new HumanMessage('hi')] }
      // @ts-expect-error - ignore
      const result1 = await toolsNode(state1 as StateType)
      expect(result1).toEqual(state1)
      // state with AIMessage but empty tool_calls array
      const aiEmpty = new AIMessage({ content: 'no calls', tool_calls: [] })
      const state2 = { userInput: 'x', messages: [aiEmpty] }
      // @ts-expect-error - ignore
      const result2 = await toolsNode(state2 as StateType)
      expect(result2).toEqual(state2)
    })

    it('should handle unknown tools by emitting an error ToolMessage', async () => {
      const mockTool = {
        name: 'KnownTool',
        description: '',
        invoke: vi.fn().mockResolvedValue('ok'),
      } as any
      const toolsNode = createToolsNode([mockTool])
      // AIMessage refers to a tool name not in the tools array
      const aiMessage = new AIMessage({
        content: 'call unknown',
        tool_calls: [{ name: 'UnknownTool', args: {}, id: 'u1' }],
      })
      const state = {
        userInput: new HumanMessage('Test Input'),
        messages: [aiMessage],
      } as StateType
      const result = await toolsNode(state)
      // second message should be a ToolMessage for unknown tool error
      expect(result.messages).toHaveLength(2)
      const toolMsg = result.messages?.[1] as ToolMessage
      expect(toolMsg).toBeDefined()
      expect(toolMsg.name).toBe('UnknownTool')
      expect(toolMsg.content).toContain("Error: Tool 'UnknownTool' not found")
      expect(toolMsg.tool_call_id).toBe('u1')
    })
  })

  // Tests for LLM node
  describe('LLMNode', () => {
    it('should call LLM with messages and update messages array', async () => {
      // Create a simple mock LLM with an invoke method
      const mockResponse = new AIMessage({ content: 'LLM Response' })
      const mockLLM = {
        invoke: vi.fn().mockResolvedValue(mockResponse),
        // Adding necessary properties to satisfy the BaseChatModel interface
        _modelType: () => 'chat_model',
        lc_serializable: true,
        lc_namespace: ['test'],
      }

      const llmNode = createLLMNode(mockLLM as any)
      const messages = [new SystemMessage('Test Context')]
      const state: StateType = {
        userInput: new HumanMessage('Test Input'),
        messages,
      }

      const result = await llmNode(state)

      expect(mockLLM.invoke).toHaveBeenCalledWith(messages)
      expect(result.messages).toHaveLength(2)
      expect(result.messages?.[1]).toBeInstanceOf(AIMessage)
      expect(result.messages?.[1].content).toBe('LLM Response')
    })

    it('should extract content from object response', async () => {
      // Create a simple mock LLM with an invoke method that returns a specific response
      const mockResponse = new AIMessage({ content: 'LLM Content Response' })
      const mockLLM = {
        invoke: vi.fn().mockResolvedValue(mockResponse),
        // Adding necessary properties to satisfy the BaseChatModel interface
        _modelType: () => 'chat_model',
        lc_serializable: true,
        lc_namespace: ['test'],
      }

      const llmNode = createLLMNode(mockLLM as any)
      const state: StateType = {
        userInput: new HumanMessage('Test Input'),
        messages: [],
      }

      const result = await llmNode(state)

      expect(result.messages).toHaveLength(1)
      expect(result.messages?.[0]).toBeInstanceOf(AIMessage)
      expect(result.messages?.[0].content).toBe('LLM Content Response')
    })
  })

  // Tests for parse node
  describe('ParseNode', () => {
    const TestSchema = z.object({
      name: z.string(),
      value: z.number(),
    })

    it('should parse valid JSON and validate against schema', async () => {
      const parseNode = createParseNode(TestSchema)

      // Create a state with an AIMessage containing JSON content
      const aiMessage = new AIMessage({
        content: '{"name": "Test", "value": 42}',
      })

      const state: StateType = {
        userInput: new HumanMessage('Test Input'),
        messages: [aiMessage],
      }

      const result = await parseNode(state)

      expect(result.result).toEqual({
        name: 'Test',
        value: 42,
      })
    })

    it('should extract JSON from code blocks', async () => {
      const parseNode = createParseNode(TestSchema)

      // Create a state with an AIMessage containing JSON in code blocks
      const aiMessage = new AIMessage({
        content: '```json\n{"name": "Test", "value": 42}\n```',
      })

      const state: StateType = {
        userInput: new HumanMessage('Test Input'),
        messages: [aiMessage],
      }

      const result = await parseNode(state)

      expect(result.result).toEqual({
        name: 'Test',
        value: 42,
      })
    })

    it('should throw error on invalid JSON', async () => {
      const parseNode = createParseNode(TestSchema)

      // Create a state with an AIMessage containing invalid JSON
      const aiMessage = new AIMessage({
        content: 'Invalid JSON',
      })

      const state: StateType = {
        userInput: new HumanMessage('Test Input'),
        messages: [aiMessage],
      }

      await expect(parseNode(state)).rejects.toThrow(
        'Failed to parse JSON output from agent',
      )
    })

    it('should throw error on schema validation failure', async () => {
      const parseNode = createParseNode(TestSchema)

      // Create a state with an AIMessage containing JSON that doesn't match schema
      const aiMessage = new AIMessage({
        content: '{"name": "Test", "value": "not a number"}',
      })

      const state: StateType = {
        userInput: new HumanMessage('Test Input'),
        messages: [aiMessage],
      }

      await expect(parseNode(state)).rejects.toThrow('Output validation failed')
    })
  })
})
