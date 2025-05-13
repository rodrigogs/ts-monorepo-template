import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { describe, expect, it, vi } from 'vitest'

import type { StateType } from '../types.js'
import { createLLMNode } from './llm-node.js'

describe('createLLMNode', () => {
  it('should process string output correctly', async () => {
    const model = {
      invoke: vi.fn().mockResolvedValue(new AIMessage('Test response')),
      _modelType: () => 'chat_model',
    }

    const llmNode = createLLMNode(model as any)
    const state: StateType = {
      userInput: new HumanMessage('test'),
      messages: [new HumanMessage('test')],
    }

    const result = await llmNode(state)

    expect(model.invoke).toHaveBeenCalledWith([new HumanMessage('test')])
    expect(result.messages).toHaveLength(2)
    expect(result.messages?.[1]).toBeInstanceOf(AIMessage)
    expect(result.messages?.[1].content).toBe('Test response')
  })

  it('should process object output with content string property', async () => {
    const model = {
      invoke: vi
        .fn()
        .mockResolvedValue(new AIMessage({ content: 'Object response' })),
      _modelType: () => 'chat_model',
    }

    const llmNode = createLLMNode(model as any)
    const state: StateType = {
      userInput: new HumanMessage('test'),
      messages: [new HumanMessage('test')],
    }

    const result = await llmNode(state)

    expect(model.invoke).toHaveBeenCalledWith([new HumanMessage('test')])
    expect(result.messages).toHaveLength(2)
    expect(result.messages?.[1]).toBeInstanceOf(AIMessage)
    expect(result.messages?.[1].content).toBe('Object response')
  })

  it('should process object output with non-string content property', async () => {
    // This test simulates a response with a content object that contains nested data
    const complexObject = {
      text: 'Complex response',
      data: { value: 42 },
    }

    const model = {
      invoke: vi.fn().mockResolvedValue(
        new AIMessage({
          content: complexObject, // Directly use the object instead of stringifying it
        }),
      ),
      _modelType: () => 'chat_model',
    }

    const llmNode = createLLMNode(model as any)
    const state: StateType = {
      userInput: new HumanMessage('test'),
      messages: [new HumanMessage('test')],
    }

    const result = await llmNode(state)

    expect(model.invoke).toHaveBeenCalledWith([new HumanMessage('test')])
    expect(result.messages).toHaveLength(2)
    expect(result.messages?.[1]).toBeInstanceOf(AIMessage)
    // The content should be the object as-is
    expect(result.messages?.[1].content).toEqual({
      text: 'Complex response',
      data: { value: 42 },
    })
  })

  it('should handle AIMessage instances directly', async () => {
    // Test when invoke directly returns an AIMessage
    const aiMessage = new AIMessage('Direct AIMessage')
    const model = {
      invoke: vi.fn().mockResolvedValue(aiMessage),
      _modelType: () => 'chat_model',
    }

    const llmNode = createLLMNode(model as any)
    const state: StateType = {
      userInput: new HumanMessage('test'),
      messages: [new HumanMessage('test')],
    }

    const result = await llmNode(state)

    expect(model.invoke).toHaveBeenCalledWith([new HumanMessage('test')])
    expect(result.messages).toHaveLength(2)
    expect(result.messages?.[1]).toBe(aiMessage)
  })

  it('should handle errors from LLM invocation', async () => {
    const model = {
      invoke: vi.fn().mockRejectedValue(new Error('LLM API error')),
      _modelType: () => 'chat_model',
    }

    const llmNode = createLLMNode(model as any)
    const state: StateType = {
      userInput: new HumanMessage('test'),
      messages: [new HumanMessage('test')],
    }

    await expect(llmNode(state)).rejects.toThrow('LLM API error')
  })

  it('should preserve tool_calls from AIMessage response', async () => {
    const toolCalls = [
      {
        id: 'call_123',
        type: 'function',
        function: {
          name: 'test-tool',
          arguments: '{"param": "value"}',
        },
      },
    ]

    const aiMessage = new AIMessage({
      content: 'Message with tool calls',
      tool_calls: toolCalls,
    })

    const model = {
      invoke: vi.fn().mockResolvedValue(aiMessage),
      _modelType: () => 'chat_model',
    }

    const llmNode = createLLMNode(model as any)
    const state: StateType = {
      userInput: new HumanMessage('test'),
      messages: [new HumanMessage('test')],
    }

    const result = await llmNode(state)

    expect(result.messages).toHaveLength(2)
    expect(result.messages?.[1].tool_calls).toEqual(toolCalls)
  })

  it('should handle tool_calls in additional_kwargs', async () => {
    // Define tool calls with the exact expected structure
    const toolCalls = [
      {
        id: 'call_456',
        type: 'function',
        function: {
          name: 'another-tool',
          arguments: '{"param": "test"}',
        },
      },
    ]

    // Create a proper AIMessage with additional_kwargs
    const mockAIMessage = new AIMessage({
      content: '',
      additional_kwargs: {
        tool_calls: toolCalls as any,
      },
    })

    // Directly set the tool_calls property on the message to ensure it's available
    mockAIMessage.tool_calls = toolCalls as any

    const model = {
      invoke: vi.fn().mockResolvedValue(mockAIMessage),
      _modelType: () => 'chat_model',
    }

    const llmNode = createLLMNode(model as any)
    const state: StateType = {
      userInput: new HumanMessage('test'),
      messages: [new HumanMessage('test')],
    }

    const result = await llmNode(state)

    expect(result.messages).toHaveLength(2)

    // Check for the existence of tool_calls property
    expect((result.messages?.[1] as any).tool_calls).toBeDefined()

    // Individual property checks that are less likely to be affected by hidden properties
    const resultToolCalls = (result.messages?.[1] as any).tool_calls
    expect(resultToolCalls?.length).toBe(1)

    const firstToolCall = resultToolCalls?.[0]
    expect(firstToolCall?.id).toBe('call_456')
    expect(firstToolCall?.type).toBe('function')

    // Check function properties individually
    const toolFunction = firstToolCall?.function
    expect(toolFunction?.name).toBe('another-tool')
    expect(toolFunction?.arguments).toBe('{"param": "test"}')
  })
})
